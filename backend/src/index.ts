import app from './app';
import { sequelize } from './config/database';
import { FTSService } from './services/fts.service';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('Database models synchronized.');

    // Initialize FTS5 full-text search
    await FTSService.initialize();
    console.log('FTS5 search initialized.');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
