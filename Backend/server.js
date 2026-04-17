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
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Attach IO to request for controllers
app.set('io', io);

// ==================== MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging (Morgan + Winston)
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many requests, please try again later", code: "RATE_LIMIT_EXCEEDED" }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// OTP-specific rate limiting (stricter)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many OTP requests. Please try again later.", code: "OTP_RATE_LIMIT" }
});
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/verify-otp', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many verification attempts. Please try again later.", code: "VERIFY_RATE_LIMIT" }
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

// NEW STRICT AUTH ROUTES (Phase 1-5)
app.use('/api/strict-auth', require('./routes/strictAuth'));
app.use('/api/admin/approval', require('./routes/adminApproval'));
app.use('/api/teacher/documents', require('./routes/teacherDocuments'));
app.use('/api/parent/invitations', require('./routes/parentInvitations'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date(), version: '1.0.0' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../Frontend/dist')));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found.' });
    res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
  });
}

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`User ${userId} joined their notification room`);
  });

  socket.on('typing', (data) => {
    // Broadcast typing status to conversation partner
    socket.to(`user_${data.receiverId}`).emit('typing', {
      senderId: data.senderId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// ==================== START SERVER ====================
server.listen(PORT, () => {
  logger.info(`🚀 E-Quran Academy Backend running at http://localhost:${PORT}`);
  logger.info(`📖 API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});
