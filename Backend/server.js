const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorMiddleware');
const { swaggerUi, specs } = require('./config/swagger');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);
app.set('trust proxy', 1);

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

// ==================== BODY PARSING ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== REQUEST LOGGING ====================
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: message => logger.info(message.trim()) },
  skip: (req) => req.url === '/api/health',
}));

// ==================== RATE LIMITING ====================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.', code: 'AUTH_RATE_LIMIT' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/strict-auth/login', authLimiter);

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please try again later.', code: 'OTP_RATE_LIMIT' },
});
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/verify-otp', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many verification attempts. Please try again later.', code: 'VERIFY_RATE_LIMIT' },
}));

// ==================== DATABASE ====================
const db = require('./config/db');

// ==================== API DOCUMENTATION ====================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-Quran Academy API Docs',
}));

// ==================== API ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/strict-auth', require('./routes/strictAuth'));
app.use('/api/admin/approval', require('./routes/adminApproval'));
app.use('/api/teacher/documents', require('./routes/teacherDocuments'));
app.use('/api/parent/invitations', require('./routes/parentInvitations'));

// ==================== HEALTH CHECK ====================
app.get('/api/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  const status = dbHealthy ? 'healthy' : 'degraded';
  const statusCode = dbHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV,
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      socket: io.engine ? 'running' : 'stopped',
    },
    uptime: Math.floor(process.uptime()),
  });
});

// ==================== STATIC FILES ====================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: NODE_ENV === 'production' ? '7d' : 0,
  etag: true,
}));

// ==================== PRODUCTION SPA SERVING ====================
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../Frontend/dist'), {
    maxAge: '1y',
    etag: true,
  }));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found.',
        code: 'ROUTE_NOT_FOUND'
      });
    }
    res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
  });
}

// ==================== 404 HANDLER ====================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== SOCKET.IO ====================
const connectedUsers = new Map();

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('join', (userId) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
    connectedUsers.set(socket.id, userId);
    logger.debug(`User ${userId} joined notification room`);
  });

  socket.on('typing', (data) => {
    if (!data?.receiverId || !data?.senderId) return;
    socket.to(`user_${data.receiverId}`).emit('typing', {
      senderId: data.senderId,
      isTyping: data.isTyping,
    });
  });

  socket.on('disconnect', () => {
    const userId = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    logger.debug(`Socket disconnected: ${socket.id}${userId ? ` (user ${userId})` : ''}`);
  });
});

// ==================== GRACEFUL SHUTDOWN ====================
function gracefulShutdown(signal) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed.');
    io.close(() => {
      logger.info('Socket.IO server closed.');
      process.exit(0);
    });
  });

  setTimeout(() => {
    logger.error('Forceful shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// ==================== START SERVER ====================
server.listen(PORT, () => {
  logger.info(`E-Quran Academy Backend running on port ${PORT} [${NODE_ENV}]`);
  logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`Frontend URL: ${FRONTEND_URL}`);
});

module.exports = { app, server, io };
