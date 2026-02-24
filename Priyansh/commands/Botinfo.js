module.exports.config = {
  name: "botinfo",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Bot info with Shaan Khan's image and ImgBB link.",
  commandCategory: "system",
  usages: "botinfo",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const fs = require("fs-extra");
  const axios = require("axios");
  const moment = require("moment-timezone");

  try {
    api.setMessageReaction("⏳", messageID, (err) => {}, true);

    // Time calculations
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const time = moment.tz("Asia/Karachi").format("DD/MM/YYYY』 【HH:mm:ss");

    // Config details
    const prefix = global.config.PREFIX;
    const ownerID = global.config.ADMINBOT[0] || "ID Not Found";

    // ImgBB Direct Link (Aapki Pic)
    const imgURL = "https://i.ibb.co/vzYm8mS/image.png"; 
    const path = __dirname + "/cache/shaan_info.png";

    // Image download logic
    const response = await axios.get(imgURL, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

    let msg = "╭━━━━━━━━━━━━━━╮\n";
    msg += "   ✨ 𝙄𝙉𝙁𝙊 ✨\n";
    msg += "╰━━━━━━━━━━━━━━╯\n\n";

    msg += `📛 𝙉𝘼𝙈𝙀: ${global.config.BOTNAME}\n`;
    msg += `🔰 𝙋𝙍𝙀𝙁𝙄𝙓: ${prefix}\n`;
    msg += `⏱️ 𝙐𝙋𝙏𝙄𝙈𝙀: ${hours}h ${minutes}m ${seconds}s\n`;
    msg += `📅 𝘿𝘼𝙏𝙀 & 𝙏𝙄𝙈𝙀: 『${time}】\n\n`;

    msg += `👑 𝘽𝙊𝙏 𝙊𝙒𝙉𝙀𝙍: SHAAN KHAN\n`;
    msg += `👑 𝘽𝙊𝙏 𝙊𝙒𝙉𝙀𝙍 UID: ${ownerID}\n\n`;

    msg += "📚 𝙇𝙀𝘼𝙍𝙉 𝘽𝙊𝙏 𝘾𝙍𝙀𝘼𝙏𝙄𝙊𝙉:\n";
    msg += "🔗 𝙎𝙃𝘼𝘼𝙉 𝙆𝙃𝘼𝙉 - +923368783346";

    api.setMessageReaction("✅", messageID, (err) => {}, true);

    return api.sendMessage({
      body: msg,
      attachment: fs.createReadStream(path)
    }, threadID, () => {
      if (fs.existsSync(path)) fs.unlinkSync(path); // File delete after send
    }, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("❌ Kuch masla ho gaya hai image load karne mein.", threadID);
  }
};
