module.exports.config = {
  name: "prefix",
  version: "4.5.0",
  hasPermssion: 0,
  credits: "SHAAN", // LOCKED
  description: "Send BOT INFO + Owner Card (No DP)",
  commandCategory: "Tools",
  cooldowns: 5
};

const triggerWords = ["prefix", "help", "BOT PREFIX", "info", "hi bot", "hey bot"];

module.exports.handleEvent = async function ({ api, event, Users }) {
  if (!event.body) return;
  const text = event.body.toLowerCase();
  if (triggerWords.some(t => text === t || text.includes(t))) {
    module.exports.run({ api, event, Users });
  }
};

module.exports.run = async function ({ api, event, Users }) {

  if (module.exports.config.credits !== "SHAAN") {  
      return api.sendMessage("⚠ SECURITY ALERT ⚠\n❌ Credits modification detected!", event.threadID, event.messageID);  
  }

  const botID = api.getCurrentUserID();
  const botName = global.config.BOTNAME || "FB Bot";
  const ownerID = global.config.ADMINBOT[0]; 
  
  let uid = event.senderID;  
  let name = await Users.getNameUser(uid);  

  const prefix = global.config.PREFIX || "/";
  const totalUsers = global.data.allUserID.length;
  const totalThreads = global.data.allThreadID.length;
  const totalCommands = global.client.commands.size;

  const msg = `┏━━━━━━━━━━━━━━━━━━━┓
┃      𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡     ┃
┗━━━━━━━━━━━━━━━━━━━┛

👋 Hi ${name}!

🤖 Bot Name: ${botName}
🆔 Bot ID: ${botID}

📌 Prefix: ${prefix}
📊 Commands: ${totalCommands}

👥 Total Users: ${totalUsers}
💬 Total Threads: ${totalThreads}

💡 Try typing "${prefix}help" to see available commands!`;

  // Bina DP ke seedha message aur uske saath Contact Card
  return api.sendMessage(msg, event.threadID, () => {
      // Ye function owner ka card info message ke sath hi chipka dega
      return api.shareContact("👑 Bot Owner:", ownerID, event.threadID);
  }, event.messageID);
};
