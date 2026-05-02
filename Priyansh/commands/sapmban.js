const num = 10; // Commands spam limit
const timee = 120; // Time window
const emojiLimit = 10; // Max emojis allowed in one message

module.exports.config = {
  name: "spamban",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: `Auto-ban for command/emoji spam (Admins exempted)`,
  commandCategory: "System",
  usages: "x",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(`System active: Admin protection enabled.`, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  let { senderID, messageID, threadID, body } = event;
  if (!body) return;

  // --- ADMIN PROTECTION ---
  // Agar sender ka ID Admin list mein hai, toh code yahin ruk jayega
  const adminIDs = global.config.ADMINBOT || [];
  if (adminIDs.includes(senderID)) return;

  if (!global.client.autoban) global.client.autoban = {};
  if (!global.client.autoban[senderID]) {
    global.client.autoban[senderID] = {
      timeStart: Date.now(),
      number: 0
    };
  }

  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  // --- EMOJI SPAM DETECTION ---
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E6}-\u{1F1FF}]/gu;
  const emojiCount = (body.match(emojiRegex) || []).length;

  let isEmojiSpam = emojiCount > emojiLimit;
  let isCommandSpam = false;

  // --- COMMAND SPAM DETECTION ---
  if (body.indexOf(prefix) == 0) {
    if ((global.client.autoban[senderID].timeStart + (timee * 1000)) <= Date.now()) {
      global.client.autoban[senderID] = { timeStart: Date.now(), number: 1 };
    } else {
      global.client.autoban[senderID].number++;
      if (global.client.autoban[senderID].number >= num) {
        isCommandSpam = true;
      }
    }
  }

  // --- BAN EXECUTION ---
  if (isEmojiSpam || isCommandSpam) {
    const moment = require("moment-timezone");
    const timeDate = moment.tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss");
    
    let dataUser = await Users.getData(senderID) || {};
    let data = dataUser.data || {};
    
    // Check if already banned to avoid double processing
    if (data.banned == true) return;

    const reason = isEmojiSpam ? `Emoji spam (${emojiCount} emojis)` : `Command spam (${num} times/${timee}s)`;
    
    data.banned = true;
    data.reason = reason;
    data.dateAdded = timeDate;
    
    await Users.setData(senderID, { data });
    global.data.userBanned.set(senderID, { reason, dateAdded: timeDate });

    // Reset tracker for this user
    global.client.autoban[senderID] = { timeStart: Date.now(), number: 0 };

    api.sendMessage(`🛑 **Automatic Ban**\n\n👤 Name: ${dataUser.name}\n🆔 ID: ${senderID}\n⚠️ Reason: ${reason}\n\nAdmin ko report bhej di gayi hai.`, threadID);

    // Notify Admins
    for (let ad of adminIDs) {
      api.sendMessage(`⚠️ [SPAM ALERT]\nUser: ${dataUser.name}\nID: ${senderID}\nReason: ${reason}\nTime: ${timeDate}`, ad);
    }
  }
};
