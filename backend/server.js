const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const initDatabase = require('./src/config/initDb');
const errorHandler = require('./src/middleware/errorHandler');

// Route handlers
const authRoutes = require('./src/routes/auth.routes');
const scanRoutes = require('./src/routes/scan.routes');
const treeRoutes = require('./src/routes/tree.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure models directory exists
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow web app to load drone image uploads
  })
);

app.use(
  cors({
    origin: '*', // Allow access from Vite frontend and drone clients
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Static uploads route
app.use('/uploads', express.static(uploadsDir));

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CocoScout Drone Coconut Maturity & Inventory API',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/inventory', inventoryRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

// Start server after verifying / initializing database
async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('[CocoScout Server] DB setup notice:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🥥 CocoScout API Server running on http://localhost:${PORT}`);
    console.log(`   - Uploads: http://localhost:${PORT}/uploads`);
    console.log(`   - Health check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer();

module.exports = app;
