const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "stalk",
    version: "7.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Fetch Real-time Profile Card via New Priyanshu POST API",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const cacheDir = path.join(__dirname, "cache");

    try {
      let targetID = senderID;
      let targetLink = "";

      // 1. ID/Link nikalne ka logic
      if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetLink = `https://www.facebook.com/${targetID}`;
      } else if (messageReply) {
        targetID = messageReply.senderID;
        targetLink = `https://www.facebook.com/${targetID}`;
      } else if (args[0]) {
        if (args[0].includes("facebook.com")) {
          targetLink = args[0];
        } else {
          targetID = args[0];
          targetLink = `https://www.facebook.com/${targetID}`;
        }
      } else {
        targetLink = `https://www.facebook.com/${senderID}`;
      }

      await api.sendMessage("🔍 Fetching data via POST API...", threadID);

      // --- NEW POST API INTEGRATION ---
      const apiKey = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c"; 
      
      const response = await axios({
        method: 'post',
        url: 'https://priyanshuapi.xyz/api/runner/fb-stalk/stalk',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          link: targetLink
        }
      });

      const user = response.data;
      if (!user || user.error) throw new Error(user.error || "Invalid API Response");

      // Data extraction
      const name = user.name || "Facebook User";
      const bday = user.birthday || "Not Public";
      const gender = user.gender || "Unknown";
      const followers = user.follower || "0";
      const bio = user.bio || "No bio available.";
      const home = user.hometown || "Private";
      const loc = user.location || "Private";
      const relationship = user.relationship_status || "Not Specified";
      const uid = user.id || targetID;

      // --- CANVAS DRAWING ---
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);

      // Cover Photo
      try {
        const coverImg = await loadImage(user.cover || `https://graph.facebook.com/${uid}/picture?width=1000&height=500`);
        ctx.drawImage(coverImg, 0, 0, 1000, 480);
      } catch (e) {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, 1000, 480);
      }

      // Profile Picture
      try {
        const pfpUrl = `https://graph.facebook.com/${uid}/picture?width=500&height=500`;
        const pfpImg = await loadImage(pfpUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(170, 480, 120, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(pfpImg, 50, 360, 240, 240);
        ctx.restore();
      } catch (e) { console.log("PFP Load failed"); }

      // Name & Bio
      ctx.fillStyle = "#000000";
      ctx.font = "bold 48px Arial";
      ctx.fillText(name, 310, 540);

      ctx.font = "italic 22px Arial";
      ctx.fillStyle = "#555555";
      ctx.fillText(bio.length > 55 ? bio.substring(0, 55) + "..." : bio, 310, 580);

      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#1877F2";
      ctx.fillText(`👥 ${followers} Followers`, 310, 620);

      // Info Grid
      ctx.font = "24px Arial";
      ctx.fillStyle = "#333";
      ctx.fillText(`🎂 Birthday: ${bday}`, 80, 720);
      ctx.fillText(`⚧ Gender: ${gender}`, 550, 720);
      ctx.fillText(`🏠 From: ${home}`, 80, 780);
      ctx.fillText(`📍 Lives in: ${loc}`, 550, 780);
      ctx.fillText(`💍 Status: ${relationship}`, 80, 840);
      ctx.fillText(`🆔 UID: ${uid}`, 550, 840);

      ctx.fillStyle = "#1877F2";
      ctx.font = "bold 20px Arial";
      ctx.fillText("NEW POST API POWERED BY PRIYANSHU", 330, 970);

      // Save and Send
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const cachePath = path.join(cacheDir, `stalk_${uid}.png`);
      
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(cachePath, buffer);

      return api.sendMessage({
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (err) {
      console.error(err.response?.data || err);
      return api.sendMessage("❌ Error: API ne data nahi diya. Check karein link sahi hai ya API key valid hai.", threadID, messageID);
    }
  }
};
