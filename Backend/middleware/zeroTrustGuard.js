const express = require('express');
const { SECURITY_POLICY } = require('../security/securityPolicy');

const DEFAULT_REQUIRED_MIDDLEWARES = ['verifyToken', 'authGuard', 'approvalMiddleware'];
const routeMiddlewareRegistry = new Map();
const ROUTER_PREFIX_KEY = '__zeroTrustPrefix';
const securityHealthCounters = {
  missingAuthCount: 0,
  missingApprovalCount: 0,
  missingRoleCount: 0
};

function createMetricsReporter() {
  // Default behavior remains in-memory + console output.
  if (process.env.ZERO_TRUST_METRICS === 'redis') {
    // Optional pluggable interface for external sinks (e.g., Redis publisher).
    const external = global.__ZERO_TRUST_METRICS_LOGGER;
    if (external && typeof external.emit === 'function') {
      return (payload) => {
        try {
          external.emit('ZERO_TRUST_HEALTH', payload);
        } catch (_) {
          console.log('[ZERO_TRUST_HEALTH]', payload);
        }
      };
    }
  }

  return (payload) => {
    console.log('[ZERO_TRUST_HEALTH]', payload);
  };
}

const reportMetrics = createMetricsReporter();
const healthInterval = setInterval(() => {
  reportMetrics({ ...securityHealthCounters, timestamp: new Date().toISOString() });
}, 5 * 60 * 1000);
if (typeof healthInterval.unref === 'function') {
  healthInterval.unref();
}

function normalizePath(url) {
  if (!url || typeof url !== 'string') return '/';
  return url.split('?')[0];
}

function normalizeMiddlewareName(name) {
  if (!name || typeof name !== 'string') return '';
  if (name === 'requireRole') return 'roleMiddleware';
  return name;
}

function safeLayerToString(layer) {
  try {
    return String(layer?.regexp || '');
  } catch (_) {
    return '';
  }
}

function extractPrefixFromLayer(layer) {
  const raw = safeLayerToString(layer);
  const normalized = raw.replace(/\\/g, '');
  const match = normalized.match(/\/api\/[A-Za-z0-9_-]+/);
  return match ? match[0] : null;
}

function dedupeNames(names) {
  return [...new Set(names.filter(Boolean).map(normalizeMiddlewareName))];
}

function matchRouteByType(pathname, rule = {}) {
  const path = rule.path || '';
  const type = rule.type || 'prefix';

  if (!path) return false;

  if (type === 'exact') {
    return pathname === path;
  }

  if (type === 'wildcard') {
    const wildcardPrefix = path.endsWith('*') ? path.slice(0, -1) : path;
    return pathname.startsWith(wildcardPrefix);
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

function findMatchedPolicy(pathname, rules = []) {
  for (const rule of rules) {
    if (matchRouteByType(pathname, rule)) {
      return rule;
    }
  }
  return null;
}

function layerMatchesPath(layer, pathname) {
  if (!layer) return false;
  if (!layer.regexp) return true;

  try {
    return layer.regexp.test(pathname);
  } catch (_) {
    return false;
  }
}

function collectLayerMiddlewareNames(layer) {
  const names = [];
  const directName = layer?.name;
  const handleName = layer?.handle?.name;

  if (directName && directName !== 'bound dispatch' && directName !== 'router') {
    names.push(directName);
  }
  if (handleName && handleName !== 'bound dispatch' && handleName !== 'router') {
    names.push(handleName);
  }

  return names;
}

function collectNamesFromArgs(args) {
  const names = [];

  for (const item of args) {
    if (typeof item === 'function') {
      const fnName = normalizeMiddlewareName(item.name || '');
      if (fnName && fnName !== 'anonymous') names.push(fnName);
      continue;
    }

    if (Array.isArray(item)) {
      names.push(...collectNamesFromArgs(item));
    }
  }

  return dedupeNames(names);
}

function registerRouteMiddleware(prefix, middlewareNames) {
  if (!prefix || !Array.isArray(middlewareNames) || middlewareNames.length === 0) return;
  const existing = routeMiddlewareRegistry.get(prefix) || [];
  routeMiddlewareRegistry.set(prefix, dedupeNames([...existing, ...middlewareNames]));
}

function patchRouterUseForRegistry() {
  const routerPrototype = express?.Router?.prototype;
  if (!routerPrototype || routerPrototype.__zeroTrustWrappedUse) return;

  const originalUse = routerPrototype.use;
  routerPrototype.use = function patchedUse(...args) {
    try {
      const first = args[0];
      const pathArg = typeof first === 'string' ? first : null;
      const middlewareArgs = pathArg ? args.slice(1) : args;
      const middlewareNames = collectNamesFromArgs(middlewareArgs);

      const parentPrefix = this[ROUTER_PREFIX_KEY] || '';
      const localPrefix = pathArg || '';
      const fullPrefix = normalizePath(`${parentPrefix}${localPrefix}`) || '/';

      registerRouteMiddleware(fullPrefix, middlewareNames);

      // Propagate mount prefix into nested routers when possible.
      for (const arg of middlewareArgs) {
        if (arg && Array.isArray(arg.stack) && typeof arg.use === 'function') {
          arg[ROUTER_PREFIX_KEY] = fullPrefix;
        }
      }
    } catch (_) {
      // Registry collection must never impact route registration.
    }

    return originalUse.apply(this, args);
  };

  routerPrototype.__zeroTrustWrappedUse = true;
}

patchRouterUseForRegistry();

function collectMatchedMiddlewareNamesFromStack(stack, pathname, method, collector) {
  if (!Array.isArray(stack)) return;

  for (const layer of stack) {
    if (!layerMatchesPath(layer, pathname)) continue;

    collector.push(...collectLayerMiddlewareNames(layer));

    if (layer?.route) {
      const methods = layer.route.methods || {};
      if (!methods[method]) continue;

      const routeStack = layer.route.stack || [];
      for (const routeLayer of routeStack) {
        collector.push(...collectLayerMiddlewareNames(routeLayer));
      }
      continue;
    }

    const nestedStack = layer?.handle?.stack;
    if (Array.isArray(nestedStack)) {
      collectMatchedMiddlewareNamesFromStack(nestedStack, pathname, method, collector);
    }
  }
}

function collectActiveMiddlewareNames(req) {
  const names = [];
  const pathname = normalizePath(req?.originalUrl || req?.url || '');
  const method = String(req?.method || 'GET').toLowerCase();
  const appStack = req?.app?._router?.stack || [];

  collectMatchedMiddlewareNamesFromStack(appStack, pathname, method, names);

  // Optional explicit metadata fallback for future route-level annotation.
  if (Array.isArray(req?.securityChain) && req.securityChain.length > 0) {
    names.push(...req.securityChain);
  }

  return dedupeNames(names);
}

function computeMissingMiddleware(req, requiredNames) {
  const activeMiddlewareNames = collectActiveMiddlewareNames(req);
  return requiredNames.filter((name) => !activeMiddlewareNames.includes(normalizeMiddlewareName(name)));
}

function updateMissingCounters(missing, requiredNames) {
  if (missing.includes('verifyToken')) {
    securityHealthCounters.missingAuthCount += 1;
  }

  if (missing.includes('approvalMiddleware')) {
    securityHealthCounters.missingApprovalCount += 1;
  }

  const roleRequired = requiredNames.some((name) => normalizeMiddlewareName(name) === 'roleMiddleware');
  const roleMissing = missing.some((name) => normalizeMiddlewareName(name) === 'roleMiddleware');
  if (roleRequired && roleMissing) {
    securityHealthCounters.missingRoleCount += 1;
  }
}

function getRequiredMiddlewareChain(req) {
  if (Array.isArray(req?.securityChain) && req.securityChain.length > 0) {
    return dedupeNames(req.securityChain);
  }
  return [...DEFAULT_REQUIRED_MIDDLEWARES];
}

function getRegisteredMiddlewareNames(pathname) {
  let bestMatch = null;
  for (const [prefix, names] of routeMiddlewareRegistry.entries()) {
    if (!prefix || prefix === '/') continue;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!bestMatch || prefix.length > bestMatch.prefix.length) {
        bestMatch = { prefix, names };
      }
    }
  }
  return bestMatch ? bestMatch.names : [];
}

