const os = require('os');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "prefix",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Priyansh/Gemini",
    description: "Full Advanced Bot Info & Prefix",
    commandCategory: "system",
    usages: "prefix",
    cooldowns: 2
  },

  handleEvent: async function ({ api, event, Threads, Users }) {
    var { threadID, messageID, body, senderID } = event;
    if (!body) return;
    
    // Sirf 'prefix' ya 'bot' likhne par trigger hoga
    if (body.toLowerCase() == "prefix" || body.toLowerCase() == "bot") {
      try {
        const threadSetting = (await Threads.getData(threadID)).data || {};
        const prefix = threadSetting.PREFIX || global.config.PREFIX;
        const botName = global.config.BOTNAME || "Mirai Bot";
        const { name } = await Users.getData(senderID);

        // System Stats
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const timeStart = Date.now();
        const ping = Date.now() - timeStart;

        const msg = {
          body: `╭───────────────╮\n      ✨ 𝗕𝗢𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 ✨\n╰───────────────╯\n\n` +
                `👋 Aslamu0alikum, ${name}!\n\n` +
                `❒ 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: ${botName}\n` +
                `❒ 𝗣𝗿𝗲𝗳𝗶𝘅: [ ${prefix} ]\n` +
                `❒ 𝗦𝘁𝗮𝘁𝘂𝘀: Online 🟢\n\n` +
                `━━━ 𝗦𝗧𝗔𝗧𝗦 ━━━\n` +
                `📊 𝗣𝗶𝗻𝗴: ${ping}ms\n` +
                `⏳ 𝗨𝗽𝘁𝗶𝗺𝗲: ${hours}h ${minutes}m ${seconds}s\n` +
                `📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${global.client.commands.size}\n` +
                `👥 𝗨𝘀𝗲𝗿𝘀: ${global.data.allUserID.length}\n` +
                `🏡 𝗚𝗿𝗼𝘂𝗽𝘀: ${global.data.allThreadID.length}\n\n` +
                `━━━ 𝗢𝗪𝗡𝗘𝗥 ━━━\n` +
                `👤 𝗔𝗱𝗺𝗶𝗻: ${global.config.AMDINBOT[0] || "Priyansh Raj"}\n` +
                `🔗 Facebook: fb.me/priyansh.raj.1\n\n` +
                `💡 𝖧𝗂𝗇𝗍: Type "${prefix}help" for all commands!`,
          attachment: [] // Agar image lagani ho toh yahan link daal sakte hain
        };

        return api.sendMessage(msg, threadID, messageID);
      } catch (e) {
        console.log(e);
      }
    }
  },

  run: async function ({ api, event, Threads }) {
    const threadSetting = (await Threads.getData(event.threadID)).data || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX;
    return api.sendMessage(`My Prefix is: ${prefix}`, event.threadID);
  }
};
