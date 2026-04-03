import os
import json
import time
from ultralytics import YOLO # Ultralytics YOLOv8 for object detection and pose estimation
import cv2 # OpenCV for image processing and annotation
import numpy as np

IS_PRODUCTION = os.getenv("NODE_ENV") == "production"
DISABLE_VISUALIZATION = IS_PRODUCTION or os.getenv("AI_ENGINE_DISABLE_VISUALIZATION") == "true"
POLL_INTERVAL_SECONDS = float(os.getenv("AI_ENGINE_POLL_INTERVAL", "2"))


def log_event(payload):
    print(json.dumps(payload), flush=True)

def run_analysis():
    """
    Main AI Engine service for Smart Crosswalk monitoring.
    Optimized Feature: CCTV-Calibrated Head-to-Shoulder Posture Analysis.
    """
    log_event(
        {
            "status": "AI Engine starting with CCTV-Calibrated Logic...",
            "model": "yolov8n-pose.pt",
            "production": IS_PRODUCTION,
            "visualization_disabled": DISABLE_VISUALIZATION,
        }
    )

    model = YOLO("yolov8n-pose.pt") # Keep the smallest pose model for better memory usage in production
    
    base_dir = os.path.dirname(os.path.abspath(__file__)) # Get the directory of the current script
    input_dir = os.path.join(base_dir, 'test_images') # Directory where test images are stored
    output_dir = os.path.join(base_dir, 'output_images') # Directory where output images will be saved

    analyzed_files = set() # To keep track of already analyzed files and avoid reprocessing

    while True: # Continuous loop to monitor the input directory for new images
        files = [f for f in os.listdir(input_dir) # Filter for image files and exclude already analyzed ones
                 if f.lower().endswith(('.jpg', '.jpeg', '.png', '.jfif', '.webp', '.avif')) 
                 and f not in analyzed_files]
        
        for file_name in files: # Process each new image file
            img_path = os.path.join(input_dir, file_name) # Full path to the image file
            img = cv2.imread(img_path) # Read the image using OpenCV because we need it for annotation and distance estimation
            if img is None: continue # Skip if the image cannot be read

            results = model(img_path, verbose=not IS_PRODUCTION) # Run the YOLO model on the image to get detections and keypoints
            result = results[0] # We only process the first result since we are analyzing one image at a time
            
            is_dangerous = False # Flag to determine if the situation is dangerous based on detections and posture analysis
            danger_reasons = [] 
            
            detection_distance = 0 # Estimated distance to the detected person, initialized to 0
            person_count = 0       # Count of detected people in the image, used for crowd density analysis
            phone_detected = False # Flag to indicate if a phone is detected, used for sensor fusion analysis
            
            boxes_data = result.boxes # Get bounding box data for object detection results, which includes class, confidence, and coordinates. This is crucial for both distance estimation and posture analysis.
            
            # --- Object Detection (Phone & Distance) ---
            for box in boxes_data: # Loop through each detected box to analyze the class and confidence
                cls = int(box.cls) # Get the class index of the detected object
                label = model.names[cls] # Get the human-readable label for the detected class using the model's names mapping
                conf = float(box.conf[0]) # Get the confidence score for the detected object, which is important for filtering out low-confidence detections
                
                if label == 'cell phone' and conf > 0.15: # if a phone is detected with confidence above 15%, we consider it a valid detection for distraction analysis
                    phone_detected = True # Set the phone detected flag to True, which will be used later in the sensor fusion step to determine if the situation is dangerous due to phone distraction
                
                if label == 'person': # If the detected object is a person, we will use it for both crowd density analysis and distance estimation. We count the number of people detected and also calculate the distance based on the bounding box height, which is a common method for estimating distance in monocular vision systems.
                    person_count += 1 # Increment the person count for crowd density analysis
                    coords = box.xyxy[0].tolist() # Get the bounding box coordinates in the format [x1, y1, x2, y2], which represent the top-left and bottom-right corners of the detected person. This is crucial for both distance estimation and posture analysis.
                    box_height_pixels = coords[3] - coords[1] # Calculate the height of the bounding box in pixels, which is used for distance estimation. The taller the box, the closer the person is to the camera. This is a key part of our distance estimation logic, especially since we are using a fixed focal length and an average human height to estimate distance.
                    if box_height_pixels > 0: # Ensure we don't divide by zero in distance estimation
                        detection_distance = (1.7 * 500) / box_height_pixels # Distance estimation using the formula: Distance = (Real Height * Focal Length) / Pixel Height. We use an average human height of 1.7 meters and a focal length of 500 pixels, which is a common approximation for many cameras. This allows us to estimate how far the detected person is from the camera, which is crucial for determining if they are in a dangerous proximity to the crosswalk.

            # --- Crowd Density Check ---
            if person_count >= 5: # If there are 5 or more people detected, we consider it a crowded area, which can be dangerous for pedestrians trying to cross. This threshold can be adjusted based on the specific location and typical crowd sizes, but 5 is a reasonable starting point for identifying potentially hazardous crowding situations at a crosswalk.
                is_dangerous = True # Set the dangerous flag to True if the crowd density exceeds the threshold, as this can increase the risk of accidents and make it harder for pedestrians to navigate safely.
                danger_reasons.append(f"Crowded Area: {person_count} people") # Add a reason for the danger status indicating that the area is crowded, which can be useful for both logging and for providing feedback to users or systems that are monitoring the situation. This reason will be included in the final output and can help explain why the system has flagged the situation as dangerous.

            # --- Refined Pose Analysis for CCTV Angles ---
            if result.keypoints is not None and len(result.keypoints.data) > 0: # If keypoints are detected, we proceed with posture analysis. This is especially important for CCTV angles where traditional head-to-shoulder ratios may not be reliable. We will use a combination of keypoint positions (nose, eyes, shoulders) and the bounding box height to determine if the person is likely looking down or has a collapsed posture, which can indicate distraction or a dangerous situation.
                for i, kp in enumerate(result.keypoints.data): # Loop through each set of keypoints detected in the image. Each set corresponds to a detected person, and we will analyze their posture based on the keypoint positions and the corresponding bounding box. This allows us to perform a more nuanced analysis of posture that is better suited for CCTV angles, where the perspective can distort traditional head-to-shoulder ratios.
                    try:
                        box_coords = boxes_data[i].xyxy[0].tolist() # Get the bounding box coordinates for the current person being analyzed. This is crucial for calculating the height of the person in pixels, which we will use as a reference for determining if their posture is collapsed or if they are looking down. The bounding box provides a frame of reference for the keypoints and allows us to adjust our analysis based on the size of the detected person in the image, which is especially important for CCTV angles where perspective can affect how we interpret keypoint positions.
                        person_h_px = box_coords[3] - box_coords[1] # Calculate the height of the person in pixels using the bounding box coordinates. This is a key part of our posture analysis, as we will use this height to determine if the person's head is significantly lower than their shoulders, which can indicate a collapsed posture or that they are looking down. By using the bounding box height as a reference, we can adjust our analysis to account for the perspective distortion that occurs with CCTV angles, making our posture analysis more accurate and reliable in these scenarios.
                        
                        # Keypoints: 0=Nose, 1-2=Eyes, 5-6=Shoulders || using on the first cell in kp array
                        #            0 = X, 1 = Y, 2 = Confidence || we will focus on the Y positions for posture analysis, using on the second cell in kp array
                        eye_y = (kp[1][1] + kp[2][1]) / 2   # Average Y position of the eyes, which serves as a reference point for determining if the person is looking down. If the nose is significantly lower than the eyes, it can indicate that the person is looking down, which is a common form of distraction. By calculating the average Y position of the eyes, we can create a more robust analysis that is less affected by the angle of the camera, especially in CCTV scenarios where the perspective can distort traditional head-to-shoulder ratios.
                        nose_y = kp[0][1] # Y position of the nose, which we will compare to the eye Y position to determine if the person is looking down. If the nose is significantly lower than the eyes, it can indicate that the person is looking down, which is a common form of distraction. This comparison allows us to identify situations where the person may be distracted by looking at their phone or something on the ground, which can be dangerous when crossing a street.
                        shoulder_y = (kp[5][1] + kp[6][1]) / 2  # Average Y position of the shoulders, which serves as a reference point for determining if the person's posture is collapsed. If the head (represented by the eyes and nose) is significantly lower than the shoulders, it can indicate a collapsed posture, which can be dangerous as it may indicate that the person is not paying attention to their surroundings or is in a vulnerable position. By calculating the average Y position of the shoulders, we can create a more robust analysis that accounts for the perspective distortion of CCTV angles, allowing us to better identify dangerous postures in these scenarios.

                        # --- CCTV PERSPECTIVE ADJUSTMENT ---
                
                        head_to_shoulder_gap = shoulder_y - eye_y # Calculate the gap between the eyes and shoulders, which we will use to determine if the posture is collapsed. In CCTV angles, the head-to-shoulder ratio can be distorted, so we will use this gap in combination with the overall height of the person (from the bounding box) to determine if the posture is dangerous. If the gap is very small relative to the person's height, it can indicate a collapsed posture. Additionally, we will compare the nose position to the eye position to determine if the person is looking down, which can also indicate distraction. By using both of these metrics together, we can create a more accurate analysis of posture that is better suited for CCTV angles.
                        nose_drop = nose_y - eye_y # Calculate how much the nose has dropped below the eyes, which can indicate if the person is looking down. If the nose is significantly lower than the eyes, it can indicate that the person is looking down, which is a common form of distraction. This is especially important in CCTV angles where the perspective can make it difficult to rely on traditional head-to-shoulder ratios. By calculating the nose drop, we can identify situations where the person may be distracted by looking at their phone or something on the ground, which can be dangerous when crossing a street.
                        
                        # Posture is only 'collapsed' if it's extremely close (under 10% body height)
                        # OR if the nose is significantly lower than eyes (clear look down)
                        if head_to_shoulder_gap < (person_h_px * 0.10) or (nose_drop > (head_to_shoulder_gap * 0.5)):
                            is_dangerous = True
                            if "Distracted: Looking Down" not in danger_reasons:
                                danger_reasons.append("Distracted: Looking Down")
                                
                    except Exception: continue

            # --- Phone detection ---
            if phone_detected:
                is_dangerous = True
                if "Phone Distraction" not in danger_reasons:
                    danger_reasons.append("Phone Distraction")

            # --- Visual Output ---
            display_reasons = list(set(danger_reasons)) # Remove duplicates from reasons list, if any. This ensures that if multiple checks identify the same reason
            final_file_name = None

            if is_dangerous: 
                status_text = f"DANGER: {', '.join(display_reasons)} | Dist: {round(detection_distance, 1)}m" # Create a status text that includes the reasons for the danger status and the estimated distance to the detected person. This provides a clear and concise summary of the analysis results, which can be useful for both logging and for providing feedback to users or systems that are monitoring the situation.
                color = (0, 0, 255) # Red color for danger status, which will be used to annotate the image and make it visually clear that the situation is dangerous. This color choice helps to quickly convey the severity of the situation when viewing the annotated image.
            else: 
                status_text = f"Safe: Monitoring... | Dist: {round(detection_distance, 1)}m"
                color = (0, 255, 0) # Green color for safe status, which will be used to annotate the image and indicate that the situation is currently considered safe. This color choice helps to quickly convey that there are no immediate dangers detected when viewing the annotated image.

            if not DISABLE_VISUALIZATION:
                annotated_frame = result.plot() # Keep annotated output for local development and debugging only
                cv2.putText(annotated_frame, status_text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2) # Add the status text to the annotated frame

                # --- Final Sync ---
                clean_base_name = os.path.splitext(file_name)[0].replace(" ", "_") # Create a clean base name for the output file by removing the extension and replacing spaces with underscores.
                final_file_name = f"analyzed_{clean_base_name}.jpg" # Final file name for the annotated image
                cv2.imwrite(os.path.join(output_dir, final_file_name), annotated_frame) # Save the annotated frame to the output directory with the final file name.

            result_json = { # Create a JSON object to represent the results of the analysis, which includes the event type, file name, danger status, reasons for the status, person count, description, estimated distance, and a timestamp. This structured format allows for easy integration with other systems, such as databases or APIs, and provides a clear and comprehensive summary of the analysis results that can be easily parsed and utilized by other components of the system.
                "event": "ANALYSIS_COMPLETE",
                "file": final_file_name,
                "is_dangerous": is_dangerous,
                "reasons": display_reasons, 
                "person_count": person_count, 
                "description": status_text,
                "detection_distance": round(detection_distance, 2),
                "timestamp": time.time()
            }
            log_event(result_json) # Output the result JSON to the console, which can be captured by the Node.js server to update the database and trigger any necessary alerts or notifications.
            analyzed_files.add(file_name) 
        
        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    run_analysis()
