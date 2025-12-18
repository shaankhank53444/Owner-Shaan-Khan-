module.exports = {
  config: {
    name: "prefix",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "Priyansh/Modded",
    description: "Bot ki jankari aur prefix dikhata hai",
    commandCategory: "system",
    usages: "prefix",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event, Threads }) {
    var { threadID, messageID, body, senderID } = event;
    const { commands } = global.client;

    // Sirf tab trigger hoga jab message sirf "prefix" ho
    if (body.toLowerCase() == "prefix") {
      try {
        // Data fetching
        const threadSetting = (await Threads.getData(threadID)).data || {};
        const prefix = threadSetting.PREFIX || global.config.PREFIX;
        const botName = global.config.BOTNAME || "Mirai Bot";
        const ownerID = global.config.ADMINBOT[0]; // Pehla admin owner mana jayega
        
        // Stats
        const totalCommands = commands.size;
        const totalUsers = global.data.allUserID.length;
        const totalThreads = global.data.allThreadID.length;

        const messageText = `┏━━━━━━━━━━━━━━━━━━━┓\n┃      𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡     ┃\n┗━━━━━━━━━━━━━━━━━━━┛\n\n👋 Namaste!\n\n🤖 Bot Name: ${botName}\n📌 Prefix: $[{prefix}]\n📊 Total Commands: ${totalCommands}\n\n👥 Total Users: ${totalUsers}\n💬 Total Groups: ${totalThreads}\n\n💡 Type "${prefix}help" list dekhne ke liye!\n\n👑 Bot Owner ID: ${ownerID}`;

        return api.sendMessage(messageText, threadID, messageID);
      } catch (e) {
        console.log(e);
      }
    }
  },

  run: async function ({ api, event, Threads }) {
    // Ye tab kaam karega jab koi prefix ke sath 'prefix' likhega (ex: !prefix)
    const threadSetting = (await Threads.getData(event.threadID)).data || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX;
    return api.sendMessage(`Mera prefix hai: [ ${prefix} ]`, event.threadID, event.messageID);
  }
};
