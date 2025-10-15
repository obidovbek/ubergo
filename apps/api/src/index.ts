/**
 * Server Entry Point
 */

import app from './app.js';
import { config } from './config/index.js';

const PORT = config.server.port;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.server.env}`);
  console.log(`🔗 API: http://localhost:${PORT}${config.server.apiPrefix}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
