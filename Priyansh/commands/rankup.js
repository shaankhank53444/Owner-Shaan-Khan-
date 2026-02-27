const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const cacheDir = path.join(__dirname, "cache", "rankup");
const remoteBgUrl = "https://i.ibb.co/MkFZt3sH/594446bbfd2a.jpg";

module.exports = {
  config: {
    name: "rankup",
    version: "2.3.0",
    credits: "SHAAN", // Creator Updated
    countDown: 5,
    role: 0,
    description: "Rankup system by SHAAN (Data saved permanently)",
    category: "system",
    guide: "{pn}",
    prefix: true
  },

  // Ye function har message ko monitor karta hai (Anti-Reset Logic)
  handleEvent: async function({ api, event, Currencies, Users }) {
    const { threadID, senderID } = event;
    if (senderID == api.getCurrentUserID() || !senderID || !threadID) return;

    try {
      // Database se user ka current data nikalna
      let userData = await Currencies.getData(senderID);
      let exp = userData.exp || 0;
      
      // Exp barhana (+1 per message)
      let newExp = exp + 1;

      // Level check: Har 5 messages par (aap 5 ko change kar sakte hain)
      let oldLevel = Math.floor(exp / 5);
      let newLevel = Math.floor(newExp / 5);

      // Data ko database mein save karna (Restart hone pe bhi level wahi rahega)
      await Currencies.setData(senderID, { exp: newExp });

      // Agar level up hua hai to notification bhejain
      if (newLevel > oldLevel && newLevel > 0) {
        const name = await Users.getNameUser(senderID);
        return this.handleRankup({ api, event, Users, Currencies, newLevel, name });
      }
    } catch (e) {
      console.log("Rankup Event Error: " + e);
    }
  },

  run: async function({ api, event, Currencies }) {
    // !rankup command for status
    const data = await Currencies.getData(event.senderID);
    const exp = data.exp || 0;
    const level = Math.floor(exp / 5);
    const nextExp = (level + 1) * 5;
    
    return api.sendMessage(`📊 | SHAAN RANK SYSTEM\n👤 User: ${event.senderID}\n🏆 Level: ${level}\n📈 Progress: ${exp}/${nextExp} messages.`, event.threadID);
  },

  handleRankup: async function({ api, event, Users, Currencies, newLevel, name }) {
    const { threadID, senderID } = event;
    const outputPath = path.join(cacheDir, `rank_${senderID}.png`);
    const tempPath = path.join(cacheDir, "rank_bg.jpg");

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      // Background cache check
      if (!fs.existsSync(tempPath)) {
        const res = await axios.get(remoteBgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempPath, Buffer.from(res.data));
      }

      // Reward logic
      const reward = 50; 
      const currentData = await Currencies.getData(senderID);
      const updatedMoney = (currentData.money || 0) + reward;
      await Currencies.setData(senderID, { money: updatedMoney });

      const image = await loadImage(tempPath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Avatar draw (Safe mode: image na mile to skip)
      try {
        const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarImg = await loadImage(Buffer.from(avatarRes.data));
        ctx.drawImage(avatarImg, 307, 150, 120, 120);
      } catch (e) { console.log("Avatar skip"); }

      // Styles
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 30px Arial";
      ctx.fillText(name.toUpperCase(), 370, 370);
      
      ctx.font = "bold 45px Arial";
      ctx.fillStyle = "#00ff66";
      ctx.fillText(`${newLevel}`, 200, 455);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      return api.sendMessage({
        body: `╔═════════════════╗\n   🎊 LEVEL UP NOTICE 🎊\n╚═════════════════╝\n\n👤 Name: ${name}\n🏆 New Level: ${newLevel}\n💰 Reward: +${reward} Coins\n\nCreated by: Shaan Khan`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });

    } catch (err) {
      console.error("Rankup Error: " + err);
      // Agar canvas fail ho jaye to text message bhej do
      return api.sendMessage(`🎊 Congratulations ${name}! You reached Level ${newLevel}!`, threadID);
    }
  }
};
