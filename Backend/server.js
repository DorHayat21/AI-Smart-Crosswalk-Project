import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // Import DB Connection
import crosswalkRoutes from './routes/crosswalkRoutes.js'; // Import Routes
import alertRoutes from './routes/alertRoutes.js';

// Config
dotenv.config();
connectDB(); // Execute DB Connection

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());

// Routes Mounting
// Requests to /crosswalks will be handled by crosswalkRoutes
app.use('/crosswalks', crosswalkRoutes);

// Requests to /ai/alerts or /alerts will be handled by alertRoutes
// Note: In alertRoutes we used '/' so here we need to be careful with paths OR adjust the router.
// Let's use specific mounting for clarity:
app.use('/ai/alerts', alertRoutes); // For POST (AI)
app.use('/alerts', alertRoutes);    // For GET (Dashboard)

// Base Route
app.get('/', (req, res) => {
  res.send('AI Smart Crosswalk Backend is Running (Refactored Structure).');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});