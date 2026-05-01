const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "stalk",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Aapki layout ke mutabiq dynamic profile card generate karein.",
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

    const waitMsg = await api.sendMessage('🔍 User information process ho rahi hai...', threadID);

    const payload = targetLink ? { link: targetLink } : { userId: String(userId) };
    const response = await axios.post(API_ENDPOINT, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });

    if (!response.data?.success) throw new Error("Data fetch nahi ho saka.");
    const data = response.data.data;

    // --- Canvas Creation ---
    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext("2d");

    // 1. Background White
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1080, 1080);

    // 2. Cover Photo (Upper half)
    try {
      const coverImg = await loadImage(data.coverPhotoUrl || "https://i.imgur.com/vH9Z6Kz.png");
      ctx.drawImage(coverImg, 0, 0, 1080, 450);
    } catch (e) {
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(0, 0, 1080, 450);
    }

    // 3. Profile Picture (Circle with Border)
    ctx.save();
    ctx.beginPath();
    ctx.arc(170, 500, 140, 0, Math.PI * 2, true);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.clip();
    const avatar = await loadImage(data.profilePictureUrl || "https://i.imgur.com/6e98T9p.png");
    ctx.drawImage(avatar, 30, 360, 280, 280);
    ctx.restore();

    // 4. Name, Bio & Followers (Center-Right Alignment)
    ctx.fillStyle = "#000000";
    ctx.font = "bold 45px Arial";
    ctx.fillText(data.name || "Facebook User", 330, 530);

    ctx.font = "28px Arial";
    ctx.fillStyle = "#555555";
    // Bio handling
    const bio = data.about || "No bio available";
    ctx.fillText(bio.length > 50 ? bio.substring(0, 50) + "..." : bio, 330, 575);
    
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText(`${data.subscribersCount || "0"} followers`, 330, 615);

    // 5. Details Section (Icons ke bina, clean text)
    ctx.font = "32px Arial";
    // Left side details
    ctx.fillText(`🎂 Birthday: ${data.birthday || "No data"}`, 70, 720);
    ctx.fillText(`🏡 Hometown: ${data.hometown || "No data"}`, 70, 800);
    ctx.fillText(`💑 Status: ${data.relationshipStatus || "No data"}`, 70, 880);
    ctx.fillText(`📛 Username: ${data.username || "No data"}`, 70, 960);

    // Right side details
    ctx.fillText(`⚤ Gender: ${data.gender || "No data"}`, 550, 720);
    ctx.fillText(`📍 Location: ${data.location || "No data"}`, 550, 800);
    ctx.fillText(`🆔 ID: ${data.userId || "No data"}`, 550, 880); // UID location ke niche

    // 6. "FB PROFILE" Button Look
    ctx.fillStyle = "#4267B2";
    ctx.roundRect ? ctx.roundRect(800, 920, 220, 60, 10) : ctx.fillRect(800, 920, 220, 60);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FB PROFILE", 910, 958);
    ctx.textAlign = "left"; // Reset alignment

    const pathImg = path.join(__dirname, "cache", `stalk_${data.userId}.png`);
    fs.writeFileSync(pathImg, canvas.toBuffer("image/png"));

    // 7. Title Message
    const msgTitle = `━━━━━━━━━━━━━━━\n` +
      `👤 𝐍𝐚𝐦𝐞: ${data.name}\n` +
      `📝 𝐁𝐢𝐨: ${data.about || "No data"}\n` +
      `🆔 𝐈𝐃: ${data.userId}\n` +
      `🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "No data"}\n` +
      `👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.subscribersCount || "0"}\n` +
      `📍 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧: ${data.location || "No data"}\n` +
      `━━━━━━━━━━━━━━━`;

    api.unsendMessage(waitMsg.messageID);

    return api.sendMessage({
      body: msgTitle,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => fs.unlinkSync(pathImg), messageID);

  } catch (error) {
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
