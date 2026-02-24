module.exports.config = {
  name: "botinfo",
  version: "1.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Bot info with dynamic owner name detection.",
  commandCategory: "system",
  usages: "botinfo",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const moment = require("moment-timezone");

  try {
    api.setMessageReaction("✨", messageID, (err) => {}, true);

    // Time & Uptime
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const time = moment.tz("Asia/Karachi").format("DD/MM/YYYY』 【HH:mm:ss");

    // Owner Info Logic
    const ownerID = global.config.ADMINBOT[0];
    const prefix = global.config.PREFIX;
    
    // Automatic Name Detection
    let info = await api.getUserInfo(ownerID);
    let ownerName = info[ownerID].name;

    let msg = "╭━━━━━━━━━━━━━━╮\n";
    msg += "   ✨ 𝙄𝙉𝙁𝙊 ✨\n";
    msg += "╰━━━━━━━━━━━━━━╯\n\n";

    msg += `📛 𝙉𝘼𝙈𝙀: ${global.config.BOTNAME}\n`;
    msg += `🔰 𝙋𝙍𝙀𝙁𝙄𝙓: ${prefix}\n`;
    msg += `⏱️ 𝙐𝙋𝙏𝙄𝙈𝙀: ${hours}h ${minutes}m ${seconds}s\n`;
    msg += `📅 𝘿𝘼𝙏𝙀 & 𝙏𝙄𝙈𝙀: 『${time}】\n\n`;

    msg += `👑 𝘽𝙊𝙏 𝙊𝙐𝙉𝙀𝙍: ${ownerName}\n`;
    msg += `👑 𝘽𝙊𝙏 𝙊𝙐𝙉𝙀𝙍 UID: ${ownerID}\n\n`;

    msg += "📚 𝙇𝙀𝘼𝙍𝙉 𝘽𝙊𝙏 𝘾𝙍𝙀𝘼𝙏𝙄𝙊𝙉:\n";
    msg += "🔗 𝙎𝙃𝘼𝘼𝙉 𝙆𝙃𝘼𝙉 - +923368783346";

    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error(error);
    // Fallback agar name fetch na ho sake
    return api.sendMessage("❌ Error: Owner details fetch nahi ho sakein.", threadID);
  }
};
