const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");
const os = require("os");

module.exports.config = {
  name: "up",
  version: "0.0.7",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Uptime, ping, CPU load, owner info with canvas image",
  commandCategory: "system",
  usages: "up",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const ping = Date.now() - event.timestamp;
    const cpuUsage = os.loadavg()[0].toFixed(2);
    const owner = "Shaan Khan";

    const canvas = Canvas.createCanvas(1000, 500);
    const ctx = canvas.getContext("2d");
    const bgUrl = "https://i.imgur.com/0kEWVsr.jpeg";
    const bgImg = await Canvas.loadImage(bgUrl);

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(0,0,0,0.25)");
    gradient.addColorStop(1, "rgba(0,0,0,0.5)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 8;

    const leftMargin = 40;
    let startY = 120;

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 60px Sans";
    ctx.fillText("BOT STATUS", leftMargin, startY);

    const infoTexts = [
      `Uptime: ${uptimeStr}`,
      `Ping: ${ping} ms`,
      `CPU Load: ${cpuUsage}`,
      `Owner: Shaan Khan`
    ];
    
    ctx.fillStyle = "#F0F0F0";
    ctx.font = "bold 40px Sans";

    startY += 80;
    const spacing = 70;

    infoTexts.forEach(text => {
      ctx.fillText(text, leftMargin, startY);
      startY += spacing;
    });

    const filePath = path.join(__dirname, "cache", `uptime_${event.senderID}.png`);

    // Cache directory check agar exist na karti ho
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"));
    }

    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    const bodyText = `✿•≫────•『SHAAN BOT』•────≪•✿\n⏳ Uptime: ${uptimeStr}\n📶 Ping: ${ping} ms\n🖥 CPU Load: ${cpuUsage}\n👑 Owner: ${owner}\n✿•≫───────────────≪•✿`;

    return api.sendMessage(
      {
        body: bodyText,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      },
      event.messageID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Could not fetch bot status.", event.threadID, event.messageID);
  }
};
