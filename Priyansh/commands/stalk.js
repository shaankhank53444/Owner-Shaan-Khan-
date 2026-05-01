const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "stalk",
    version: "8.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "FB Stalk via Priyanshu POST API (Mirai Optimized)",
    commandCategory: "utility",
    usages: "[link/UID/mention]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // 1. Target URL/Link Prepare Karein
    let targetLink = "";
    if (args[0] && args[0].includes("facebook.com")) {
      targetLink = args[0];
    } else {
      let id = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      targetLink = `https://www.facebook.com/${id}`;
    }

    try {
      await api.sendMessage("⏳ MongoDB & API se connect ho raha hai...", threadID);

      const apiKey = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c";

      // 2. API Call (POST Method)
      const res = await axios.post('https://priyanshuapi.xyz/api/runner/fb-stalk/stalk', 
        { link: targetLink },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const user = res.data;

      // Check karein ke API ne data bheja bhi hai ya nahi
      if (!user || user.error || !user.id) {
        return api.sendMessage(`❌ API Error: ${user.error || "Data fetch nahi ho saka."}`, threadID, messageID);
      }

      // 3. Canvas Setup
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");

      // Background drawing
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);

      // Cover & Profile Images (Safety checks ke sath)
      try {
        const cover = await loadImage(user.cover || "https://i.imgur.com/666666.png");
        ctx.drawImage(cover, 0, 0, 1000, 450);

        const pfp = await loadImage(`https://graph.facebook.com/${user.id}/picture?width=500&height=500`);
        ctx.save();
        ctx.beginPath();
        ctx.arc(180, 450, 130, 0, Math.PI * 2);
        ctx.lineWidth = 15;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(pfp, 50, 320, 260, 260);
        ctx.restore();
      } catch (imgErr) {
        ctx.fillStyle = "#1877F2";
        ctx.fillRect(0, 0, 1000, 450);
      }

      // Details Writing
      ctx.fillStyle = "#000000";
      ctx.font = "bold 50px Arial";
      ctx.fillText(user.name || "FB User", 340, 520);
      
      ctx.font = "28px Arial";
      ctx.fillStyle = "#333";
      ctx.fillText(`🎂 Birthday: ${user.birthday || "N/A"}`, 80, 700);
      ctx.fillText(`⚧ Gender: ${user.gender || "N/A"}`, 550, 700);
      ctx.fillText(`🏠 From: ${user.hometown || "N/A"}`, 80, 780);
      ctx.fillText(`👥 Followers: ${user.follower || "0"}`, 550, 780);
      ctx.fillText(`💍 Status: ${user.relationship_status || "N/A"}`, 80, 860);
      ctx.fillText(`🆔 UID: ${user.id}`, 550, 860);

      // Footer
      ctx.fillStyle = "#1877F2";
      ctx.font = "bold 20px Arial";
      ctx.fillText("STALK SYSTEM BY SHAAN KHAN", 350, 960);

      // 4. File Save aur Send
      const cachePath = path.join(__dirname, "cache", `stalk_${user.id}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      
      fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: `✅ Profile Stalked: ${user.name}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (err) {
      console.error(err);
      // Mirai users ke liye detailed error
      const msg = err.response?.data?.message || err.message;
      return api.sendMessage(`❌ MongoDB/API Connect Error: ${msg}`, threadID, messageID);
    }
  }
};
