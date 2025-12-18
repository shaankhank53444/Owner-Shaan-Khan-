module.exports.config = {
  name: "prefix",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "ARIF-BABU", // DO NOT CHANGE
  description: "Send FB Contact Card + BOT INFO With DP",
  commandCategory: "Tools",
  cooldowns: 5
};

// Trigger words (No Prefix)
const triggerWords = ["prefix", "help", "BOT PREFIX", "info", "hi bot", "hey bot"];

module.exports.handleEvent = async function ({ api, event, Users }) {
  if (!event.body) return;

  const text = event.body.toLowerCase();

  // Check for trigger words
  if (triggerWords.some(t => text === t || text.includes(t))) {
    module.exports.run({ api, event, Users, noPrefix: true });
  }
};

module.exports.run = async function ({ api, event, Users }) {

  // 🔒 Credit Lock Protection  
  if (module.exports.config.credits !== "ARIF-BABU") {  
      return api.sendMessage(
          "⚠ SECURITY ALERT ⚠\n❌ Credits modification detected!",  
          event.threadID,  
          event.messageID  
      );  
  }

  const fs = global.nodemodule["fs-extra"];  
  const request = global.nodemodule["request"];  

  let uid, name;  

  if (Object.keys(event.mentions).length > 0) {  
      uid = Object.keys(event.mentions)[0];  
      name = event.mentions[uid].replace("@", "");  
  } else {  
      uid = event.senderID;  
      name = await Users.getNameUser(uid);  
  }

  const fbProfile = `https://www.facebook.com/profile.php?id=${uid}`;  

  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });  
  const dateObj = new Date(now);  

  const date = dateObj.toLocaleDateString("en-GB");  
  const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });  
  const time = dateObj.toLocaleTimeString("en-US", { hour12: true });  

  const prefix = global.config.PREFIX || "!";  
  const totalUsers = global.data.allUserID.length;  
  const totalThreads = global.data.allThreadID.length;  
  const ownerName = " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

  const msg = `

━━━━━━━━━━━━━━━━━━
🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 ✅🌚
━━━━━━━━━━━━━━━━━━

👋 Hi ${name}!

🗓 Date: ${date}
📅 Day: ${day}
⏰ Time: ${time}

🔧 Prefix: [ ${prefix} ]
📚 Commands: ${global.client.commands.size}

👤 Total Users: ${totalUsers}
💬 Total Threads: ${totalThreads}

👑 Owner: ${ownerName}

📌 Type "[ ${prefix} ] help2" for full command list.
━━━━━━━━━━━━━━━━━━`;

  const filePath = __dirname + `/cache/uid2_${uid}.png`;  

  let callback = () =>  
      api.sendMessage(
          { body: msg, attachment: fs.createReadStream(filePath) },
          event.threadID,
          () => fs.unlinkSync(filePath),
          event.messageID
      );

  return request(
      encodeURI(`https://graph.facebook.com/${uid}/picture?height=2000&width=2000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
  )
      .pipe(fs.createWriteStream(filePath))
      .on("close", callback);
};