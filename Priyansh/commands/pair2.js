const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function getApiBase() {
  try {
    const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
    const res = await axios.get(GITHUB_RAW);
    return res.data.saimx69x;
  } catch (e) {
    console.error("GitHub raw fetch error:", e.message);
    return null;
  }
}

async function toFont(text, id = 21) {
  try {
    const apiBase = await getApiBase();
    if (!apiBase) return text;
    const apiUrl = `${apiBase}/api/font?id=${id}&text=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);
    return data.output || text;
  } catch (e) {
    console.error("Font API error:", e.message);
    return text;
  }
}

// Urdu Love Poetry Collection
const urduPoetry = [
  "تیری چاہت میں بکھرنے کی خواہش ہے،\nتیرے ساتھ ہی تو سنورنے کی خواہش ہے۔ ✨🌹",
  "دل تو صرف ایک ہی تھا،\nجو ہم نے تیرے نام کر دیا۔ 💖✨",
  "تم سے جو رابطہ بنا ہے نا،\nوہ کوئی اتفاق نہیں، مقدر ہے ہمارا۔ 💞🕊️",
  "تیرے بغیر جی نہیں لگتا،\nتم ہی تو میری ہر خوشی کا سبب ہو۔ 🌷💘",
  "باتیں تو بہت ہیں کہنے کو،\nپر تم مسکرا دو تو سب مکمل لگتا ہے۔ ✨🌸",
  "میری ہر دعا کا اثر ہو تم،\nکاش ہمیشہ کے لیے میرے ہو تم۔ 🌹💫"
];

module.exports.config = {
  name: "pair2",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Generate a love match between you and another group member",
  commandCategory: "love",
  usages: "[pair2]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  const cachePath = path.join(__dirname, "cache", `pair2_${event.senderID}.png`);

  try {
    let senderName = await Users.getNameUser(event.senderID);

    const threadData = await api.getThreadInfo(event.threadID);
    const users = threadData.userInfo;

    const myData = users.find(user => user.id === event.senderID);
    if (!myData || !myData.gender) {
      return api.sendMessage("⚠️ Could not determine your gender. Please try again later.", event.threadID, event.messageID);
    }

    const myGender = myData.gender.toUpperCase();
    let matchCandidates = [];

    if (myGender === "MALE") {
      matchCandidates = users.filter(user => user.gender === "FEMALE" && user.id !== event.senderID);
    } else if (myGender === "FEMALE") {
      matchCandidates = users.filter(user => user.gender === "MALE" && user.id !== event.senderID);
    } else {
      return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match. Please try again later.", event.threadID, event.messageID);
    }

    if (matchCandidates.length === 0) {
      return api.sendMessage("❌ No suitable match found in the group. Please try again later.", event.threadID, event.messageID);
    }

    const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
    let matchName = selectedMatch.name;

    senderName = await toFont(senderName, 21);
    matchName = await toFont(matchName, 21);

    const avatar1 = `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatar2 = `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const apiBase = await getApiBase();
    if (!apiBase) {
      return api.sendMessage("❌ Failed to fetch API base. Please try again later.", event.threadID, event.messageID);
    }

    const apiUrl = `${apiBase}/api/pair?avatar1=${encodeURIComponent(avatar1)}&avatar2=${encodeURIComponent(avatar2)}`;

    const imageRes = await axios.get(apiUrl, { responseType: "arraybuffer" });
    await fs.outputFile(cachePath, Buffer.from(imageRes.data, "binary"));

    const lovePercent = Math.floor(Math.random() * 31) + 70;
    const randomPoetry = urduPoetry[Math.floor(Math.random() * urduPoetry.length)];

    const message = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞\n\n🎀 ${senderName} ✨️\n🎀 ${matchName} ✨️\n\n🕊️ ${randomPoetry}\n\n💘 𝙲𝚘𝚖𝚙𝚊𝚝𝚒𝚋𝚒𝚕𝚒𝚝𝚢: ${lovePercent}% 💘`;

    return api.sendMessage(
      { body: message, attachment: fs.createReadStream(cachePath) },
      event.threadID,
      () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      },
      event.messageID
    );

  } catch (error) {
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    console.error("Pair2 Command Error:", error);
    return api.sendMessage("❌ An error occurred while trying to find a match. Please try again later.", event.threadID, event.messageID);
  }
};
