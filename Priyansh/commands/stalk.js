const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// Helper function to create a circular clip
function circleClip(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
}

// Helper function to draw rounded rectangles
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

module.exports.config = {
  name: "stalk",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Priyansh", // Based on Shaan's design
  description: "Stalk a Facebook user and generate a detailed image.",
  commandCategory: "utility",
  usages: "[@mention/reply/link/ID]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  
  // Use your actual API key here. Replace the placeholder.
  const apiKey = "apim_0sfMwFkD-BxTofK-WdpdUSRlO974Bjey72AIfQQ0aII";
  const API_ENDPOINT = "https://priyanshuapi.xyz/api/runner/fb-stalk/stalk";

  try {
    let userId = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : 
                 type === "message_reply" ? messageReply.senderID : 
                 (args[0] && /^\d+$/.test(args[0])) ? args[0] : null;
    
    let targetLink = null;
    if (!userId) {
      if (args[0] && args[0].includes("facebook.com")) {
        targetLink = args[0];
      } else {
        userId = senderID; // Fallback to the sender if no target specified
      }
    }

    const waitMsg = await api.sendMessage('🔍 Fetching user information...', threadID);

    const payload = targetLink ? { link: targetLink } : { userId: String(userId) };

    const response = await axios.post(API_ENDPOINT, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });

    api.unsendMessage(waitMsg.messageID);

    if (!response.data?.success) throw new Error("Could not fetch user data. They might have a locked profile or strong privacy settings.");
    const data = response.data.data;

    // Canvas Dimensions
    const width = 1200;
    const height = 1400; // Extra height for the bottom detail section
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Clear background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // --- 1. Cover Photo ---
    let coverUrl = data.coverPhotoUrl;
    // Check if the API provided a cover photo URL
    if (!coverUrl) {
        // Fallback or skip. Let's try to fetch using FB's URL format, 
        // though this isn't guaranteed and might show a generic image.
        coverUrl = `https://graph.facebook.com/${data.userId}/picture?type=large&width=1200&height=500`;
    }

    try {
        const coverImgRes = await axios.get(coverUrl, { responseType: 'arraybuffer' });
        const coverImg = await loadImage(Buffer.from(coverImgRes.data));
        
        // Simple scaling to fill the cover area (1200x500)
        ctx.drawImage(coverImg, 0, 0, width, 500);

    } catch (e) {
        console.error("Error loading cover image:", e.message);
        // Draw a placeholder or solid color for the cover photo area
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(0, 0, width, 500);
        ctx.fillStyle = "#a0a0a0";
        ctx.font = "italic 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Cover Photo Not Available", width / 2, 250);
    }

    // --- Add subtle gradient overlay to cover photo for text readability (optional) ---
    const coverGradient = ctx.createLinearGradient(0, 0, 0, 500);
    coverGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)"); // Lighter on top
    coverGradient.addColorStop(1, "rgba(255, 255, 255, 1.0)"); // Solid white at the bottom
    ctx.fillStyle = coverGradient;
    ctx.fillRect(0, 0, width, 500);


    // --- 2. Profile Picture (Circle) ---
    const profilePicUrl = data.profilePictureUrl || "https://i.imgur.com/6e98T9p.png"; // Placeholder
    try {
        const profileImgRes = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
        const profileImg = await loadImage(Buffer.from(profileImgRes.data));

        // Outline/Border for the profile picture
        const pPicX = 220; // X position of the center
        const pPicY = 500; // Y position of the center (on the cover-info boundary)
        const pPicRadius = 150; // Radius of the main image
        const pPicOuterBorder = 160; // Radius of the outer white border

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        // White border circle
        ctx.beginPath();
        ctx.arc(pPicX, pPicY, pPicOuterBorder, 0, Math.PI * 2, true);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.closePath();
        ctx.restore();

        // Inner circle (clipping path for the image)
        ctx.save();
        ctx.beginPath();
        ctx.arc(pPicX, pPicY, pPicRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        
        // Draw image, centered on (pPicX, pPicY)
        ctx.drawImage(profileImg, pPicX - pPicRadius, pPicY - pPicRadius, pPicRadius * 2, pPicRadius * 2);
        ctx.restore();

    } catch (e) {
        console.error("Error loading profile image:", e.message);
        // Draw a solid circle placeholder
        ctx.fillStyle = "#ccc";
        ctx.beginPath();
        ctx.arc(220, 500, 150, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
    }


    // --- 3. Dynamic Text & Information (Based on your template) ---
    
    // Configure text alignment and base font
    ctx.textAlign = "left"; 
    ctx.fillStyle = "#000000"; // Primary text color
    ctx.font = "bold 55px Arial"; // Adjust font size as needed

    // Draw Name
    const nameY = 530; // Position below the cover photo
    const name = data.name || "Unknown User";
    ctx.fillText(name, 430, nameY);

    // Dynamic ID Text
    ctx.fillStyle = "#555555";
    ctx.font = "30px Arial";
    ctx.fillText(`ID: ${data.userId || "No data"}`, 430, nameY + 45);

    // Follower Count below profile pic
    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px Arial";
    ctx.fillText(`${data.subscribersCount || "0"} followers`, 100, 680);


    // --- Dynamic Bottom Detail Section (Using coordinates from your template) ---
    
    ctx.font = "32px Arial";
    ctx.fillStyle = "#000000";

    // Left Column
    const detailStartX = 100;
    let detailY = 770; // Starting Y coordinate for details
    const detailSpacingY = 70; // Vertical spacing between items

    ctx.fillText(`Birthday: ${data.birthday || "No data"}`, detailStartX, detailY);
    detailY += detailSpacingY;
    ctx.fillText(`Hometown: ${data.hometown || "No data"}`, detailStartX, detailY);
    detailY += detailSpacingY;
    ctx.fillText(`Status: ${data.relationshipStatus || "No data"}`, detailStartX, detailY);
    detailY += detailSpacingY;
    ctx.fillText(`Username: ${data.username || "No data"}`, detailStartX, detailY);

    // Right Column
    const rightColumnStartX = 650;
    detailY = 770; // Reset Y for the right column

    ctx.fillText(`Gender: ${data.gender || "No data"}`, rightColumnStartX, detailY);
    detailY += detailSpacingY;
    ctx.fillText(`Location: ${data.location || "No data"}`, rightColumnStartX, detailY);
    // Location can often be long, consider truncating or wrapping if necessary.

    // --- Save the generated image ---
    const pathImg = path.join(__dirname, "cache", `stalk_res_v2_${data.userId || Date.now()}.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathImg, buffer);

    // --- Send the image and cleanup ---
    return api.sendMessage({
      body: `✅ Information for: ${name}`,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
        // Callback function executes after sending the message
        try {
            if (fs.existsSync(pathImg)) {
                fs.unlinkSync(pathImg); // Correct way to delete temporary files
            }
        } catch (e) {
            console.error("Error deleting temp file:", e.message);
        }
    }, messageID);

  } catch (error) {
    console.error("Stalk Command Error:", error);
    let errorMessage = "An error occurred while generating the image.";
    if (error.response) {
        if (error.response.status === 429) {
            errorMessage = "The stalk API is currently rate limited. Please try again later.";
        } else {
             errorMessage = `Error: ${error.response.status} - ${error.response.data?.message || "Server Error"}`;
        }
    } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
    }
    return api.sendMessage(`❌ ${errorMessage}`, threadID, messageID);
  }
};
