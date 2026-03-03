const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "lockgroup",
  version: "2.5.0",
  hasPermssion: 1, 
  credits: "Shaan",
  description: "Strictly lock Group Name, Photo, Theme, and Nicknames.",
  commandCategory: "group",
  usages: "[name/photo/theme/nickname/all] [on/off]",
  cooldowns: 2
};

const pathData = path.join(__dirname, "cache", "lockData.json");

module.exports.onLoad = () => {
  if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
  if (!fs.existsSync(pathData)) fs.writeJsonSync(pathData, {});
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const threadInfo = await api.getThreadInfo(threadID);
  
  if (!threadInfo.adminIDs.some(admin => admin.id == senderID)) {
    return api.sendMessage("⚠️ Sirf Admins hi Lock/Unlock kar sakte hain!", threadID, messageID);
  }

  let data = fs.readJsonSync(pathData);
  if (!data[threadID]) data[threadID] = { name: null, photo: null, theme: null, nickname: null };

  const type = args[0]?.toLowerCase();
  const status = args[1]?.toLowerCase();

  if (!type || !status) return api.sendMessage("❌ Usage: lockgroup [name/photo/theme/nickname/all] [on/off]", threadID);

  const saveState = async (key) => {
    const info = await api.getThreadInfo(threadID);
    if (key === "name") data[threadID].name = info.threadName;
    if (key === "theme") data[threadID].threadThemeID = info.threadThemeID;
    if (key === "nickname") data[threadID].nickname = info.nicknames;
    if (key === "photo" && info.imageSrc) {
      const imgPath = path.join(__dirname, "cache", `lock_${threadID}.jpg`);
      const img = await axios.get(info.imageSrc, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, Buffer.from(img.data, "binary"));
      data[threadID].photo = imgPath;
    }
  };

  if (status === "on") {
    if (type === "all") {
      await saveState("name"); await saveState("photo"); await saveState("theme"); await saveState("nickname");
    } else if (data[threadID].hasOwnProperty(type) || type === "theme") {
      await saveState(type);
    }
    fs.writeJsonSync(pathData, data);
    return api.sendMessage(`🔒 [STRICT] ${type.toUpperCase()} Lock ho gaya! Ab bina unlock kiye koi change nahi kar payega.`, threadID);
  } 

  if (status === "off") {
    if (type === "all") data[threadID] = { name: null, photo: null, theme: null, nickname: null };
    else data[threadID][type] = null;
    fs.writeJsonSync(pathData, data);
    return api.sendMessage(`🔓 ${type.toUpperCase()} Unlock kar diya gaya hai.`, threadID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  let data = fs.readJsonSync(pathData);
  if (!data[threadID] || author == api.getCurrentUserID()) return;

  const lock = data[threadID];

  try {
    // Name Lock
    if (logMessageType === "log:thread-name" && lock.name) {
      api.setTitle(lock.name, threadID);
    }
    // Photo Lock
    if (logMessageType === "log:thread-icon" && lock.photo) {
      api.changeGroupImage(fs.createReadStream(lock.photo), threadID);
    }
    // Theme Lock
    if (logMessageType === "log:thread-color" && lock.threadThemeID) {
      api.changeThreadColor(lock.threadThemeID, threadID);
    }
    // Nickname Lock
    if (logMessageType === "log:user-nickname" && lock.nickname) {
      const { participantID } = logMessageData;
      const oldNick = lock.nickname[participantID] || "";
      api.setUserNickname(oldNick, threadID, participantID);
    }
  } catch (e) { console.log(e) }
};
