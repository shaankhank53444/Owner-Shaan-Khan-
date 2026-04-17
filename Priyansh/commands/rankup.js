const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: "rankup",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "Priyansh / Gemini",
    description: "Levels up hone par automatic notification aur bonus",
    commandCategory: "Economy",
    usages: "Automatic",
    cooldowns: 2,
    dependencies: {
      "canvas": "",
      "axios": "",
      "fs-extra": ""
    }
  },

  // Yeh part har message par automatic kaam karega
  handleEvent: async function({ api, event, Currencies }) {
    const { threadID, senderID, body } = event;
    if (senderID == api.getCurrentUserID()) return;

    try {
      // User ka data database se uthana
      let userData = await Currencies.getData(senderID);
      let exp = userData.exp || 0;
      
      // Level calculation formula: sqrt(1 + (4 * exp) / factor) / 2
      let currentLevel = Math.floor(Math.sqrt(1 + (4 * exp) / 400) / 2);

      // Agar user pehli baar message kar raha hai toh level set karein
      if (typeof userData.data.level == "undefined") {
        userData.data.level = currentLevel;
        await Currencies.setData(senderID, { data: userData.data });
        return;
      }

      // Check agar level badha hai
      if (currentLevel > userData.data.level) {
        const userInfo = await api.getUserInfo(senderID);
        const name = userInfo[senderID].name;
        
        // Bonus: Level ke hisaab se paise milenge
        const bonusMoney = currentLevel * 100;
        await Currencies.increaseMoney(senderID, bonusMoney);
        
        // Naya level database mein save karein
        userData.data.level = currentLevel;
        await Currencies.setData(senderID, { data: userData.data });

        // Cache folder check karein
        const cachePath = path.join(__dirname, "cache");
        if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
        
        const imgPath = path.join(cachePath, `rank_${senderID}.png`);

        // Image generate karein
        await drawRankCard(senderID, name, currentLevel, imgPath);

        // Notification message
        const msg = {
          body: `🎉 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣! 🎉\n━━━━━━━━━━━━━━━━━━\nCongratulations ${name}!\nAapne Level ${currentLevel} cross kar liya hai.\n\n💰 Bonus: +${bonusMoney} coins`,
          attachment: fs.createReadStream(imgPath),
          mentions: [{ tag: name, id: senderID }]
        };

        return api.sendMessage(msg, threadID, () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        });
      }
    } catch (err) {
      // Error logging (optional)
    }
  },

  run: async function({ api, event }) {
    return api.sendMessage("Aapka rankup system active hai! Bas group mein chat karein.", event.threadID);
  }
};

// --- Canvas Drawing Function ---
async function drawRankCard(userID, name, level, imgPath) {
  const width = 1000;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background (Dark Premium Style)
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(1, '#16213e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Borders & Glow
  ctx.strokeStyle = '#00d2ff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Avatar Loading
  try {
    const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
    const avatarImg = await loadImage(res.data);

    // Circle Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 175, 120, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, 60, 55, 240, 240);
    ctx.restore();

    // Avatar Ring
    ctx.beginPath();
    ctx.arc(180, 175, 125, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#3a86ff';
    ctx.lineWidth = 8;
    ctx.stroke();
  } catch (e) {
    console.log("Avatar fetch error");
  }

  // Text details
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px sans-serif';
  ctx.fillText("LEVEL UP", 350, 130);

  ctx.fillStyle = '#3a86ff';
  ctx.font = '45px sans-serif';
  ctx.fillText(name.toUpperCase(), 350, 200);

  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 55px sans-serif';
  ctx.fillText(`LVL: ${level}`, 350, 280);

  fs.writeFileSync(imgPath, canvas.toBuffer());
}
