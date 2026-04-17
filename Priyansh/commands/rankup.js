module.exports.config = {
  name: "rankup",
  version: "1.5.0",
  hasPermssion: 1,
  credits: "Shaan",
  description: "Rankup system with dynamic image generation",
  commandCategory: "system",
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": "",
    "jimp": ""
  },
  cooldowns: 1,
};

module.exports.onLoad = async () => {
  const fs = require("fs-extra");
  const axios = require("axios");
  const path = __dirname + `/cache/rankup/`;
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });

  const imagePath = path + `rankup_bg.jpg`;
  if (!fs.existsSync(imagePath)) {
    const imageUrl = "https://i.ibb.co/mQqvgWG/46bfde194b53.jpg";
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));
    } catch (e) {
      console.log(`[Rankup] Error downloading background image`);
    }
  }
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  let { threadID, senderID } = event;
  const fs = require("fs-extra");
  const { createCanvas, loadImage } = require("canvas");

  if (senderID == api.getCurrentUserID() || event.type !== "message") return;

  threadID = String(threadID);
  senderID = String(senderID);

  const thread = global.data.threadData.get(threadID) || {};
  if (thread["rankup"] === false) return;

  let dataRes = await Currencies.getData(senderID);
  let exp = dataRes.exp || 0;
  exp += 5; 

  const curLevel = Math.floor(0.2 * Math.sqrt(exp));
  const nextLevel = Math.floor(0.2 * Math.sqrt(exp + 5));

  if (nextLevel > curLevel && nextLevel !== 0) {
    const name = await Users.getNameUser(senderID);
    const pathImg = __dirname + `/cache/rankup/rankup_bg.jpg`;
    const pathOut = __dirname + `/cache/rankup/rankup_${senderID}.png`;

    try {
      // --- Image Processing ---
      const img = await loadImage(pathImg);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Level Text Setup
      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 10;
      
      // Image ke center me Level number likhna
      ctx.fillText(`LEVEL ${nextLevel}`, canvas.width / 2, canvas.height / 2 + 30);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(pathOut, buffer);

      let levelMsg = `\n🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n` +
                     `  👤 𝗡𝗮𝗺𝗲: ${name}\n` +
                     `  🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: [ ${nextLevel} ]\n` +
                     `  🏆 𝗥𝗮𝗻ｋ: Keyboard Master\n` +
                     `━━━━━━━━━━━━━━━\n` +
                     `  👑 𝗢𝘄𝗻𝗲𝗿: ⚡ 𝗦𝗵𝗮𝗮𝗻 ⚡\n` +
                     `━━━━━━━━━━━━━━━`;

      let msg = { 
        body: levelMsg, 
        mentions: [{ tag: name, id: senderID }],
        attachment: fs.createReadStream(pathOut)
      };

      api.sendMessage(msg, threadID, () => fs.unlinkSync(pathOut));
    } catch (err) {
      console.log(err);
      api.sendMessage(`Congratulations ${name}, you reached level ${nextLevel}!`, threadID);
    }
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
