module.exports.config = {
  name: "prefix",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "SHAAN", // LOCKED
  description: "Send BOT INFO + Owner Card on Prefix",
  commandCategory: "Tools",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  if (!event.body) return;
  
  const prefix = global.config.PREFIX || "/";
  const text = event.body.toLowerCase();

  // Agar koi sirf prefix likhe ya "prefix" word likhe, tabhi ye chale
  if (text === prefix || text === "prefix") {
    return module.exports.run({ api, event, Users });
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

  const infoText = `┏━━━━━━━━━━━━━━━━━━━┓
 ┃    𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡  ┃
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

  // Combined Text + Contact Card
  return api.shareContact(infoText, ownerID, event.threadID);
};
