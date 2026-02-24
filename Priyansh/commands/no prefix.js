module.exports.config = {
  name: "prefix",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "SHAAN", // LOCKED
  description: "Send BOT INFO + Owner Card in Single Message",
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

  const fs = global.nodemodule["fs-extra"];  
  const request = global.nodemodule["request"];  

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

  const filePath = __dirname + `/cache/bot_info_${uid}.png`;  

  let callback = () =>  
      api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(filePath)
      }, event.threadID, async (err, info) => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          
          // Screenshot style Contact Card trigger (Single message behavior)
          return api.shareContact("👑 Bot Owner:", ownerID, event.threadID);
      }, event.messageID);

  return request(
      encodeURI(`https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
  )
      .pipe(fs.createWriteStream(filePath))
      .on("close", callback);
};
