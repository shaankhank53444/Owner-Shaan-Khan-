const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "stalk",
    version: "6.5.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Fetch Real-time Profile Card via Priyanshu API",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    try {
      let targetID = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      
      // Agar user link deta hai to usse ID nikalne ke liye
      if (args[0] && args[0].includes("facebook.com")) {
        const linkRes = await axios.get(`https://priyanshuapi.xyz/api/tools/fb-findid?link=${args[0]}`);
        targetID = linkRes.data.id;
      }

      await api.sendMessage("🔍 Fetching data from API...", threadID);

      // --- PRIYANSHU API INTEGRATION ---
      // Apni API Key yahan 'Apim_B6kjY2...' wali jagah lagayein
      const apiKey = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c"; 
      const response = await axios.get(`https://priyanshuapi.xyz/api/runner/fb-stalk?id=${targetID}&apikey=${apiKey}`);
      
      const user = response.data;

      // Variables ko API data se replace kiya gaya hai
      const name = user.name || "Facebook User";
      const bday = user.birthday || "Not Public";
      const gender = user.gender || "Unknown";
      const followers = user.follower || "0";
      const username = user.username || "No Username";
      const bio = user.bio || "No bio available.";
      const home = user.hometown || "Private";
      const loc = user.location || "Private";
      const relationship = user.relationship_status || "Not Specified";

      // --- CANVAS DRAWING ---
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");

      // White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);

      // 1. Cover Photo (Dynamic from API)
      try {
        const coverImg = await loadImage(user.cover || `https://graph.facebook.com/${targetID}/picture?width=1000&height=500`);
        ctx.drawImage(coverImg, 0, 0, 1000, 480);
      } catch (e) {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, 1000, 480);
      }

      // 2. Profile Picture (Circular)
      const pfpUrl = `https://graph.facebook.com/${targetID}/picture?width=500&height=500`;
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

      // 3. Name & Bio Text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 48px Arial";
      ctx.fillText(name, 310, 540);

      ctx.font = "italic 22px Arial";
      ctx.fillStyle = "#555555";
      ctx.fillText(bio.length > 60 ? bio.substring(0, 60) + "..." : bio, 310, 580);

      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#1877F2";
      ctx.fillText(`👥 ${followers} Followers`, 310, 620);

      // 4. Info Section (Grid Layout)
      ctx.font = "24px Arial";
      ctx.fillStyle = "#333";
      
      // Row 1
      ctx.fillText(`🎂 Birthday: ${bday}`, 80, 720);
      ctx.fillText(`⚧ Gender: ${gender}`, 550, 720);
      
      // Row 2
      ctx.fillText(`🏠 From: ${home}`, 80, 780);
      ctx.fillText(`📍 Lives in: ${loc}`, 550, 780);
      
      // Row 3
      ctx.fillText(`💍 Status: ${relationship}`, 80, 840);
      ctx.fillText(`🆔 UID: ${targetID}`, 550, 840);
      
      // Row 4
      ctx.fillText(`🔗 Username: ${username}`, 80, 900);

      // Footer
      ctx.fillStyle = "#1877F2";
      ctx.font = "bold 20px Arial";
      ctx.fillText("DATA POWERED BY PRIYANSHU API", 350, 970);

      // Save and Send
      const cachePath = path.join(__dirname, "cache", `stalk_${targetID}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(cachePath, buffer);

      return api.sendMessage({
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error: API se data fetch nahi ho saka. Key check karein ya ID valid nahi hai.", threadID, messageID);
    }
  }
};
