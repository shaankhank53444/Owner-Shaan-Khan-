module.exports.config = {
  name: "rankup",
  version: "1.2.0",
  hasPermssion: 1,
  credits: "Shaan",
  description: "Fast rankup system with 10 GIFs and Owner Shaan Branding",
  commandCategory: "system",
  dependencies: {
    "fs-extra": "",
    "axios": ""
  },
  cooldowns: 1,
};

module.exports.onLoad = async () => {
  const fs = require("fs-extra");
  const axios = require("axios");
  const path = __dirname + `/cache/rankup/`;
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
  
  const gifs = [
    "https://i.imgur.com/o2CmSZc.gif", "https://i.imgur.com/Uppc0gg.gif",
    "https://i.imgur.com/YcpPIbV.gif", "https://i.imgur.com/6S4Anv0.gif",
    "https://i.imgur.com/v8S989S.gif", "https://i.imgur.com/S6S9SIn.gif",
    "https://i.imgur.com/f9OAdyO.gif", "https://i.imgur.com/ZST97p9.gif",
    "https://i.imgur.com/P6S9SIn.gif", "https://i.imgur.com/v8S989S.gif"
  ];

  for (let i = 0; i < gifs.length; i++) {
    const filePath = path + `rankup${i + 1}.gif`;
    if (!fs.existsSync(filePath)) {
      try {
        const response = await axios.get(gifs[i], { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));
      } catch (e) {
        console.log(`[Rankup] Error downloading GIF ${i+1}`);
      }
    }
  }
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  let { threadID, senderID } = event;
  const fs = require("fs-extra");

  if (senderID == api.getCurrentUserID() || event.type !== "message") return;

  threadID = String(threadID);
  senderID = String(senderID);

  const thread = global.data.threadData.get(threadID) || {};
  if (thread["rankup"] === false) return;

  let dataRes = await Currencies.getData(senderID);
  let exp = dataRes.exp || 0;
  exp += 5; // Har message par 5 XP milega taaki level jaldi badhe

  // --- Fast Level Formula ---
  // Level 1: 20 XP (approx 4 messages)
  // Level 2: 40 XP... etc.
  const curLevel = Math.floor(0.2 * Math.sqrt(exp));
  const nextLevel = Math.floor(0.2 * Math.sqrt(exp + 5));

  if (nextLevel > curLevel && nextLevel !== 0) {
    const name = await Users.getNameUser(senderID);
    
    let levelMsg = `\n🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n` +
                   `  👤 𝗡𝗮𝗺𝗲: ${name}\n` +
                   `  🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: [ ${nextLevel} ]\n` +
                   `  🏆 𝗥𝗮𝗻𝗸: Keyboard Master\n` +
                   `━━━━━━━━━━━━━━━\n` +
                   `  👑 𝗢𝘄𝗻𝗲𝗿: ⚡ 𝗦𝗵𝗮𝗮𝗻 ⚡\n` +
                   `━━━━━━━━━━━━━━━\n` +
                   `Keep chatting, you're doing great! 🔥`;

    let random = Math.floor(Math.random() * 10) + 1;
    let pathGif = __dirname + `/cache/rankup/rankup${random}.gif`;
    
    let msg = { body: levelMsg, mentions: [{ tag: name, id: senderID }] };
    if (fs.existsSync(pathGif)) msg.attachment = fs.createReadStream(pathGif);

    api.sendMessage(msg, threadID);
  }

  await Currencies.setData(senderID, { exp });
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data;

  if (typeof data["rankup"] == "undefined" || data["rankup"] == false) {
    data["rankup"] = true;
  } else {
    data["rankup"] = false;
  }

  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);
  
  return api.sendMessage(`✅ Rankup system is now ${data["rankup"] ? "Enabled (ON)" : "Disabled (OFF)"}.`, threadID, messageID);
};
