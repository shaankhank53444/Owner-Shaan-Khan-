const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "stalk",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Image aur Title dono mein saari details show karein.",
  commandCategory: "utility",
  usages: "[@mention/reply/link/ID]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  const apiKey = "apim_8oGEKB_s8N3xdt7sVic_JnV11tjju_NHOvxIDX_A63w";
  const API_ENDPOINT = "https://priyanshuapi.xyz/api/runner/fb-stalk/stalk";

  try {
    let userId = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : 
                 type === "message_reply" ? messageReply.senderID : 
                 (args[0] && /^\d+$/.test(args[0])) ? args[0] : senderID;
    
    let targetLink = (args[0] && args[0].includes("facebook.com")) ? args[0] : null;

    const waitMsg = await api.sendMessage('🔍 User details fetch ho rahi hain...', threadID);

    const payload = targetLink ? { link: targetLink } : { userId: String(userId) };
    const response = await axios.post(API_ENDPOINT, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });

    if (!response.data?.success) throw new Error("Data nahi mil saka.");
    const data = response.data.data;

    // --- Canvas Layout ---
    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1080, 1080);

    // Cover Photo
    try {
      const coverImg = await loadImage(data.coverPhotoUrl || "https://i.imgur.com/vH9Z6Kz.png");
      ctx.drawImage(coverImg, 0, 0, 1080, 450);
    } catch (e) {
      ctx.fillStyle = "#34495e";
      ctx.fillRect(0, 0, 1080, 450);
    }

    // Profile Pic with Border
    const avatar = await loadImage(data.profilePictureUrl || "https://i.imgur.com/6e98T9p.png");
    ctx.beginPath();
    ctx.arc(170, 500, 145, 0, Math.PI * 2, true);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(170, 500, 135, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.drawImage(avatar, 35, 365, 270, 270);
    ctx.restore();

    // Name & Bio on Image
    ctx.fillStyle = "#000000";
    ctx.font = "bold 42px Arial";
    ctx.fillText(data.name || "User", 330, 520);
    ctx.font = "24px Arial";
    ctx.fillStyle = "#666666";
    ctx.fillText((data.about || "No bio").substring(0, 60), 330, 560);
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText(`${data.subscribersCount || "0"} followers`, 330, 600);

    // Details Grid (Smaller Text to avoid overlap)
    ctx.font = "24px Arial";
    ctx.fillStyle = "#333";
    ctx.fillText(`🎂 Birthday: ${data.birthday || "N/A"}`, 60, 720);
    ctx.fillText(`🏡 Hometown: ${data.hometown || "N/A"}`, 60, 785);
    ctx.fillText(`💑 Status: ${data.relationshipStatus || "N/A"}`, 60, 850);
    ctx.fillText(`📛 Username: ${data.username || "N/A"}`, 60, 915);
    ctx.fillText(`⚤ Gender: ${data.gender || "N/A"}`, 560, 720);
    ctx.fillText(`📍 Location: ${data.location || "N/A"}`, 560, 785);
    ctx.fillText(`🆔 ID: ${data.userId || "N/A"}`, 560, 850);

    // FB Button UI
    ctx.fillStyle = "#4267B2";
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(820, 930, 200, 55, 10); ctx.fill();
    } else { ctx.fillRect(820, 930, 200, 55); }
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FB PROFILE", 920, 965);
    ctx.textAlign = "left";

    const pathImg = path.join(__dirname, "cache", `stalk_${data.userId}.png`);
    fs.writeFileSync(pathImg, canvas.toBuffer("image/png"));

    // --- Saari Details Title (Body) mein ---
    const detailBody = `👤 𝐍𝐚𝐦𝐞: ${data.name}\n` +
      `📝 𝐁𝐢𝐨: ${data.about || "N/A"}\n` +
      `🆔 𝐈𝐃: ${data.userId}\n` +
      `🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "N/A"}\n` +
      `⚤ 𝐆𝐞𝐧𝐝𝐞𝐫: ${data.gender || "N/A"}\n` +
      `👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.subscribersCount || "0"}\n` +
      `💑 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩: ${data.relationshipStatus || "N/A"}\n` +
      `🏡 𝐇𝐨𝐦𝐞𝐭𝐨𝐰𝐧: ${data.hometown || "N/A"}\n` +
      `📍 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧: ${data.location || "N/A"}\n` +
      `📛 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${data.username || "N/A"}\n` +
      `🔗 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐋𝐢𝐧𝐤: ${data.link}\n` +
      `━━━━━━━━━━━━━━━━━━`;

    api.unsendMessage(waitMsg.messageID);

    return api.sendMessage({
      body: detailBody,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => fs.unlinkSync(pathImg), messageID);

  } catch (error) {
    return api.sendMessage(`❌ Galti: ${error.message}`, threadID, messageID);
  }
};
