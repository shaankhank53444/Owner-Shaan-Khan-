const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "stalk",
    version: "8.5.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "FB Stalk via Priyanshu New POST API",
    commandCategory: "utility",
    usages: "[link/UID/mention]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // 1. Target URL prepare karein
    let targetLink = "";
    if (args[0] && args[0].includes("facebook.com")) {
      targetLink = args[0];
    } else {
      let id = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      targetLink = `https://www.facebook.com/${id}`;
    }

    try {
      const apiKey = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c";

      // 2. Direct Axios POST Request
      // Baaz dafa Mirai mein simple POST zyada behtar kaam karta hai
      const response = await axios({
        method: 'POST',
        url: 'https://priyanshuapi.xyz/api/runner/fb-stalk/stalk',
        data: {
          link: targetLink
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const user = response.data;

      if (!user || user.status === "error" || !user.name) {
         return api.sendMessage("❌ API Response Error: Data nahi mil saka.", threadID, messageID);
      }

      // 3. Canvas Section
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");

      // White BG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);

      // Dynamic Images Loading
      try {
        const cover = await loadImage(user.cover || "https://i.imgur.com/666666.png");
        ctx.drawImage(cover, 0, 0, 1000, 480);
        
        const pfp = await loadImage(`https://graph.facebook.com/${user.id}/picture?width=500&height=500`);
        ctx.save();
        ctx.beginPath();
        ctx.arc(170, 480, 120, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pfp, 50, 360, 240, 240);
        ctx.restore();
      } catch (e) {
        ctx.fillStyle = "#1877F2";
        ctx.fillRect(0, 0, 1000, 480);
      }

      // Text Data
      ctx.fillStyle = "#000000";
      ctx.font = "bold 48px Arial";
      ctx.fillText(user.name, 310, 540);

      ctx.font = "24px Arial";
      ctx.fillStyle = "#333";
      ctx.fillText(`🎂 Birthday: ${user.birthday || "N/A"}`, 80, 720);
      ctx.fillText(`⚧ Gender: ${user.gender || "N/A"}`, 550, 720);
      ctx.fillText(`🏠 Hometown: ${user.hometown || "N/A"}`, 80, 800);
      ctx.fillText(`👥 Followers: ${user.follower || "0"}`, 550, 800);
      ctx.fillText(`💍 Status: ${user.relationship_status || "N/A"}`, 80, 880);
      ctx.fillText(`🆔 UID: ${user.id}`, 550, 880);

      // Save & Send
      const cachePath = path.join(__dirname, "cache", `stalk_${Date.now()}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      
      fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: `👤 Profile: ${user.name}\n🔗 Link: ${targetLink}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (err) {
      console.error(err.response?.data || err);
      return api.sendMessage(`❌ Error Details: ${err.response?.data?.message || err.message}`, threadID, messageID);
    }
  }
};
