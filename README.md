# AE Auto-Content Script

## Overview
This After Effects script automates content population in video templates by:

1. **Text Replacement**  
   - Updates text layers from JSON data  
   - Supports primary (title1) and secondary (title2) text fields

2. **Media Assignment**  
   - Automatically assigns numbered images (img1, img2...) to media containers  
   - Handles JPG/PNG/WEBP formats (case insensitive)  
   - Auto-scales media to fill frames

## Key Features
✅ **Strict Media Mapping**  
   - img1 → Media 02  
   - img2 → Media 03.2  
   - ...through img14  

✅ **Smart Content Detection**  
   - Finds assets regardless of extension/capitalization  
   - Gracefully handles missing assets  

✅ **Project Structure Aware**  
   - Works with nested compositions  
   - Preserves existing layer relationships  

## Requirements
- After Effects CC+  
- Project must contain:  
/project_root/
│── dataVideo.json (config)
│── /fotos/
│── img1.jpg/png/webp
│── img2.jpg/png/webp
│── ...

Copy

## Usage
1. Place JSON and images in correct folders  
2. Open template project in AE  
3. Run script from File > Scripts  

> **Note**: Script provides completion report with success/failure details
