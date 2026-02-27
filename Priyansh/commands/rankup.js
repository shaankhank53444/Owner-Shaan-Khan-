const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const cacheDir = path.join(__dirname, "cache", "rankup");
const remoteBgUrl = "https://i.ibb.co/MkFZt3sH/594446bbfd2a.jpg";

module.exports = {
  config: {
    name: "rankup",
    version: "2.4.0",
    credits: "SHAAN",
    countDown: 2,
    role: 0,
    description: "Stable Rankup System - Har 5 message pe level up",
    category: "system",
    guide: "{pn}",
    prefix: true
  },

  handleEvent: async function({ api, event, Currencies, Users }) {
    const { threadID, senderID, body } = event;
    if (!senderID || !threadID || senderID == api.getCurrentUserID()) return;

    try {
      // Data fetch karein
      let userData = (await Currencies.getData(senderID)) || {};
      let exp = userData.exp || 0;
      
      // Har message pe 1 exp barhayein
      exp += 1;

      // Level calculation (Har 5 messages = 1 Level)
      let oldLevel = Math.floor((exp - 1) / 5);
      let newLevel = Math.floor(exp / 5);

      // Database mein update karein (Taaki restart pe reset na ho)
      await Currencies.setData(senderID, { exp });

      // Agar level up hua hai
      if (newLevel > oldLevel && newLevel > 0) {
        const name = await Users.getNameUser(senderID) || "User";
        
        // Reward: 100 coins har level up pe
        let money = userData.money || 0;
        await Currencies.setData(senderID, { money: money + 100 });

        return this.makeRankCard({ api, event, name, newLevel });
      }
    } catch (err) {
      // console.log(err); 
    }
  },

  run: async function({ api, event, Currencies }) {
    // !rankup command check karne ke liye
    const data = await Currencies.getData(event.senderID);
    const exp = data.exp || 0;
    const level = Math.floor(exp / 5);
    return api.sendMessage(`📊 [ SHAAN RANK STATUS ]\n\n👤 User: ${event.senderID}\n🏆 Current Level: ${level}\n✨ Total Messages: ${exp}`, event.threadID);
  },

  makeRankCard: async function({ api, event, name, newLevel }) {
    const { threadID, senderID } = event;
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const outputPath = path.join(cacheDir, `rank_${senderID}_${Date.now()}.png`);
    const bgPath = path.join(cacheDir, "rank_bg.jpg");

    try {
      // Background download agar nahi hai
      if (!fs.existsSync(bgPath)) {
        const getBg = await axios.get(remoteBgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(getBg.data));
      }

      const image = await loadImage(bgPath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Avatar
      try {
        const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarImg = await loadImage(Buffer.from(avatarRes.data));
        ctx.drawImage(avatarImg, 307, 150, 120, 120);
      } catch (e) {}

      // Text setup
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      
      ctx.font = "bold 35px Arial";
      ctx.fillText(name.toUpperCase(), 370, 370);
      
      ctx.font = "bold 45px Arial";
      ctx.fillStyle = "#00ff66";
      ctx.fillText(newLevel, 200, 455);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      return api.sendMessage({
        body: `🎊 𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀, ${name}! 🎊\n\nAapka level up ho gaya hai!\n🏆 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: ${newLevel}\n💰 𝗥𝗲𝘄𝗮𝗿𝗱: +100 Coins\n\n- Created by SHAAN`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });

    } catch (err) {
      return api.sendMessage(`🎊 Level Up! ${name} reached Level ${newLevel}!`, threadID);
    }
  }
};
