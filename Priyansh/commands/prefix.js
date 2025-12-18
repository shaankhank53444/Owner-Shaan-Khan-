module.exports = {
  config: {
    name: "prefix",
    version: "1.0.5",
    hasPermssion: 0,
    credits: "Priyansh/Gemini",
    description: "Bot information and prefix display",
    commandCategory: "system",
    usages: "prefix",
    cooldowns: 1
  },

  handleEvent: async function ({ api, event, Threads, Users }) {
    var { threadID, messageID, body, senderID } = event;
    if (!body) return;
    
    // Agar koi sirf "prefix" likhe toh ye trigger hoga
    if (body.toLowerCase() == "prefix" || body.toLowerCase() == "pfx") {
      try {
        // Mirai Database se data nikalna
        const threadSetting = (await Threads.getData(threadID)).data || {};
        const prefix = threadSetting.PREFIX || global.config.PREFIX;
        const botName = global.config.BOTNAME || "Mirai Bot";
        const userInfo = await Users.getData(senderID);
        const userName = userInfo.name || "User";

        // Stats calculation
        const totalCommands = global.client.commands.size;
        const totalUsers = global.data.allUserID.length;
        const totalThreads = global.data.allThreadID.length;
        const adminID = global.config.ADMINBOT[0] || "100000000000000";

        const messageText = `┏━━━━━━━━━━━━━━━━━━━┓\n┃      𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡     ┃\n┗━━━━━━━━━━━━━━━━━━━┛\n\n👋 𝗛𝗲𝗹𝗹𝗼 ${userName}!\n\n🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: ${botName}\n📌 𝗣𝗿𝗲𝗳𝗶𝘅: [ ${prefix} ]\n📊 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${totalCommands}\n\n👥 𝗧𝗼𝘁𝗮𝗹 𝗨𝘀𝗲𝗿𝘀: ${totalUsers}\n💬 𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽𝘀: ${totalThreads}\n\n💡 𝖧𝗂𝗇𝗍: Type "${prefix}help" for all commands!\n\n👑 𝗕𝗼𝘁 𝗢𝘄𝗻𝗲𝗿:`;

        // ShareContact Mirai support ke sath
        return api.shareContact(messageText, adminID, threadID);
      } catch (e) {
        console.log(e);
      }
    }
  },

  run: async function ({ api, event, Threads }) {
    // Ye tab kaam karega jab koi prefix ke saath "!prefix" likhega
    const threadSetting = (await Threads.getData(event.threadID)).data || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX;
    return api.sendMessage(`Mera prefix hai: [ ${prefix} ]`, event.threadID, event.messageID);
  }
};
