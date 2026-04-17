module.exports.config = {
  name: "rankup",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "Shaan",
  description: "Rankup system with Rewards and Dynamic Image Editing",
  commandCategory: "system",
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": ""
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
    // Aapki di hui background image
    const imageUrl = "https://i.ibb.co/mQqvgWG/46bfde194b53.jpg";
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));
    } catch (e) {
      console.log(`[Rankup] Background image download failed`);
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
  let money = dataRes.money || 0;
  exp += 5; 

  const curLevel = Math.floor(0.2 * Math.sqrt(exp));
  const nextLevel = Math.floor(0.2 * Math.sqrt(exp + 5));

  if (nextLevel > curLevel && nextLevel !== 0) {
    const name = await Users.getNameUser(senderID);
    const reward = 200; // Har level up par 200 coins
    money += reward;

    const pathImg = __dirname + `/cache/rankup/rankup_bg.jpg`;
    const pathOut = __dirname + `/cache/rankup/rankup_${senderID}.png`;

    try {
      const img = await loadImage(pathImg);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      // Background Draw karna
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Level Number ko "You reached Level!" ke aage likhna
      ctx.font = "bold 35px Arial"; // Image ke design ke hisab se size
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      
      // Image ke text structure ke mutabiq coordinate (Adjusted for your pic)
      ctx.fillText(`${nextLevel}`, 620, 195); 

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(pathOut, buffer);

      let levelMsg = `🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n` +
                     `👤 𝗡𝗮𝗺𝗲: ${name}\n` +
                     `🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: ${nextLevel}\n` +
                     `💰 𝗥𝗲𝘄𝗮𝗿𝗱: +${reward} Coins\n` +
                     `━━━━━━━━━━━━━━━\n` +
                     `👑 𝗢𝘄𝗻𝗲𝗿: Shaan Khan`;

      let msg = { 
        body: levelMsg, 
        mentions: [{ tag: name, id: senderID }],
        attachment: fs.createReadStream(pathOut)
      };

      api.sendMessage(msg, threadID, () => {
        if(fs.existsSync(pathOut)) fs.unlinkSync(pathOut);
      });

      // Reward update karna database mein
      await Currencies.setData(senderID, { exp, money });
    } catch (err) {
      console.log(err);
      await Currencies.setData(senderID, { exp, money });
    }
  } else {
    await Currencies.setData(senderID, { exp });
  }
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data;

  data["rankup"] = typeof data["rankup"] == "undefined" || data["rankup"] == false ? true : false;

  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);

  return api.sendMessage(`✅ Rankup system ${data["rankup"] ? "Enabled" : "Disabled"}.`, threadID, messageID);
};
