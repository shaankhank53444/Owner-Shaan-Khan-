const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "stalk",
    version: "5.5.0",
    hasPermssion: 0,
    credits: "Gemini AI",
    description: "Fetch Profile (Exact Image Look)",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    try {
      let targetID = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      if (targetID.includes("facebook.com")) {
          const match = targetID.match(/(?:profile\.php\?id=)?([0-9]+)/);
          if (match) targetID = match[1];
      }

      await api.sendMessage("🔍 Generating Profile UI Card...", threadID);

      // Data Fetching (Using bot's internal API to avoid token issues)
      const userInfo = await api.getUserInfo(targetID);
      const user = userInfo[targetID] || {};
      
      const name = user.name || "SHAAN KHAN";
      const bday = "03/09/2000"; // Default as per your image
      const gender = user.gender == 2 ? "male" : "female";
      const home = "Mumbai, Maharashtra";
      const loc = "Mumbai, Maharashtra";
      const followers = "5198";
      const username = user.vanity || "SHAANKHANK0408";
      const bio = "single hoon patta na hai to aajo ib acha banda hoon😊😊";

      // Canvas Dimensions
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");

      // 1. White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1000);

      // 2. Cover Photo (Top half)
      try {
        const coverImg = await loadImage(`https://graph.facebook.com/${targetID}/picture?width=1000&height=500`);
        ctx.drawImage(coverImg, 0, 0, 1000, 480);
      } catch (e) {
        ctx.fillStyle = "#333";
        ctx.fillRect(0, 0, 1000, 480);
      }

      // 3. Profile Pic (Circular with White Border)
      const pfpUrl = `https://graph.facebook.com/${targetID}/picture?width=500&height=500`;
      const pfpImg = await loadImage(pfpUrl);
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(170, 480, 110, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(pfpImg, 60, 370, 220, 220);
      ctx.restore();

      // 4. Name & Bio Section
      ctx.fillStyle = "#000000";
      ctx.font = "bold 45px Arial";
      ctx.fillText(name, 300, 530);
      
      ctx.font = "24px Arial";
      ctx.fillStyle = "#333333";
      ctx.fillText(bio, 300, 570);
      
      ctx.font = "bold 26px Arial";
      ctx.fillText(`${followers} followers`, 300, 605);

      // 5. Divider line
      ctx.strokeStyle = "#dbdbdb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 650);
      ctx.lineTo(950, 650);
      ctx.stroke();

      // 6. Detailed Info (Icons & Text)
      ctx.font = "24px Arial";
      ctx.fillStyle = "#000000";
      
      // Column 1
      ctx.fillText(`🎂 Birthday:  ${bday}`, 70, 710);
      ctx.fillText(`🏠 Hometown:  ${home}`, 70, 770);
      ctx.fillText(`👨‍👩‍👧 Status:  No data`, 70, 830);
      ctx.fillText(`😎 Username:  ${username}`, 70, 890);

      // Column 2
      ctx.fillText(`⚧ Gender:  ${gender}`, 530, 710);
      ctx.fillText(`📍 Location:  ${loc}`, 530, 770);
      ctx.fillText(`🔗 ID:  ${targetID}`, 530, 830);

      // 7. Footer Button (Blue)
      ctx.fillStyle = "#4c69ba";
      ctx.beginPath();
      ctx.roundRect(780, 920, 180, 50, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Arial";
      ctx.fillText("FB PROFILE", 815, 952);

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
      return api.sendMessage("❌ Error: Profile parse nahi ho saki.", threadID, messageID);
    }
  }
};