function zeroTrustGuard(req, res, next) {
  const pathname = normalizePath(req?.originalUrl || req?.url || '');

  const matchedPublic = findMatchedPolicy(pathname, SECURITY_POLICY.publicRoutes);
  const matchedProtected = findMatchedPolicy(pathname, SECURITY_POLICY.protectedRoutes);
  req.__zeroTrustReport = {
    route: pathname,
    method: req?.method || null,
    isProtectedRoute: Boolean(matchedProtected),
    policyRoute: matchedProtected?.path || matchedPublic?.path || null,
    policyType: matchedProtected?.type || matchedPublic?.type || null,
    missingAuthMiddleware: false,
    missingApprovalMiddleware: false,
    missingRoleMiddleware: false,
    invalidMiddlewareOrder: false,
    ownershipViolationDetected: false,
    missing: []
  };

  if (matchedPublic) {
    return next();
  }

  if (!matchedProtected) {
    return next();
  }

  const requiredChain = getRequiredMiddlewareChain(req);
  const missingFromRuntime = computeMissingMiddleware(req, requiredChain);
  const registeredNames = getRegisteredMiddlewareNames(pathname);
  const missingFromRegistry = requiredChain.filter(
    (name) => !registeredNames.includes(normalizeMiddlewareName(name))
  );
  const missing = dedupeNames([...missingFromRuntime, ...missingFromRegistry]);
  const normalizedRequired = requiredChain.map(normalizeMiddlewareName);

  const verifyIndex = normalizedRequired.indexOf('verifyToken');
  const authGuardIndex = normalizedRequired.indexOf('authGuard');
  const approvalIndex = normalizedRequired.indexOf('approvalMiddleware');
  const invalidMiddlewareOrder = (
    verifyIndex !== -1
    && authGuardIndex !== -1
    && approvalIndex !== -1
    && !(verifyIndex < authGuardIndex && authGuardIndex < approvalIndex)
  );

  req.__zeroTrustReport = {
    ...req.__zeroTrustReport,
    required: requiredChain,
    missing,
    missingAuthMiddleware: missing.includes('verifyToken'),
    missingApprovalMiddleware: missing.includes('approvalMiddleware'),
    missingRoleMiddleware: missing.includes('roleMiddleware'),
    invalidMiddlewareOrder,
    validationSources: {
      runtimeMissing: missingFromRuntime,
      registryMissing: missingFromRegistry
    }
  };

  if (missing.length > 0) {
    updateMissingCounters(missing, requiredChain);
    console.warn('[ZERO_TRUST_WARNING]', {
      route: pathname,
      method: req?.method || null,
      policyRoute: matchedProtected.path,
      policyType: matchedProtected.type,
      required: requiredChain,
      missing,
      validationSources: req.__zeroTrustReport.validationSources
    });
  }

  // future enforcement mode:
  // if (STRICT_MODE === true) -> block instead of warn

  return next();
}

module.exports = zeroTrustGuard;
