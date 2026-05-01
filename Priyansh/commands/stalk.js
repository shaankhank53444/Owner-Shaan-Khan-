const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "stalk",
    version: "9.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "FB Stalk via New Priyanshu POST API (Fixed Structure)",
    commandCategory: "utility",
    usages: "[link/UID/mention]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    let targetLink = "";
    if (args[0] && args[0].includes("facebook.com")) {
      targetLink = args[0];
    } else {
      let id = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      targetLink = `https://www.facebook.com/${id}`;
    }

    try {
      await api.sendMessage("🔍 Data fetch ho raha hai...", threadID);

      const apiKey = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c";

      const res = await axios({
        method: 'POST',
        url: 'https://priyanshuapi.xyz/api/runner/fb-stalk/stalk',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          link: targetLink
        }
      });

      // --- CRITICAL FIX: Accessing .data.data ---
      const apiResponse = res.data;
      if (!apiResponse || !apiResponse.data) {
        return api.sendMessage("❌ API ne data nahi diya. Check karein link ya key.", threadID, messageID);
      }

      const user = apiResponse.data; // Ab hum data ke andar ghus gaye hain

      // Mapping variables according to your new structure
      const name = user.name || "Facebook User";
      const bday = user.birthday || "Not Public";
      const gender = user.gender || "Unknown";
      const followers = user.follower || "0";
      const uid = user.id || "N/A";
      const relationship = user.relationship_status || "Not Specified";
      const pfpUrl = user.profilePictureUrl || `https://graph.facebook.com/${uid}/picture?width=500`;

      // --- CANVAS DRAWING ---
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);

      // Profile Picture & Design
      try {
        const pfpImg = await loadImage(pfpUrl);
        // Header Background
        ctx.fillStyle = "#1877F2";
        ctx.fillRect(0, 0, 1000, 350);

        ctx.save();
        ctx.beginPath();
        ctx.arc(500, 350, 150, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.clip();
        ctx.drawImage(pfpImg, 350, 200, 300, 300);
        ctx.restore();
      } catch (e) {
        console.log("Image load error:", e.message);
      }

      // Details
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.font = "bold 55px Arial";
      ctx.fillText(name, 500, 560);

      ctx.textAlign = "left";
      ctx.font = "30px Arial";
      ctx.fillStyle = "#333";
      ctx.fillText(`🎂 Birthday: ${bday}`, 100, 680);
      ctx.fillText(`⚧ Gender: ${gender}`, 600, 680);
      ctx.fillText(`👥 Followers: ${followers}`, 100, 760);
      ctx.fillText(`💍 Status: ${relationship}`, 600, 760);
      ctx.fillText(`🆔 UID: ${uid}`, 100, 840);

      // Footer
      ctx.textAlign = "center";
      ctx.fillStyle = "#1877F2";
      ctx.font = "bold 25px Arial";
      ctx.fillText("STALK SYSTEM POWERED BY PRIYANSHU API", 500, 950);

      const cachePath = path.join(__dirname, "cache", `stalk_${uid}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      
      fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: `✅ Stalk Complete: ${name}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (err) {
      console.error(err.response?.data || err);
      return api.sendMessage(`❌ Error: API structure badal gaya hai ya Key block hai.`, threadID, messageID);
    }
  }
};
