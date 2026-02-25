module.exports.config = {
  name: "prefix",
  version: "6.1.0",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Prefix detection only",
  commandCategory: "Tools",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  if (!event.body) return;

  const prefix = global.config.PREFIX || "/";
  
  // Strict Check: Sirf agar message bilkul prefix ke barabar ho
  if (event.body.trim() === prefix) {
    return module.exports.run({ api, event, Users });
  }
};

module.exports.run = async function ({ api, event, Users }) {
  // Hidden Security Check
  if (module.exports.config.credits !== "SHAAN") return;

  const botID = api.getCurrentUserID();
  const botName = global.config.BOTNAME || "FB Bot";
  const ownerID = global.config.ADMINBOT[0]; 

  let name = await Users.getNameUser(event.senderID);  
  const prefix = global.config.PREFIX || "/";

  const infoText = `┏━━━━━━━━━━━━━━━━━━━┓
 ┃    𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡  ┃
 ┗━━━━━━━━━━━━━━━━━━━┛

👋 Hi ${name}!

🤖 Bot Name: ${botName}
🆔 Bot ID: ${botID}

📌 Prefix: [ ${prefix} ]
📊 Commands: ${global.client.commands.size}

👥 Users: ${global.data.allUserID.length}
💬 Threads: ${global.data.allThreadID.length}

💡 Try typing "${prefix}help" for all commands!

👑 Bot Owner:`;

  return api.shareContact(infoText, ownerID, event.threadID);
};
