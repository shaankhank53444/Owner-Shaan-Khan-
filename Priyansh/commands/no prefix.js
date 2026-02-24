module.exports.config = {
  name: "prefix",
  version: "5.5.0",
  hasPermssion: 0,
  credits: "SHAAN", // LOCKED
  description: "Send BOT INFO + Owner Card on Prefix Command",
  commandCategory: "Tools",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {

  // 🔒 Security Lock
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

  // Prefix ko [ ] ke andar rakha gaya hai jaisa aapne manga tha
  const infoText = `┏━━━━━━━━━━━━━━━━━━━┓
┃      𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡     ┃
┗━━━━━━━━━━━━━━━━━━━┛

👋 Hi ${name}!

🤖 Bot Name: ${botName}
🆔 Bot ID: ${botID}

📌 Prefix: [ ${prefix} ]
📊 Commands: ${totalCommands}

👥 Total Users: ${totalUsers}
💬 Total Threads: ${totalThreads}

💡 Try typing "${prefix}help" to see available commands!

👑 Bot Owner:`;

  // Ek hi unit mein Text + Contact Card jayega
  return api.shareContact(infoText, ownerID, event.threadID);
};
