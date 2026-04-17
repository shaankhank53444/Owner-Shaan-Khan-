module.exports.config = {
  name: "rankup",
  version: "3.2.3",
  hasPermssion: 1,
  credits: "Shaan",
  description: "Rankup system with perfectly aligned User Profile Picture and Text",
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
    const imageUrl = "https://i.ibb.co/mQqvgWG/46bfde194b53.jpg";
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));
    } catch (e) {
      console.log(`[Rankup] Error downloading background`);
    }
  }
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  let { threadID, senderID } = event;
  const fs = require("fs-extra");
  const { createCanvas, loadImage } = require("canvas");
  const axios = require("axios");

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
    const reward = nextLevel * 200; 
    money += reward;

    const pathImg = __dirname + `/cache/rankup/rankup_bg.jpg`;
    const pathOut = __dirname + `/cache/rankup/rankup_${senderID}.png`;

    try {
      const img = await loadImage(pathImg);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      // 1. Draw Background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Fetch User Avatar
      const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      const avatarImg = await loadImage(Buffer.from(avatarResponse.data, 'binary'));

      // 3. Draw Round Avatar (Sahi position par daira)
      ctx.save();
      ctx.beginPath();
      // Yahan coordinates daira (circle) ke bilkul center mein hain
      ctx.arc(178, 192, 108, 0, Math.PI * 2, true); 
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, 70, 84, 216, 216); 
      ctx.restore();

      // 4. Draw Level Text (LEVEL UP! ke side mein)
      ctx.font = "bold 60px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      // 610 coordinate isse "LEVEL UP!" ke right side mein rakhega
      ctx.fillText(`${nextLevel}`, 610, 105); 

      // 5. Draw Coins Text
      ctx.font = "bold 38px Arial";
      ctx.fillStyle = "#00f2ff";
      ctx.textAlign = "right";
      ctx.fillText(`+${reward} Coins`, canvas.width - 60, canvas.height - 55);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(pathOut, buffer);

      let levelMsg = `🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n` +
                     `👤 𝗡𝗮𝗺𝗲: ${name}\n` +
                     `🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: ${nextLevel}\n` +
                     `💰 𝗕𝗼𝗻𝘂𝘀: +${reward} Coins\n` +
                     `━━━━━━━━━━━━━━━\n` +
                     `👑 𝗢𝘄𝗻𝗲𝗿: Shaan Khan`;

      api.sendMessage({ 
        body: levelMsg, 
        mentions: [{ tag: name, id: senderID }],
        attachment: fs.createReadStream(pathOut)
      }, threadID, () => fs.unlinkSync(pathOut));

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
