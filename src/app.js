const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const customerRoutes  = require('./routes/customerRoutes');
const dealRoutes      = require('./routes/dealRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes  = require('./routes/activityRoutes');
const reportsRoutes   = require('./routes/reportsRoutes');
const roleRoutes      = require('./routes/roleRoutes');
const leadRoutes      = require('./routes/leadRoutes');
const AppError = require('./utils/appError');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/customers',  customerRoutes);
app.use('/api/deals',      dealRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports',    reportsRoutes);
app.use('/api/roles',      roleRoutes);
app.use('/api/leads',      leadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// 404
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
