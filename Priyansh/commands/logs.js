/**
 * Logs Command for Mirai Bot
 * Manages logging of messages in console with color formatting
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config.json');

function saveConfig() {
  try {
    if (typeof global.saveConfig === 'function') {
      global.saveConfig();
    } else if (global.config) {
      fs.writeFileSync(configPath, JSON.stringify(global.config, null, 2));
    }
  } catch (error) {
    console.error('Failed to save config for logs command:', error);
  }
}

// Enable logs based on saved config (default true)
if (global.config && typeof global.config.logsEnabled !== 'boolean') {
  global.config.logsEnabled = true;
  saveConfig();
}

// Function to generate random hex colors
function getRandomColor() {
  return Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// Function to log formatted message
function logMessage(details) {
  if (!global.config || !global.config.logsEnabled) return;

  const { threadName, threadID, userName, userID, userMessage, time } = details;

  const random = getRandomColor();
  const random1 = getRandomColor();
  const random2 = getRandomColor();
  const random3 = getRandomColor();
  const random4 = getRandomColor();
  const random5 = getRandomColor();
  const random6 = getRandomColor();

  console.log(
    chalk.hex("#" + random)(`[💓]→ Group name: ${threadName || "Private Chat"}`) + `\n` + 
    chalk.hex("#" + random5)(`[🔎]→ Group ID: ${threadID}`) + `\n` + 
    chalk.hex("#" + random6)(`[🔱]→ User name: ${userName || "Unknown"}`) + `\n` + 
    chalk.hex("#" + random1)(`[📝]→ User ID: ${userID}`) + `\n` + 
    chalk.hex("#" + random2)(`[📩]→ Content: ${userMessage}`) + `\n` + 
    chalk.hex("#" + random3)(`[ ${time} ]`) + `\n` + 
    chalk.hex("#" + random4)(`◆━━━━━━━━━◆PRIYANSH BOT🐧◆━━━━━━━━◆\n`)
  );
}

module.exports.config = {
  name: "logs",
  version: "1.0.1",
  hasPermssion: 2, // 2 = Admin permission in Mirai
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
  description: "Manage and display colorful console logs",
  commandCategory: "Admin",
  usages: "[on/off]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prefix = global.config.PREFIX || "/";

  // Check if arguments are provided
  if (!args || args.length === 0) {
    const status = global.config.logsEnabled ? "✅ ENABLED" : "❌ DISABLED";
    const helpText = `📊 LOGS STATUS: ${status}\n\n` +
      `📝 Usage:\n` +
      `• ${prefix}logs on - Enable colorful logs\n` +
      `• ${prefix}logs off - Disable logs\n\n` +
      `🎨 Log Format:\n` +
      `• Group name & ID with random colors\n` +
      `• User name & ID with random colors\n` +
      `• Message content with random colors\n` +
      `• Timestamp with random colors\n` +
      `• Beautiful separator with SHAAN BOT🐧`;

    return api.sendMessage(helpText, threadID, messageID);
  }

  const action = args[0].toLowerCase();

  if (action === 'on') {
    global.config.logsEnabled = true;
    saveConfig();
    return api.sendMessage("✅ Colorful logging is now ENABLED! 🎨\n\nAll messages will be logged to console with random colors.", threadID, messageID);
  } else if (action === 'off') {
    global.config.logsEnabled = false;
    saveConfig();
    return api.sendMessage("🛑 Logging is now DISABLED! 📵\n\nNo messages will be logged to console.", threadID, messageID);
  } else {
    return api.sendMessage(
      `❌ Invalid argument: "${action}"\n\nUse 'on' or 'off'\n\nExample: ${prefix}logs on`,
      threadID,
      messageID
    );
  }
};

// Automatic message listening for Mirai Bot
module.exports.handleEvent = async function ({ api, event, Users, Threads }) {
  if (!global.config || !global.config.logsEnabled) return;
  if (!event.body) return;

  try {
    const time = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const userName = (await Users.getNameUser(event.senderID)) || "Unknown User";
    
    let threadName = "Private Chat";
    if (event.isGroup) {
      const threadInfo = await Threads.getInfo(event.threadID);
      threadName = threadInfo.threadName || "Unnamed Group";
    }

    logMessage({
      threadName,
      threadID: event.threadID,
      userName,
      userID: event.senderID,
      userMessage: event.body,
      time
    });
  } catch (error) {
    console.error("Error in logs handleEvent:", error);
  }
};
