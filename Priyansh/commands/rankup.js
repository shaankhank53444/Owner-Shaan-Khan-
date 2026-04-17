module.exports.config = {
  name: "rankup",
  version: "1.0.8",
  hasPermssion: 1,
  credits: "Shaan",
  description: "Automatic rankup with 10 random GIFs and Owner branding",
  commandCategory: "system",
  dependencies: {
    "fs-extra": "",
    "request": ""
  },
  cooldowns: 2,
};

module.exports.onLoad = () => {
  const fs = require("fs-extra");
  const request = require("request");
  const dirMaterial = __dirname + `/cache/rankup/`;
  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
  
  // 10 Different Stylish Rankup GIFs
  const gifs = {
    "rankup1.gif": "https://i.imgur.com/o2CmSZc.gif",
    "rankup2.gif": "https://i.imgur.com/Uppc0gg.gif",
    "rankup3.gif": "https://i.imgur.com/YcpPIbV.gif",
    "rankup4.gif": "https://i.imgur.com/6S4Anv0.gif",
    "rankup5.gif": "https://i.imgur.com/v8S989S.gif",
    "rankup6.gif": "https://i.imgur.com/S6S9SIn.gif",
    "rankup7.gif": "https://i.imgur.com/f9OAdyO.gif",
    "rankup8.gif": "https://i.imgur.com/ZST97p9.gif",
    "rankup9.gif": "https://i.imgur.com/7S6S9SI.gif",
    "rankup10.gif": "https://i.imgur.com/v8S989S.gif"
  };

  for (let [name, url] of Object.entries(gifs)) {
    if (!fs.existsSync(dirMaterial + name)) {
      request(url).pipe(fs.createWriteStream(dirMaterial + name));
    }
  }
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  var { threadID, senderID } = event;
  const fs = global.nodemodule["fs-extra"];

  if (senderID == api.getCurrentUserID()) return;

  threadID = String(threadID);
  senderID = String(senderID);

  const thread = global.data.threadData.get(threadID) || {};
  if (typeof thread["rankup"] != "undefined" && thread["rankup"] == false) return;

  let dataRes = await Currencies.getData(senderID);
  let exp = dataRes.exp;
  exp = exp += 1;

  if (isNaN(exp)) return;

  const curLevel = Math.floor((Math.sqrt(1 + (3 * exp / 3) + 1) / 2));
  const level = Math.floor((Math.sqrt(1 + (3 * (exp + 1) / 3) + 1) / 2));

  if (level > curLevel && level != 1) {
    const name = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
    
    // ✨ Stylish Design with Owner Branding
    let levelMsg = `\n🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 𝗡𝗢𝗧𝗜𝗖𝗘 🎊\n━━━━━━━━━━━━━━━\n` +
                   `  👤 𝗡𝗮𝗺𝗲: ${name}\n` +
                   `  🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: [ ${level} ]\n` +
                   `  🏆 𝗥𝗮𝗻𝗸: Keyboard Master\n` +
                   `━━━━━━━━━━━━━━━\n` +
                   `  👑 𝗢𝘄𝗻𝗲𝗿: ⚡ 𝗦𝗵𝗮𝗮𝗻 ⚡\n` +
                   `━━━━━━━━━━━━━━━\n` +
                   `Keep grinding for the next level! 🔥`;

    let random = Math.floor(Math.random() * 10) + 1; // 1 se 10 ke beech random select karega
    let pathGif = __dirname + `/cache/rankup/rankup${random}.gif`;
    
    let msg = {
      body: levelMsg,
      mentions: [{ tag: name, id: senderID }]
    };

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
  
  return api.sendMessage(`✅ Rankup system is now ${data["rankup"] ? "Enabled" : "Disabled"}.`, threadID, messageID);
};
