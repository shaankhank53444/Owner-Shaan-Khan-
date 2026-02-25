module.exports.config = {
  name: "prefix",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "SHAAN", 
  description: "Reply only on 'prefix' word, ignore symbols",
  commandCategory: "Tools",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  if (!event.body) return;

  const msg = event.body.toLowerCase().trim();
  const configPrefix = global.config.PREFIX || "/";

  /* Logic: 
     1. Agar message sirf prefix symbol (. , / , ! etc) hai toh ignore karo.
     2. Agar message "prefix" word hai tabhi trigger karo.
  */
  if (msg === "prefix") {
    return module.exports.run({ api, event, Users });
  }

  // Agar koi sirf symbol bheje (jaise dot, slash, star) toh kuch mat karo
  if (msg === configPrefix || msg === "." || msg === "!" || msg === "*" || msg === "#") {
    return; 
  }
};

module.exports.run = async function ({ api, event, Users }) {
  // Silent Security Check (No visual lock detected)
  if (module.exports.config.credits !== "SHAAN") return;

  const botID = api.getCurrentUserID();
  const botName = global.config.BOTNAME || "FB Bot";
  const ownerID = global.config.ADMINBOT[0]; 

  let name = await Users.getNameUser(event.senderID);  
  const currentPrefix = global.config.PREFIX || "/";

  const infoText = `┏━━━━━━━━━━━━━━━━━━━┓
 ┃    𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡  ┃
 ┗━━━━━━━━━━━━━━━━━━━┛

👋 Hi ${name}!

🤖 Bot Name: ${botName}
🆔 Bot ID: ${botID}

📌 Prefix: [ ${currentPrefix} ]
📊 Commands: ${global.client.commands.size}

👥 Total Users: ${global.data.allUserID.length}
💬 Total Threads: ${global.data.allThreadID.length}

💡 Try typing "${currentPrefix}help" to see available commands!

👑 Bot Owner:`;

  return api.shareContact(infoText, ownerID, event.threadID);
};
