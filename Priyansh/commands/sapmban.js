const num = 10; 
const timee = 120; 
const emojiLimit = 10; 

module.exports.config = {
  name: "spamban",
  version: "2.5.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Auto-ban for command/emoji spam (Admin protection included)",
  commandCategory: "System",
  usages: "x",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(`Spam-Ban System (Credits: Shaan Khan) is active 🛡️`, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  let { senderID, threadID, body } = event;
  
  if (!body || senderID == api.getCurrentUserID()) return;

  // 1. ADMIN PROTECTION
  const adminIDs = global.config.ADMINBOT || [];
  if (adminIDs.includes(senderID)) return;

  // 2. EMOJI DETECTION (Shaan Khan Edit)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu;
  const emojisFound = body.match(emojiRegex) || [];
  const emojiCount = emojisFound.length;

  let isEmojiSpam = emojiCount > emojiLimit;
  let isCommandSpam = false;

  // 3. COMMAND SPAM TRACKER
  if (!global.client.autoban) global.client.autoban = {};
  if (!global.client.autoban[senderID]) {
    global.client.autoban[senderID] = { timeStart: Date.now(), number: 0 };
  }

  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (body.startsWith(prefix)) {
    if ((global.client.autoban[senderID].timeStart + (timee * 1000)) <= Date.now()) {
      global.client.autoban[senderID] = { timeStart: Date.now(), number: 1 };
    } else {
      global.client.autoban[senderID].number++;
      if (global.client.autoban[senderID].number >= num) isCommandSpam = true;
    }
  }

  // 4. BAN ACTION
  if (isEmojiSpam || isCommandSpam) {
    const moment = require("moment-timezone");
    const timeDate = moment.tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss");
    
    let dataUser = await Users.getData(senderID) || {};
    let data = dataUser.data || {};
    
    if (data && data.banned == true) return;

    const reason = isEmojiSpam ? `Emoji Spam (${emojiCount} emojis)` : `Command Spam`;
    
    data.banned = true;
    data.reason = reason;
    data.dateAdded = timeDate;
    
    await Users.setData(senderID, { data });
    if (global.data && global.data.userBanned) {
        global.data.userBanned.set(senderID, { reason, dateAdded: timeDate });
    }

    api.sendMessage(`🛑 **SYSTEM BAN** 🛑\n━━━━━━━━━━━━━\n👤 **User:** ${dataUser.name || senderID}\n⚠️ **Reason:** ${reason}\n⏰ **Time:** ${timeDate}\n🛡️ **System:** Shaan Khan\n━━━━━━━━━━━━━`, threadID);

    for (let ad of adminIDs) {
      api.sendMessage(`⚠️ [SPAM ALERT]\nName: ${dataUser.name || "Unknown"}\nID: ${senderID}\nReason: ${reason}\nTime: ${timeDate}`, ad);
    }

    global.client.autoban[senderID] = { timeStart: Date.now(), number: 0 };
  }
};
