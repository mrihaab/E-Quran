const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== DATABASE ====================
// Import db to trigger connection test on startup
require('./config/db');

// ==================== ROUTES ====================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const enrollmentRoutes = require('./routes/enrollments');
const messageRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const courseRoutes = require('./routes/courses');
const contactRoutes = require('./routes/contact');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', authRoutes);          // /api/register, /api/login
app.use('/api/users', userRoutes);    // /api/users/:id
app.use('/api/teachers', teacherRoutes); // /api/teachers
app.use('/api/classes', classRoutes); // /api/classes
app.use('/api/enrollments', enrollmentRoutes); // /api/enrollments
app.use('/api/messages', messageRoutes); // /api/messages
app.use('/api/payments', paymentRoutes); // /api/payments
app.use('/api/courses', courseRoutes); // /api/courses
app.use('/api/contact', contactRoutes); // /api/contact
app.use('/api/settings', settingsRoutes); // /api/settings
app.use('/api/admin', adminRoutes);   // /api/admin/*

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, '../Frontend/dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found.' });
  res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n🚀 E-Quran Academy Backend running at http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`\n📋 Available API Routes:`);
  console.log(`   POST   /api/register`);
  console.log(`   POST   /api/login`);
  console.log(`   GET    /api/users/:id`);
  console.log(`   PUT    /api/users/:id`);
  console.log(`   GET    /api/teachers`);
  console.log(`   GET    /api/classes`);
  console.log(`   POST   /api/enrollments`);
  console.log(`   GET    /api/messages/:userId`);
  console.log(`   POST   /api/payments`);
  console.log(`   GET    /api/courses`);
  console.log(`   POST   /api/contact`);
  console.log(`   GET    /api/settings/:userId`);
  console.log(`   GET    /api/admin/stats`);
  console.log(`   GET    /api/admin/users`);
  console.log('');
});
