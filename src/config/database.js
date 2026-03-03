const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/identity-reconciliation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: process.env.DB_POOL_SIZE || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB (Attempt ${6 - retries}/5):`, { 
      error: error.message 
    });
    
    if (retries > 0) {
      const delay = (6 - retries) * 2000; // Exponential backoff: 2s, 4s, 6s, 8s, 10s
      logger.info(`Retrying connection in ${delay}ms...`);
      setTimeout(() => connectDB(retries - 1), delay);
    } else {
      logger.error('Failed to connect to MongoDB after 5 retries. Exiting...');
      console.error(`Error connecting to MongoDB: ${error.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
