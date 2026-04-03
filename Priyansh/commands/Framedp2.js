const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "framedp2",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Shaan Khan 💫", // Yahan change kiya
  description: "Create a display picture with profile pic",
  commandCategory: "Love",
  usages: "[@mention or reply to image]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache");

// Updated Template links
const templateUrls = [
  "https://i.ibb.co/3YNdSjkH/84f02454b6d0.jpg",
  "https://i.ibb.co/LXZMTgwK/3ba0f3daebfb.jpg",
  "https://i.ibb.co/LX3qWqB3/da0dde329b3c.jpg",
  "https://i.imgur.com/Gc3Hs2Q.png",
  "https://i.imgur.com/q9ZzTkR.png"
];

module.exports.run = async ({ api, event, Users, args }) => {
  const { threadID, messageID, senderID, messageReply, mentions } = event;

  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let targetID = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : senderID;
    let imageURL;

    if (event.type === "message_reply" && messageReply.attachments[0]?.type === "photo") {
      imageURL = messageReply.attachments[0].url;
    } else {
      imageURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    }

    api.sendMessage("⏳ Processing your request...", threadID, messageID);

    const [templateImage, userAvatar] = await Promise.all([
      getTemplate(templateUrls),
      Jimp.read(imageURL)
    ]);

    // Processing
    userAvatar.resize(210, 355);
    templateImage.composite(userAvatar, 236, 80);

    const outputPath = path.join(cacheDir, `framedp_${targetID}.png`);
    await templateImage.writeAsync(outputPath);

    const name = await Users.getNameUser(targetID) || "User";

    return api.sendMessage({
      body: `✨ 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧 ✨\n\n👤 ${name}\n\n💕 𝐘𝐨𝐮𝐫 𝐅𝐫𝐚𝐦𝐞 𝐃𝐏 𝐢𝐬 𝐫𝐞𝐚𝐝𝐲!`, // Yahan bhi change kiya
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};

async function getTemplate(urls) {
  for (const url of urls) {
    try {
      return await Jimp.read(url);
    } catch (e) {
      console.log(`Failed to load template from: ${url}`);
      continue;
    }
  }
  return new Jimp(800, 800, 0xff69b4);
}
