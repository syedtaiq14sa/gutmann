require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const inquiryRoutes = require('./src/routes/inquiries');
const qcRoutes = require('./src/routes/qc');
const technicalRoutes = require('./src/routes/technical');
const estimationRoutes = require('./src/routes/estimation');
const ceoRoutes = require('./src/routes/ceo');
const dashboardRoutes = require('./src/routes/dashboard');
const notificationRoutes = require('./src/routes/notifications');
const clientRoutes = require('./src/routes/client');
const logger = require('./src/utils/logger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Build the list of allowed CORS origins from env vars
const allowedOrigins = (() => {
  if (process.env.CORS_ALLOWED_ORIGINS) {
    return process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  }
  const defaults = [
    'https://gutmann-frontend.onrender.com',
    'https://gutmann-backend.onrender.com',
    process.env.FRONTEND_URL,
    'http://localhost:3000',
  ];
  return defaults.filter(Boolean);
})();

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. server-to-server, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    }
  },
  credentials: true,
};

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger.httpLogger);

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', apiLimiter);

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/qc', qcRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/ceo', ceoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/client', clientRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Socket.IO
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;
server.listen(PORT, () => {
  logger.info(`GUTMANN Backend running on port ${PORT}`);
});

module.exports = { app, server, io };
