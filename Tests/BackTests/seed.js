import dotenv from 'dotenv';

// Import models from the main Backend directory
// 'BackTests' -> 'Tests' -> 'Root' -> then into 'Backend'
import Crosswalk from '../../Backend/models/Crosswalk.js';
import Alert from '../../Backend/models/Alert.js';

// Import the database connection logic and .env from the Backend configuration
import connectDB from '../../Backend/config/db.js'; 
dotenv.config({ path: '../../Backend/.env' });

const seedData = async () => {
  try {
    // Establish connection to MongoDB using the shared configuration
    await connectDB();
    console.log('[System] Connected to MongoDB via Backend Config.');

    // Clear existing data
    // Removes all documents from collections to prevent duplicates when running the script multiple times
    await Crosswalk.deleteMany({});
    await Alert.deleteMany({});
    console.log('[System] Old data cleared.');

    // Insert Crosswalks (Locations)
    // Creating static location data to serve as references for the alerts
    const crosswalks = await Crosswalk.insertMany([
      {
        name: "Holon, Sokolov 48",
        location: { lat: 32.022759561386, lng: 34.774537635844844 },
        status: "active",
        ledSystemUrl: "http://192.168.1.10"
      },
      {
        name: "Holon, Shenkar 12",
        location: { lat: 32.027086, lng: 34.776860 },
        status: "active",
        ledSystemUrl: "http://192.168.1.11"
      },
      {
        name: "Holon, Pinhas Lavon 2",
        location: { lat: 32.00829660858082, lng: 34.768726723908145 },
        status: "maintenance",
        ledSystemUrl: "http://192.168.1.12"
      }
    ]);
    
    console.log(`[System] Created ${crosswalks.length} Crosswalks.`);

    // Insert Alerts (Events)
    // We link these alerts to the created crosswalks using their unique _id
    const alerts = await Alert.insertMany([
      {
        crosswalkId: crosswalks[0]._id, // Linked to Sokolov St.
        description: "Pedestrian waiting on edge",
        imageUrl: "https://www.shutterstock.com/image-photo/man-on-pedestrian-crossing-waiting-260nw-691829371.jpg",
        detectionDistance: 1.5,
        detectedObjectsCount: 1,
        ledActivated: true,
        isHazard: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        crosswalkId: crosswalks[0]._id, // Linked to Sokolov St.
        description: "Bicycle crossing fast",
        imageUrl: "https://images.wcdn.co.il/f_auto,q_auto,w_1200,t_54/1/3/8/8/1388157-46.jpg",
        detectionDistance: 3.2,
        detectedObjectsCount: 1,
        ledActivated: true,
        isHazard: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        crosswalkId: crosswalks[1]._id, // Linked to Shenkar St.
        description: "Group of children",
        imageUrl: "https://pop.education.gov.il/remote.axd?https://meyda.education.gov.il/files/pop/21695/shutterstock_726878521-1.jpg?anchor=center&mode=crop&width=630&height=0&rnd=132791993110000000",
        detectionDistance: 2.0,
        detectedObjectsCount: 4,
        ledActivated: true,
        isHazard: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        crosswalkId: crosswalks[2]._id, // Linked to Pinhas Lavon St.
        description: "False Alarm - Small Animal",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNrkBfNiH2vbyI5zZPWZKjTXfuQfbNlDlzpQ&s",
        detectionDistance: 0.5,
        detectedObjectsCount: 1,
        ledActivated: false,
        isHazard: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ]);

    console.log(`[System] Created ${alerts.length} Alerts.`);
    console.log('[System] Seeding process completed successfully.');
    
    // Terminate the process when finished
    process.exit(); 

  } catch (error) {
    console.error('[System] Seeding Error:', error);
    process.exit(1); // Exit with failure code
  }
};

seedData();