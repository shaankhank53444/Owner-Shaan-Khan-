module.exports.config = {
  name: "botinfo",
  version: "1.0.0",
  hasPermssion: 0, // PUBLIC
  credits: "Shaan Khan",
  description: "Bot ki mukammal maloomat aur status check karein.",
  commandCategory: "system",
  usages: "botinfo",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const fs = require("fs");

  try {
    // ⏳ Reaction lagana
    api.setMessageReaction("⏳", messageID, (err) => {}, true);

    // Commands aur Events count
    const commandCount = global.client.commands.size;
    const eventCount = global.client.events.size;
    const prefix = global.config.PREFIX;

    // Uptime calculation
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    let uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Admin & Owner IDs (Mirai config se)
    const ownerID = global.config.ADMINBOT[0] || ""; 
    const adminIDs = global.config.ADMINBOT || [];

    // System Info
    const nodeVersion = process.version;
    const platform = process.platform;

    // UI Formatting
    let msg = "╭─────────────────────────╮\n";
    msg += "│        🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎        │\n";
    msg += "╰─────────────────────────╯\n\n";

    msg += "📊 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬\n";
    msg += "┌─────────────────────────┐\n";
    msg += `│ 📝 Commands: ${commandCount}\n`;
    msg += `│ 🔔 Events: ${eventCount}\n`;
    msg += `│ ⚙️ Prefix: ${prefix}\n`;
    msg += `│ ⏱️ Uptime: ${uptimeStr}\n`;
    msg += `│ 🟢 Node: ${nodeVersion}\n`;
    msg += `│ 💻 OS: ${platform}\n`;
    msg += "└─────────────────────────┘\n\n";

    msg += "👑 𝐎𝐰𝐧𝐞𝐫 & 𝐀𝐝𝐦𝐢𝐧𝐬\n";
    msg += `• Owner ID: ${ownerID}\n`;
    msg += `• Total Admins: ${adminIDs.length}\n\n`;

    msg += "✨ 𝐅𝐞𝐚𝐭𝐮𝐫𝐞𝐬\n";
    msg += "• High Performance Mirai Core\n";
    msg += "• Automated Group Protection\n";
    msg += "• Interactive Game Suite\n\n";

    msg += "🚀 𝐐𝐮𝐢𝐜𝐤 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬\n";
    msg += `• ${prefix}help - Menu dekhein\n`;
    msg += `• ${prefix}ping - Speed check\n`;
    msg += `• ${prefix}uptime - Sirf uptime\n\n`;

    msg += "━━━━━━━━━━━━━━━━━━━━━━━\n";
    msg += "💡 Type /help to see all features.";

    // ✅ Success reaction aur message send karna
    api.setMessageReaction("✅", messageID, (err) => {}, true);
    
    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("❌ Kuch masla ho gaya hai info nikalne mein.", threadID);
  }
};
