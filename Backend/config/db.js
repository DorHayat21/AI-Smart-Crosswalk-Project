import mongoose from 'mongoose';

// Function to handle database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[System] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[System] Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;