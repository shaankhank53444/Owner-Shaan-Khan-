module.exports.config = {
  name: "botinfo",
  version: "1.7.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Bot info with image and dynamic owner name.",
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

    // Time & Uptime
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const time = moment.tz("Asia/Karachi").format("DD/MM/YYYY』 【HH:mm:ss");

    // Owner Info (Dynamic)
    const ownerID = global.config.ADMINBOT[0];
    const prefix = global.config.PREFIX;
    const botName = global.config.BOTNAME;

    // Fetch Owner Name from Facebook
    let userInfo = await api.getUserInfo(ownerID);
    let ownerName = userInfo[ownerID].name;

    // Image Setup
    const imgURL = "https://i.ibb.co/SDZnM6gN/6c26d22cf230.jpg";
    const path = __dirname + "/cache/bot_info_pic.jpg";

    // Download Image
    const response = await axios.get(imgURL, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

    let msg = "╭━━━━━━━━━━━━━━╮\n";
    msg += "   ✨ 𝙄𝙉𝙁𝙊 ✨\n";
    msg += "╰━━━━━━━━━━━━━━╯\n\n";

    msg += `📛 𝙉𝘼𝙈𝙀: ${botName}\n`;
    msg += `🔰 𝙋𝙍𝙀𝙁𝙄𝙓: ${prefix}\n`;
    msg += `⏱️ 𝙐𝙋𝙏𝙄𝙈𝙀: ${hours}h ${minutes}m ${seconds}s\n`;
    msg += `📅 𝘿𝘼𝙏𝙀 & 𝙏𝙄𝙈𝙀: 『${time}】\n\n`;

    msg += `👑 𝘽𝙊𝙏 𝙊𝙒𝙉𝙀𝙍: ${ownerName}\n`;
    msg += `👑 𝘽𝙊𝙏 𝙊𝙒𝙉𝙀𝙍 UID: ${ownerID}\n\n`;

    msg += "📚 𝙇𝙀𝘼𝙍𝙉 𝘽𝙊𝙏 𝘾𝙍𝙀𝘼𝙏𝙄𝙊𝙉:\n";
    msg += "🔗 𝙎𝙃𝘼𝘼𝙉 𝙆𝙃𝘼𝙉 - +923368783346";

    api.setMessageReaction("✅", messageID, (err) => {}, true);

    return api.sendMessage({
      body: msg,
      attachment: fs.createReadStream(path)
    }, threadID, () => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: Info ya image load nahi ho saki.", threadID);
  }
};
