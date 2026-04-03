const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "coverdp4",
  version: "1.0.6",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "User ki Cover Photo ko template par set karke card banata hai",
  commandCategory: "Love",
  usages: "[mention/reply/self]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templatePath = path.join(cacheDir, "shaan_cover_template.png");
const templateURL = "https://i.ibb.co/tMTpr9L2/45955db4735f.jpg";

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (fs.existsSync(templatePath)) return true;
  try {
    const response = await axios.get(templateURL, { responseType: "arraybuffer" });
    fs.writeFileSync(templatePath, Buffer.from(response.data));
    return true;
  } catch (e) {
    return false;
  }
}

module.exports.run = async ({ api, event, Users }) => {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  try {
    const isReady = await downloadTemplate();
    if (!isReady) return api.sendMessage("❌ Template download failure!", threadID, messageID);

    let targetID = senderID;
    if (messageReply) targetID = messageReply.senderID;
    if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];

    api.sendMessage("⏳ Shaan Khan is fetching your Cover Photo...", threadID, messageID);

    // 1. Cover Photo Fetch Karne ka Logic
    // Note: Iske liye access token ki zaroorat hoti hai jo cover photo access kar sake
    const coverUrl = `https://graph.facebook.com/${targetID}?fields=cover&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    let imageBuffer;
    try {
      const res = await axios.get(coverUrl);
      const imgUrl = res.data.cover ? res.data.cover.source : null;
      
      if (!imgUrl) throw new Error("No cover found");
      
      const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(imgRes.data);
    } catch (e) {
      return api.sendMessage("❌ Is user ki Cover Photo nahi mil saki ya private hai.", threadID, messageID);
    }

    // 2. Jimp Processing
    const template = await Jimp.read(templatePath);
    const coverImg = await Jimp.read(imageBuffer);
    
    // Cover photo ko circle ya square mein resize karein (Template ke hisab se)
    coverImg.resize(220, 220);
    coverImg.circle(); // Agar aapko circle chahiye, warna ise hata dein

    // Template par set karna (Coordinates: 306, 128)
    template.composite(coverImg, 306, 128);

    const outputPath = path.join(cacheDir, `cover_card_${targetID}.png`);
    await template.writeAsync(outputPath);

    const userData = await Users.getData(targetID);
    const name = userData.name || "User";

    return api.sendMessage({
      body: `✨ 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧 ✨\n\n👤 𝐍𝐚𝐦𝐞: ${name}\n📸 𝐘𝐨𝐮𝐫 𝐂𝐨𝐯𝐞𝐫 𝐂𝐚𝐫𝐝 𝐢𝐬 𝐫𝐞𝐚𝐝𝐲!`,
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: Cover card generate nahi ho saka.", threadID, messageID);
  }
};
