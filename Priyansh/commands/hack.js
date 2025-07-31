const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports.config = {
  name: "hack",
  version: "1.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Fake hacking image using user's DP",
  commandCategory: "fun",
  usages: "[tag]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, senderID, messageID, mentions } = event;
  const mentionIDs = Object.keys(mentions);
  const targets = mentionIDs.length > 0 ? mentionIDs : [senderID];

  for (const uid of targets) {
    const name = mentionIDs.length > 0 ? mentions[uid].replace("@", "") : (await api.getUserInfo(uid))[uid].name;

    try {
      const backgroundUrl = "https://files.catbox.moe/b4y3fr.jpg";
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

      const [bgRes, avatarRes] = await Promise.all([
        axios.get(backgroundUrl, { responseType: "arraybuffer" }),
        axios.get(avatarUrl, { responseType: "arraybuffer" })
      ]);

      const bgImg = await loadImage(bgRes.data);
      const avatarImg = await loadImage(avatarRes.data);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0);
      ctx.drawImage(avatarImg, 85, 570, 130, 110);
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#000000";
      ctx.fillText(name, 235, 635);

      const outputPath = path.join(__dirname, "cache", `hack_${uid}.jpg`);
      const buffer = canvas.toBuffer("image/jpeg");
      await fs.writeFileSync(outputPath, buffer);

      api.sendMessage({
        body: `🖥️ Hacking started for ${name}...`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => fs.unlinkSync(outputPath), messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage(`❌ ${name} के लिए hacking image बनाने में error आया`, threadID, messageID);
    }
  }
};