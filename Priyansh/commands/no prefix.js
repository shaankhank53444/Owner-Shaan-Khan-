module.exports.config = {
  name: "prefix",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "SHAAN", // UPDATED & LOCKED
  description: "Send FB Contact Card + BOT INFO With DP",
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

  // 🔒 Credit Lock Protection (Now Locked to SHAAN)
  if (module.exports.config.credits !== "SHAAN") {  
      return api.sendMessage(
          "⚠ SECURITY ALERT ⚠\n❌ Credits modification detected! Original Creator: SHAAN",  
          event.threadID,  
          event.messageID  
      );  
  }

  const fs = global.nodemodule["fs-extra"];  
  const request = global.nodemodule["request"];  

  // --- Dynamic Details ---
  const botID = api.getCurrentUserID();
  const botName = global.config.BOTNAME || "FB Bot";
  
  // Config se Admin ID aur Database se Admin Name fetch karna
  const ownerID = global.config.ADMINBOT[0]; 
  const ownerName = await Users.getNameUser(ownerID); 

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

💡 Try typing "${prefix}help" to see available commands!

👑 Bot Owner: ${ownerName}
🔗 Profile: https://www.facebook.com/profile.php?id=${ownerID}`;

  const filePath = __dirname + `/cache/bot_info_${uid}.png`;  

  let callback = () =>  
      api.sendMessage(
          { body: msg, attachment: fs.createReadStream(filePath) },
          event.threadID,
          () => {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          },
          event.messageID
      );

  // User ki profile picture fetch karke attachment mein bhejna
  return request(
      encodeURI(`https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
  )
      .pipe(fs.createWriteStream(filePath))
      .on("close", callback);
};
