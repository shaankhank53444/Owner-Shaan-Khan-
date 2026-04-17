module.exports.config = {
  name: "rankup",
  version: "5.1.0",
  hasPermssion: 1,
  credits: "Shaan Khan",
  description: "Rankup system with 'Owner Shaan' text on right side",
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

  const backgrounds = [
    "https://i.ibb.co/DffbB7x/2-7-BDCACE.png",
    "https://i.ibb.co/606p1ZF/1-C0-CF112.png",
    "https://i.ibb.co/54b5KY6/3-10100-BC.png",
    "https://i.ibb.co/4RHd3mM/4-AB4-CF2-B.png",
    "https://i.ibb.co/7WHKF0H/9-498-C5-E0.png",
    "https://i.ibb.co/nPfY3HN/8-ADA7767.png",
    "https://i.ibb.co/Ldctgw4/5-49-F92-DC.png",
    "https://i.ibb.co/J29hdFW/6-EB49-EF4.png"
  ];

  for (let i = 0; i < backgrounds.length; i++) {
    const imagePath = path + `bg_${i}.png`;
    if (!fs.existsSync(imagePath)) {
      try {
        const response = await axios.get(backgrounds[i], { responseType: 'arraybuffer' });
        fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));
      } catch (e) {
        console.log(`[Rankup] Error downloading background ${i}`);
      }
    }
  }
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  let { threadID, senderID } = event;
  const fs = require("fs-extra");
  const { createCanvas, loadImage } = require("canvas");
  const axios = require("axios");

  if (senderID == api.getCurrentUserID() || event.type !== "message") return;

  const thread = global.data.threadData.get(String(threadID)) || {};
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

    const randomIdx = Math.floor(Math.random() * 8);
    const pathImg = __dirname + `/cache/rankup/bg_${randomIdx}.png`;
    const pathOut = __dirname + `/cache/rankup/rankup_${senderID}.png`;

    try {
      const img = await loadImage(pathImg);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      // 1. Draw Background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Draw "Owner Shaan" on Right Side
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.textAlign = "right";
      // Position: Right side se thoda andar aur bottom se thoda upar
      ctx.fillText("Owner Shaan", canvas.width - 30, canvas.height - 30);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(pathOut, buffer);

      let levelMsg = `🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n👤 𝗡𝗮𝗺𝗲: ${name}\n🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: ${nextLevel}\n💰 𝗕𝗼𝗻𝘂𝘀: +${reward} Coins\n━━━━━━━━━━━━━━━\n👑 𝗢𝘄𝗻𝗲𝗿: 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻
𝑴𝒂𝒌𝒂 𝒍𝒂𝒅𝒍𝒆 𝒆𝒌 𝒐𝒖𝒓 𝒍𝒆𝒗𝒆𝒍 𝒖𝒑 𝒉𝒖𝒂 𝒕𝒆𝒓𝒂 𝒌𝒊𝒕𝒏𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆 𝒌𝒂𝒓 𝒕𝒉𝒂 𝒉𝒂𝒊 𝒕𝒖`;

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
