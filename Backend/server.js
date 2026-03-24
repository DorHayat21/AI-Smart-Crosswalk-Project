import express from "express"; // Web framework for Node.js
import dotenv from "dotenv"; // For loading environment variables from .env file
import cors from "cors"; // Middleware to enable CORS (Cross-Origin Resource Sharing)
import { spawn } from "child_process"; // For Python AI Engine Integration
import connectDB from "./config/db.js"; // Database Connection
import crosswalkRoutes from "./routes/crosswalkRoutes.js"; // Crosswalk API Routes
import alertRoutes from "./routes/alertRoutes.js"; // Alert API Routes
import Alert from "./models/Alert.js"; // Alert Model for Database Interaction
import path from "path"; // For handling file paths in a way that works across different operating systems
import { fileURLToPath } from "url"; // To get __dirname in ES modules
import cloudinary from "./config/cloudinary.js"; // Cloudinary integration
import { createServer } from "http"; // Required for Socket.io to wrap express
import { Server } from "socket.io"; // Real-time engine

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Load environment variables from .env file
connectDB(); // Execute DB Connection

const app = express();
const httpServer = createServer(app); // Create an HTTP server from the express app
const io = new Server(httpServer, {
  cors: { origin: "*" }, // Enable CORS for Socket.io
});

const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set in .env

// Middleware Setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies for API requests

// This allows the browser to access the images created by the AI
const imagesPath = path.resolve(__dirname, "ai_engine", "output_images");
app.use("/output_images", express.static(imagesPath)); // Serve the output_images folder as static files at the /output_images route. For backup. we will use Cloudinary URLs in production, but this allows local access during development and testing.

// Log the path to terminal for verification
console.log(`[Server] Serving static files from: ${imagesPath}`);

// --- Socket.io Connection Monitoring ---
io.on("connection", (socket) => {
  console.log(`[Socket] A client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log("[Socket] Client disconnected"));
});

// --- AI Engine Integration (Python Bridge) ---

// Function to initialize and monitor the Python AI service
const startAIEngine = () => {
  console.log("Start Initializing AI Engine...");

  // Start Python process to run the YOLO service script
  const pythonProcess = spawn("python", ["./ai_engine/yolo_service.py"]);

  // Listen for data output from the Python script (JSON format)
  pythonProcess.stdout.on("data", async (data) => {
    try {
      const rawData = data.toString(); // Convert Buffer to String

      // Handle multiple JSON messages or loading logs
      const lines = rawData.split("\n").filter((line) => line.trim() !== ""); // Split by newlines and ignore empty lines

      for (const line of lines) {
        const message = JSON.parse(line); // Parse JSON message from Python

        // Check if analysis is complete and a hazard is detected
        if (message.event === "ANALYSIS_COMPLETE") {
          console.log(
            `AI Log: File ${message.file} analyzed. Danger: ${message.is_dangerous}`,
          );

          if (message.is_dangerous) {
            console.log("Hazard detected! Uploading to Cloudinary...");

            // Define local path for the analyzed image
            const localFilePath = path.join(imagesPath, message.file);

            try {
              // Upload the analyzed image to Cloudinary
              const uploadResponse = await cloudinary.uploader.upload(
                localFilePath,
                {
                  folder: "smart_crosswalk_alerts",
                },
              );

              console.log(
                "Image uploaded to Cloudinary successfully:",
                uploadResponse.secure_url,
              );

              // Create a new Alert document based on your Schema
              const newAlert = new Alert({
                // Placeholder ID - In a real scenario, this would match a specific camera/location
                crosswalkId: "699f27d6b6cae8b2c7d16400", // Example ObjectId
                // Use the secure URL from Cloudinary instead of localhost
                imageUrl: uploadResponse.secure_url,
                description:
                  message.description ||
                  "Automatic AI Detection: Danger detected.",
                reasons: message.reasons || [], // Save the reasons identified by AI
                detectionDistance: message.detection_distance || 0, // Save the distance calculated by the AI engine
                isHazard: true,
                ledActivated: true,
                detectedObjectsCount: message.person_count || 0, // Save the count of detected people (if provided by AI)
                timestamp: new Date(),
              });

              const savedAlert = await newAlert.save();

              // Populate the crosswalkId reference to get full crosswalk details (Location, Name, etc.)
              const populatedAlert = await Alert.findById(
                savedAlert._id,
              ).populate("crosswalkId");

              console.log(
                "Alert saved successfully to MongoDB with Cloudinary URL.",
              );

              // --- REAL-TIME NOTIFICATION ---
              // Notify all connected clients about the new hazard in real-time
              // Emit the populated alert which now includes full crosswalk details and the new distance field
              io.emit("new_alert", populatedAlert);
              console.log("[Socket] Alert event emitted with populated data.");
            } catch (uploadError) {
              console.error("Cloudinary or Socket Error:", uploadError);
            }
          }
        }
      }
    } catch (error) {
      // Ignore non-JSON logs (like YOLO model loading text)
    }
  });

  // Handle potential errors in the Python process
  pythonProcess.stderr.on("data", (data) => {
    console.error(`AI Engine stderr: ${data}`);
  });

  // Automatically restart engine if it crashes
  pythonProcess.on("close", (code) => {
    console.log(`AI process exited with code ${code}. Restarting in 5s...`);
    setTimeout(startAIEngine, 5000);
  });
};

// Fire up the AI engine
startAIEngine();

// Routes Mounting
app.use("/crosswalks", crosswalkRoutes);
app.use("/ai/alerts", alertRoutes); // For POST (AI)
app.use("/alerts", alertRoutes); // For GET (Dashboard)

// Base Route
app.get("/", (req, res) => {
  res.send(
    "AI Smart Crosswalk Backend is Running with Socket.io & Cloudinary.",
  );
});

// Start Server using httpServer to support WebSockets
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
