const num = 10; 
const timee = 120; // Time window in seconds
const emojiLimitPerMessage = 5; // Ek message me max emojis
const totalEmojiSequenceLimit = 10; // Kitni baar lagatar emoji bhejne par ban hoga

module.exports.config = {
  name: "spamban",
  version: "2.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan (Updated)",
  description: "Auto-ban for sequential emoji/command spamming",
  commandCategory: "System",
  usages: "x",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(`Spam-Ban System (v2.6.0) is active 🛡️`, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  let { senderID, threadID, body } = event;

  if (!body || senderID == api.getCurrentUserID()) return;

  // 1. ADMIN PROTECTION
  const adminIDs = global.config.ADMINBOT || [];
  if (adminIDs.includes(senderID)) return;

  // Initialize Tracking
  if (!global.client.autoban) global.client.autoban = {};
  if (!global.client.autoban[senderID]) {
    global.client.autoban[senderID] = { 
      timeStart: Date.now(), 
      number: 0, 
      emojiCount: 0 
    };
  }

  const userData = global.client.autoban[senderID];
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu;
  const emojisInMessage = body.match(emojiRegex) || [];

  let isSpamming = false;
  let reason = "";

  // 2. EMOJI SEQUENTIAL TRACKING (Logic Update)
  if (emojisInMessage.length > 0) {
    // Agar message me sirf emojis hain ya emojis ki quantity zyada hai
    userData.emojiCount++;
    
    if (userData.emojiCount >= totalEmojiSequenceLimit) {
      isSpamming = true;
      reason = `Sequential Emoji Spam (${totalEmojiSequenceLimit} times)`;
    }
  } else {
    // Agar user ne koi normal text message bheja, toh emoji counter reset kar do
    userData.emojiCount = 0;
  }

  // 3. COMMAND SPAM TRACKER
  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (body.startsWith(prefix)) {
    if ((userData.timeStart + (timee * 1000)) <= Date.now()) {
      userData.timeStart = Date.now();
      userData.number = 1;
    } else {
      userData.number++;
      if (userData.number >= num) {
        isSpamming = true;
        reason = "Command Spamming";
      }
    }
  }

  // 4. BAN ACTION
  if (isSpamming) {
    const moment = require("moment-timezone");
    const timeDate = moment.tz("Asia/Karachi").format("DD/MM/YYYY HH:mm:ss");

    let dataUser = await Users.getData(senderID) || {};
    let data = dataUser.data || {};

    if (data && data.banned == true) return;

    data.banned = true;
    data.reason = reason;
    data.dateAdded = timeDate;

    await Users.setData(senderID, { data });
    if (global.data && global.data.userBanned) {
        global.data.userBanned.set(senderID, { reason, dateAdded: timeDate });
    }

    api.sendMessage(`🛑 SHAAN SYSTEM BAN 🛑\n━━━━━━━━━━━━━\n👤 User: ${dataUser.name || senderID}\n⚠️ Reason: ${reason}\n⏰ Time: ${timeDate}\n🛡️ System: Shaan Khan\n━━━━━━━━━━━━━`, threadID);

    for (let ad of adminIDs) {
      api.sendMessage(`⚠️ [SPAM ALERT]\nName: ${dataUser.name || "Unknown"}\nID: ${senderID}\nReason: ${reason}\nTime: ${timeDate}`, ad);
    }

    // Reset tracking after ban
    global.client.autoban[senderID] = { timeStart: Date.now(), number: 0, emojiCount: 0 };
  }
};
