const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorMiddleware');
const { swaggerUi, specs } = require('./config/swagger');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

app.set('io', io);
app.set('trust proxy', 1);

// ==================== SECURITY ====================
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", ...allowedOrigins],
    }
  } : false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session support for OAuth state management
app.use(session({
  secret: process.env.SESSION_SECRET || (process.env.JWT_SECRET || 'dev-session-secret'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// HTTP Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later', code: 'RATE_LIMIT_EXCEEDED' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/strict-auth/login', authLimiter);

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP requests. Please try again later.', code: 'OTP_RATE_LIMIT' }
});
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/verify-otp', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many verification attempts. Please try again later.', code: 'VERIFY_RATE_LIMIT' }
}));

// ==================== DATABASE ====================
require('./config/db');

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ==================== ROUTES ====================
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

// Strict Auth Routes
app.use('/api/strict-auth', require('./routes/strictAuth'));
app.use('/api/admin/approval', require('./routes/adminApproval'));
app.use('/api/teacher/documents', require('./routes/teacherDocuments'));
app.use('/api/parent/invitations', require('./routes/parentInvitations'));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '2.0.0',
  uptime: process.uptime()
}));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../Frontend/dist')));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ success: false, message: 'API route not found.', code: 'ROUTE_NOT_FOUND' });
    res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
  });
}

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      logger.debug(`User ${userId} joined notification room`);
    }
  });

  socket.on('typing', (data) => {
    if (data?.receiverId) {
      socket.to(`user_${data.receiverId}`).emit('typing', {
        senderId: data.senderId,
        isTyping: data.isTyping
      });
    }
  });

  socket.on('disconnect', () => {
    logger.debug(`Client disconnected: ${socket.id}`);
  });
});

// ==================== START SERVER ====================
server.listen(PORT, () => {
  logger.info(`E-Quran Academy Backend running at http://localhost:${PORT}`);
  logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
  if (process.env.FRONTEND_URL) {
    logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
  }
});
