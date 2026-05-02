const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
  name: "rank",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Check your rank and level status",
  commandCategory: "Economy",
  usages: "[@mention/empty]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    // Determine Target ID
    let targetID = senderID;
    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // Get Data from Mirai Hooks
    const userData = await Users.getData(targetID);
    const currencyData = await Currencies.getData(targetID);

    if (!userData || !currencyData) {
      return api.sendMessage("❌ User data missing in database.", threadID, messageID);
    }

    const name = userData.name || "Facebook User";
    const level = currencyData.data.level || 1;
    const currentExp = currencyData.data.exp || 0;
    const money = currencyData.money || 0;

    // XP Logic (Same as your logic)
    let xpNeeded = level === 1 ? 40 : level === 2 ? 60 : level === 3 ? 80 : level * 20;
    const progressPercentage = Math.min(100, Math.floor((currentExp / xpNeeded) * 100));

    // --- CANVAS GENERATION ---
    const width = 1200;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Premium Themes
    const themes = [
      { bg: ['#0f0c29', '#302b63', '#24243e'], accent: '#00f2ff' },
      { bg: ['#000000', '#0f2027', '#203a43'], accent: '#00ff99' },
      { bg: ['#141e30', '#243b55', '#141e30'], accent: '#ffd700' }
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, theme.bg[0]);
    gradient.addColorStop(0.5, theme.bg[1]);
    gradient.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Alpha Shapes
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 80, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Glass Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(50, 50, width - 100, height - 100, 30);
    ctx.fill();

    // Avatar Logic
    try {
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      const avatar = await loadImage(Buffer.from(response.data));

      ctx.save();
      ctx.beginPath();
      ctx.arc(215, 200, 115, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, 100, 85, 230, 230);
      ctx.restore();

      // Avatar Border
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 8;
      ctx.stroke();
    } catch (e) {
      console.log("Avatar loading failed, using placeholder.");
    }

    // Text & Info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText(name.length > 15 ? name.substring(0, 15) + "..." : name, 380, 160);

    ctx.font = '40px sans-serif';
    ctx.fillStyle = theme.accent;
    ctx.fillText(`Level: ${level}`, 380, 225);

    ctx.fillStyle = '#ffffff';
    const xpInfo = `${currentExp} / ${xpNeeded} XP`;
    ctx.fillText(xpInfo, width - ctx.measureText(xpInfo).width - 100, 225);

    // Progress Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(380, 270, 720, 40, 20);
    ctx.fill();

    const filledWidth = (currentExp / xpNeeded) * 720;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.roundRect(380, 270, Math.max(20, filledWidth), 40, 20);
    ctx.fill();

    // File Output
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const pathImg = path.join(cacheDir, `rank_${targetID}.png`);
    fs.writeFileSync(pathImg, canvas.toBuffer());

    // Construct Text
    const responseText = `👤 𝗥𝗔𝗡𝗞 𝗜𝗡𝗙𝗢\n━━━━━━━━━━━━━\n👤 Name: ${name}\n📊 Level: ${level}\n✨ XP: ${currentExp}/${xpNeeded}\n💰 Money: ${money}`;

    return api.sendMessage({
      body: responseText,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => fs.unlinkSync(pathImg), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Error generating rank card.", threadID, messageID);
  }
};
