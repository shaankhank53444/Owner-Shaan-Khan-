const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "coverdp4",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Profile picture ko template ke sath circle DP mein convert karein",
  commandCategory: "Love",
  usages: "[mention/reply/self]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");

// Templates
const templateUrls = [
  "https://i.ibb.co/rGJZqChV/d49ec2cc56e0.jpg",
  "https://i.ibb.co/LX3qWqB3/da0dde329b3c.jpg",
  "https://i.imgur.com/Gc3Hs2Q.png",
  "https://i.imgur.com/q9ZzTkR.png"
];

const templatePath = path.join(cacheDir, "coverdp4_template.png");

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  
  if (fs.existsSync(templatePath)) return true;

  for (const url of templateUrls) {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
      fs.writeFileSync(templatePath, Buffer.from(response.data));
      return true;
    } catch (e) {
      console.log(`Failed to download from ${url}`);
      continue;
    }
  }
  return false;
}

module.exports.run = async ({ api, event, Users }) => {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  try {
    // 1. Check template
    const isDownloaded = await downloadTemplate();
    if (!isDownloaded) return api.sendMessage("❌ Template download failure!", threadID, messageID);

    // 2. Identify Target & Image
    let targetID = senderID;
    let imageBuffer;

    if (messageReply && messageReply.attachments[0]?.type === "photo") {
      const imgRes = await axios.get(messageReply.attachments[0].url, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(imgRes.data);
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    if (!imageBuffer) {
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarRes = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(avatarRes.data);
    }

    // 3. Canvas Processing
    const template = await Jimp.read(templatePath);
    const userImg = await Jimp.read(imageBuffer);
    const circleSize = 220; 

    userImg.resize(circleSize, circleSize);
    userImg.circle(); 

    // Position coordinates
    const posX = 306;
    const posY = 128;

    template.composite(userImg, posX, posY);

    // 4. Output
    const outputPath = path.join(cacheDir, `dp_${targetID}.png`);
    await template.writeAsync(outputPath);

    const userData = await Users.getData(targetID);
    const name = userData.name || "User";

    return api.sendMessage({
      body: `✨ 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧 ✨\n\n👤 𝐍𝐚𝐦𝐞: ${name}\n💕 𝐘𝐨𝐮𝐫 𝐂𝐢𝐫𝐜𝐥𝐞 𝐃𝐏 𝐢𝐬 𝐫𝐞𝐚𝐝𝐲!`,
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error generating DP: " + error.message, threadID, messageID);
  }
};
