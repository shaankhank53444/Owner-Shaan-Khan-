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
  const prefix = global.config.PREFIX;

  // If message matches any auto-trigger word
  if (triggerWords.some(word => message.startsWith(word))) {

    const ownerName = "🥀𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 𝐊🕊️";
    const totalUsers = global.data.allUserID.length;
    const totalThreads = global.data.allThreadID.length;

    const reply = `
━━━━━━━━━━━━━━━━━━
🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 (No Prefix)
━━━━━━━━━━━━━━━━━━

👋 Hi ${await Users.getNameUser(event.senderID)}!

🔧 Prefix:👉 $👈{prefix}
📚 Commands: ${global.client.commands.size}

👤 Total Users: ${totalUsers}
💬 Total Threads: ${totalThreads}

👑 Owner: ${ownerName}

Type "${prefix}help" for full command list.
━━━━━━━━━━━━━━━━━━
`;

    api.sendMessage(reply, event.threadID);
  }
};

module.exports.run = () => {};