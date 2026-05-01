const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "stalk",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Aapki layout ke mutabiq fixed dynamic profile card.",
  commandCategory: "utility",
  usages: "[@mention/reply/link/ID]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  const apiKey = "apim_0sfMwFkD-BxTofK-WdpdUSRlO974Bjey72AIfQQ0aII";
  const API_ENDPOINT = "https://priyanshuapi.xyz/api/runner/fb-stalk/stalk";

  try {
    let userId = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : 
                 type === "message_reply" ? messageReply.senderID : 
                 (args[0] && /^\d+$/.test(args[0])) ? args[0] : senderID;
    
    let targetLink = (args[0] && args[0].includes("facebook.com")) ? args[0] : null;

    const waitMsg = await api.sendMessage('🔍 Processing profile data...', threadID);

    const payload = targetLink ? { link: targetLink } : { userId: String(userId) };
    const response = await axios.post(API_ENDPOINT, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });

    if (!response.data?.success) throw new Error("Data fetch nahi ho saka.");
    const data = response.data.data;

    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext("2d");

    // 1. Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1080, 1080);

    // 2. Cover Photo
    try {
      const coverImg = await loadImage(data.coverPhotoUrl || "https://i.imgur.com/vH9Z6Kz.png");
      ctx.drawImage(coverImg, 0, 0, 1080, 450);
    } catch (e) {
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(0, 0, 1080, 450);
    }

    // 3. Profile Picture (FIXED Layering)
    const avatarUrl = data.profilePictureUrl || "https://i.imgur.com/6e98T9p.png";
    const avatar = await loadImage(avatarUrl);
    
    // Draw white circle border first
    ctx.beginPath();
    ctx.arc(170, 500, 145, 0, Math.PI * 2, true);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();

    // Clip and Draw Profile Pic
    ctx.save();
    ctx.beginPath();
    ctx.arc(170, 500, 135, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 35, 365, 270, 270);
    ctx.restore();

    // 4. Name, Bio & Followers
    ctx.fillStyle = "#000000";
    ctx.font = "bold 42px Arial";
    ctx.fillText(data.name || "Facebook User", 330, 520);

    ctx.font = "24px Arial";
    ctx.fillStyle = "#666666";
    const bio = data.about || "No bio available";
    ctx.fillText(bio.length > 60 ? bio.substring(0, 60) + "..." : bio, 330, 560);
    
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText(`${data.subscribersCount || "0"} followers`, 330, 600);

    // 5. Details Section (Font Size Chota kar diya overlap rokne ke liye)
    ctx.font = "24px Arial"; // Size reduced from 32 to 24
    ctx.fillStyle = "#333333";

    // Left side
    ctx.fillText(`🎂 Birthday: ${data.birthday || "No data"}`, 60, 720);
    ctx.fillText(`🏡 Hometown: ${data.hometown || "No data"}`, 60, 780);
    ctx.fillText(`💑 Status: ${data.relationshipStatus || "No data"}`, 60, 840);
    ctx.fillText(`📛 Username: ${data.username || "No data"}`, 60, 900);

    // Right side (Spacing adjusted)
    ctx.fillText(`⚤ Gender: ${data.gender || "No data"}`, 560, 720);
    ctx.fillText(`📍 Location: ${data.location || "No data"}`, 560, 780);
    ctx.fillText(`🆔 ID: ${data.userId || "No data"}`, 560, 840);

    // 6. FB PROFILE Label
    ctx.fillStyle = "#4267B2";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(820, 930, 200, 50, 10);
      ctx.fill();
    } else {
      ctx.fillRect(820, 930, 200, 50);
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FB PROFILE", 920, 962);
    ctx.textAlign = "left";

    const pathImg = path.join(__dirname, "cache", `stalk_${data.userId}.png`);
    fs.writeFileSync(pathImg, canvas.toBuffer("image/png"));

    api.unsendMessage(waitMsg.messageID);

    return api.sendMessage({
      body: `👤 Profile: ${data.name}\n🆔 ID: ${data.userId}\n🔗 Link: ${data.link}`,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => fs.unlinkSync(pathImg), messageID);

  } catch (error) {
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
