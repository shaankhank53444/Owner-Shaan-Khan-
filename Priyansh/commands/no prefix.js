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
const triggerWords = ["px", "help", "PX", "info", "hi bot", "hey bot"];

module.exports.handleEvent = async ({ api, event, Users }) => {
  const message = event.body?.toLowerCase() || "";

  // Safe prefix fallback
  const prefix = global.config.PREFIX || "!";

  // Pakistan Timezone
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Karachi"
  });

  const dateObj = new Date(now);

  const time = dateObj.toLocaleTimeString("en-US", { hour12: true });
  const date = dateObj.toLocaleDateString("en-GB"); 
  const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });

  // Trigger response
  if (triggerWords.some(word => message.startsWith(word))) {

    const uid = event.senderID;
    const userName = await Users.getNameUser(uid);

    const fbProfile = `https://www.facebook.com/profile.php?id=${uid}`;
    const avatar = `https://graph.facebook.com/${uid}/picture?width=720&height=720`;

    const ownerName = "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 𝐊 🙂✅";
    const totalUsers = global.data.allUserID.length;
    const totalThreads = global.data.allThreadID.length;

    const reply = `
━━━━━━━━━━━━━━━━━━
🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 ✅🌚
━━━━━━━━━━━━━━━━━━

👋 Hi ${userName}!

🗓 Date: ${date}
📅 Day: ${day}
⏰ Time (Pakistan): ${time}

🔧 Prefix: [ ${prefix} ]
📚 Commands: ${global.client.commands.size}

👤 Total Users: ${totalUsers}
💬 Total Threads: ${totalThreads}

🌐 Your Profile:
${fbProfile}

👑 Owner: ${ownerName}

📌 Type "${prefix}help" for full command list.
━━━━━━━━━━━━━━━━━━
`;

    // Send message + DP attachment
    return api.sendMessage(
      {
        body: reply,
        attachment: await global.utils.getStreamFromURL(avatar)
      },
      event.threadID,
      event.messageID
    );
  }
};

module.exports.run = () => {};