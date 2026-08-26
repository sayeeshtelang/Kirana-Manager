const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not set. This project requires MongoDB Atlas.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      // Modern mongoose (8.x) does not need most legacy options,
      // but these are safe / explicit for Atlas connections.
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
