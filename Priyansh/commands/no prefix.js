module.exports.config = {
  name: "noprefix",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Arif Babu",
  description: "Auto trigger system without prefix",
  commandCategory: "system",
  usages: "no prefix",
  cooldowns: 1
};

// Trigger words (No Prefix)
const triggerWords = ["prefix", "help", "bot", "info", "hi bot", "hey bot"];

module.exports.handleEvent = async ({ api, event, Users }) => {
  const message = event.body?.toLowerCase() || "";

  // FIX: Safe prefix
  const prefix = global.config.PREFIX || "!";

  // Pakistan Timezone
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Karachi"
  });

  const dateObj = new Date(now);

  // Format
  const time = dateObj.toLocaleTimeString("en-US", { hour12: true });
  const date = dateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY
  const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });

  // If message starts with trigger words
  if (triggerWords.some(word => message.startsWith(word))) {

    const ownerName = "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 𝐊 🙂✅";
    const totalUsers = global.data.allUserID.length;
    const totalThreads = global.data.allThreadID.length;

    const userName = await Users.getNameUser(event.senderID);

    const reply = `
━━━━━━━━━━━━━━━━━━
🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 (No Prefix)
━━━━━━━━━━━━━━━━━━

👋 Hi ${userName}!

🗓 Date: ${date}
📅 Day: ${day}
⏰ Time : ${time}

🔧 Prefix: [ ${prefix} ]
📚 Commands: ${global.client.commands.size}

👤 Total Users: ${totalUsers}
💬 Total Threads: ${totalThreads}

👑 Owner: ${ownerName}

📌 Type "help" for full command list.
━━━━━━━━━━━━━━━━━━
`;

    return api.sendMessage(reply, event.threadID, event.messageID);
  }
};

module.exports.run = () => {};