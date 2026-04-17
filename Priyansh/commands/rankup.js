module.exports.config = {
  name: "rankup",
  version: "1.0.5",
  hasPermssion: 1,
  credits: "Shaan",
  description: "Automatic rankup notification with stylish design",
  commandCategory: "system",
  dependencies: {
    "fs-extra": "",
    "request": ""
  },
  cooldowns: 2,
};

// --- Ye part automatic GIFs download karega jab bot start hoga ---
module.exports.onLoad = () => {
  const fs = require("fs-extra");
  const request = require("request");
  const dirMaterial = __dirname + `/cache/rankup/`;
  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
  
  const gifs = {
    "rankup1.gif": "https://i.imgur.com/o2CmSZc.gif",
    "rankup2.gif": "https://i.imgur.com/Uppc0gg.gif",
    "rankup3.gif": "https://i.imgur.com/YcpPIbV.gif"
  };

  for (let [name, url] of Object.entries(gifs)) {
    if (!fs.existsSync(dirMaterial + name)) {
      request(url).pipe(fs.createWriteStream(dirMaterial + name));
    }
  }
};

// --- Ye function har message par background mein auto-run hoga ---
module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  var { threadID, senderID, body } = event;
  const fs = global.nodemodule["fs-extra"];

  // Sirf messages par trigger hoga
  if (!event.type == "message" || senderID == api.getCurrentUserID()) return;

  threadID = String(threadID);
  senderID = String(senderID);

  const thread = global.data.threadData.get(threadID) || {};
  // Agar group mein rankup "off" hai toh return kar dega
  if (typeof thread["rankup"] != "undefined" && thread["rankup"] == false) return;

  let dataRes = await Currencies.getData(senderID);
  let exp = dataRes.exp;
  exp = exp += 1;

  if (isNaN(exp)) return;

  // Level calculation formula
  const curLevel = Math.floor((Math.sqrt(1 + (3 * exp / 3) + 1) / 2));
  const level = Math.floor((Math.sqrt(1 + (3 * (exp + 1) / 3) + 1) / 2));

  // Agar level up hua hai (Level 1 ko skip karke)
  if (level > curLevel && level != 1) {
    const name = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
    
    // ✨ Stylish Design for Level Up
    let levelMsg = `\n🎊 𝗖𝗢𝗡𝗚𝗥𝗔𝗧𝗨𝗟𝗔𝗧𝗜𝗢𝗡𝗦 🎊\n━━━━━━━━━━━━━━━\n` +
                   `  👤 𝗨𝘀𝗲𝗿: ${name}\n` +
                   `  🆙 𝗡𝗲𝘄 𝗦𝗸𝗶𝗹𝗹 𝗟𝗲𝘃𝗲𝗹: [ ${level} ]\n` +
                   `  🏆 𝗥𝗮𝗻𝗸: Keyboard Warrior\n` +
                   `━━━━━━━━━━━━━━━\n` +
                   `Keep chatting to reach the next level! 🔥`;

    let random = Math.floor(Math.random() * 3) + 1;
    let pathGif = __dirname + `/cache/rankup/rankup${random}.gif`;
    
    let msg = {
      body: levelMsg,
      mentions: [{ tag: name, id: senderID }]
    };

    if (fs.existsSync(pathGif)) msg.attachment = fs.createReadStream(pathGif);

    // Auto-send message
    api.sendMessage(msg, threadID);
  }

  // XP update karna database mein
  await Currencies.setData(senderID, { exp });
};

// --- Command se ON/OFF karne ke liye ---
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
  
  return api.sendMessage(`✅ Rankup system has been turned ${data["rankup"] ? "ON" : "OFF"} for this group.`, threadID, messageID);
};
