const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

module.exports = {
  config: {
    name: "stalk",
    version: "4.5.0",
    hasPermssion: 0,
    credits: "Gemini AI",
    description: "Fetch Profile with UI Card look",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; 

    try {
      let targetID = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      if (targetID.includes("facebook.com")) {
          const match = targetID.match(/(?:profile\.php\?id=)?([0-9]+)/);
          if (match) targetID = match[1];
      }

      await api.sendMessage("🔍 Generating Profile Card...", threadID);

      const res = await axios.get(`https://graph.facebook.com/${targetID}?fields=name,first_name,birthday,hometown,location,gender,subscribers.limit(0).summary(true),link,cover,username&access_token=${token}`);
      const data = res.data;

      // Data setup
      const name = data.name || "User Name";
      const bday = data.birthday || "00/00/0000";
      const gender = data.gender || "male";
      const home = data.hometown ? data.hometown.name : "Mumbai, Maharashtra";
      const loc = data.location ? data.location.name : "Mumbai, Maharashtra";
      const followers = data.subscribers ? data.subscribers.summary.total_count : "0";
      const username = data.username || "Not Set";

      // Canvas Dimensions (Image jaisa ratio)
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");

      // 1. Background (White)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);

      // 2. Cover Photo Logic
      try {
        const coverUrl = data.cover ? data.cover.source : `https://graph.facebook.com/${targetID}/picture?width=1000&height=500`;
        const coverImg = await loadImage(coverUrl);
        ctx.drawImage(coverImg, 0, 0, 1000, 500);
      } catch(e) {
        ctx.fillStyle = "#333";
        ctx.fillRect(0, 0, 1000, 500);
      }

      // 3. Profile Picture (Circle with Border)
      const pfpUrl = `https://graph.facebook.com/${targetID}/picture?width=500&height=500`;
      const pfpImg = await loadImage(pfpUrl);
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(170, 500, 110, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(pfpImg, 60, 390, 220, 220);
      ctx.restore();

      // 4. Name and Followers
      ctx.fillStyle = "#000000";
      ctx.font = "bold 45px Arial";
      ctx.fillText(name, 300, 540);
      ctx.font = "30px Arial";
      ctx.fillStyle = "#65676b";
      ctx.fillText(`${followers} followers`, 300, 590);

      // 5. Divider Line
      ctx.strokeStyle = "#e4e6eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 630);
      ctx.lineTo(950, 630);
      ctx.stroke();

      // 6. Info Details (Icons and Text)
      ctx.fillStyle = "#000000";
      ctx.font = "28px Arial";
      
      const startY = 680;
      const gap = 60;

      ctx.fillText(`🎂 Birthday:  ${bday}`, 70, startY);
      ctx.fillText(`⚧ Gender:  ${gender}`, 530, startY);
      
      ctx.fillText(`🏠 Hometown:  ${home}`, 70, startY + gap);
      ctx.fillText(`📍 Location:  ${loc}`, 530, startY + gap);
      
      ctx.fillText(`👥 Status:  No data`, 70, startY + gap * 2);
      ctx.fillText(`🆔 ID:  ${targetID}`, 530, startY + gap * 2);
      
      ctx.fillText(`🆔 Username:  ${username}`, 70, startY + gap * 3);

      // 7. Footer Button (FB Profile Style)
      ctx.fillStyle = "#4267B2";
      ctx.roundRect(780, 910, 180, 50, 10);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.fillText("FB PROFILE", 815, 942);

      // Save and Send
      const cachePath = path.join(__dirname, "cache", `stalk_${targetID}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      
      fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: `✅ Profile Fetched for: ${name}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error: Data fetch nahi ho paya. Token expire ho sakta hai.", threadID, messageID);
    }
  }
};
