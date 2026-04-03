const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "framedp4",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Create a display picture with profile pic",
  commandCategory: "Love",
  usages: "[@mention or reply to image]",
  cooldowns: 5,
};

// Mirai cache folder path setup
const cachePath = path.join(__dirname, "cache", "canvas");

const templateUrls = [
  "https://i.ibb.co/CpFvDfSp/7d31a8da1dbd.jpg", // Naya link yahan fix kar diya gaya hai
  "https://i.ibb.co/BVq7Txb3/955c5d7c4b60.jpg",
  "https://i.ibb.co/LX3qWqB3/da0dde329b3c.jpg",
  "https://i.imgur.com/Gc3Hs2Q.png",
  "https://i.imgur.com/q9ZzTkR.png"
];

async function downloadTemplate(templateFile) {
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
  
  // Naye link ko hamesha check karne ke liye purani file delete ki ja sakti hai
  // ya niche diye gaye loop ko chalne diya jaye.
  
  for (const url of templateUrls) {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(templateFile, Buffer.from(response.data));
      return true;
    } catch (e) {
      console.log(`[Error] Failed to download from ${url}`);
      continue;
    }
  }
  return fs.existsSync(templateFile);
}

module.exports.run = async ({ api, event, args, Users }) => {
  const { threadID, messageID, senderID, messageReply, mentions } = event;
  const templateFile = path.join(cachePath, `template_framedp4.png`);
  
  try {
    api.sendMessage("⏳ Processing your frame, please wait...", threadID, messageID);

    // 1. Download Template
    const success = await downloadTemplate(templateFile);
    if (!success) return api.sendMessage("❌ Cannot download frame template.", threadID, messageID);

    // 2. Identify Target UID & Name
    let uid = senderID;
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (messageReply) {
      uid = messageReply.senderID;
    }

    const name = await Users.getNameUser(uid) || "User";

    // 3. Get Image Source
    let imageSource;
    if (messageReply && messageReply.attachments && messageReply.attachments[0]?.type === "photo") {
      imageSource = messageReply.attachments[0].url;
    } else {
      imageSource = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    }

    // 4. Image Processing
    const [baseImage, userAvatar] = await Promise.all([
      Jimp.read(templateFile),
      Jimp.read(imageSource)
    ]);

    userAvatar.resize(212, 307);
    baseImage.composite(userAvatar, 34, 65);

    // 5. Save and Send
    const outputPath = path.join(cachePath, `result_${uid}.png`);
    await baseImage.writeAsync(outputPath);

    const msg = {
      body: `✨ 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧 ✨\n\n👤 𝐍𝐚𝐦𝐞: ${name}\n💕 𝐘𝐨𝐮𝐫 𝐅𝐫𝐚𝐦𝐞 𝐃𝐏 𝐢𝐬 𝐫𝐞𝐚𝐝𝐲!`,
      attachment: fs.createReadStream(outputPath)
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
