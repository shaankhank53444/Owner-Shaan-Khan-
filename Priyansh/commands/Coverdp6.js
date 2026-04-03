const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "coverdp6",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Create a display picture with profile pic",
  commandCategory: "Love",
  usages: "[@mention or reply to image]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");

// Template links
const templateUrls = [
  "https://i.ibb.co/mVxrF0bW/5eeafb5cdae6.jpg",
  "https://i.ibb.co/LX3qWqB3/da0dde329b3c.jpg",
  "https://i.imgur.com/Gc3Hs2Q.png",
  "https://i.imgur.com/q9ZzTkR.png"
];
const templatePath = path.join(cacheDir, "coverdp6_template.png");

// Fallback template agar download fail ho jaye
async function createFallbackTemplate() {
  const width = 800;
  const height = 800;
  const image = await Jimp.create(width, height, 0xff69b4);
  return image;
}

async function downloadTemplate() {
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    if (fs.existsSync(templatePath)) {
      return true;
    }
    for (const url of templateUrls) {
      try {
        const response = await axios.get(url, { 
          responseType: "arraybuffer",
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (response.status === 200) {
          fs.writeFileSync(templatePath, Buffer.from(response.data));
          return true;
        }
      } catch (err) {
        continue;
      }
    }
    const fallbackImage = await createFallbackTemplate();
    await fallbackImage.writeAsync(templatePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function getAvatar(uid) {
  try {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    return Buffer.from(response.data);
  } catch (error) {
    const fallbackImage = await Jimp.create(512, 512, 0x808080);
    return await fallbackImage.getBufferAsync(Jimp.MIME_PNG);
  }
}

async function getImageFromReply(event) {
  try {
    if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments[0]) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.type === "photo") {
        const imgUrl = attachment.url;
        const response = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 10000 });
        return Buffer.from(response.data);
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}

async function resizeImage(buffer, width, height) {
  try {
    const image = await Jimp.read(buffer);
    image.resize(width, height);
    return image;
  } catch (error) {
    const fallback = await Jimp.create(width, height, 0xff69b4);
    return fallback;
  }
}

async function getUserInfo(api, uid) {
  return new Promise((resolve) => {
    api.getUserInfo(uid, (err, info) => {
      if (err) return resolve({});
      resolve(info[uid] || {});
    });
  });
}

function isValidName(name) {
  if (!name || name.trim() === '') return false;
  const lower = name.toLowerCase();
  if (lower.includes('facebook user') || lower === 'unknown') return false;
  return true;
}

async function getProperName(api, uid, Users, mentionName = null) {
  try {
    if (mentionName && isValidName(mentionName)) {
      return mentionName.replace(/@/g, '').trim();
    }
    if (Users && Users.getNameUser) {
      const name = await Users.getNameUser(uid);
      if (isValidName(name)) return name;
    }
    const info = await getUserInfo(api, uid);
    return info.name || 'User';
  } catch (error) {
    return 'User';
  }
}

module.exports.run = async ({ api, event, Users }) => {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions);

  try {
    const templateDownloaded = await downloadTemplate();
    if (!templateDownloaded) {
      return api.sendMessage("❌ Template download failed!", threadID, messageID);
    }

    let imageBuffer;
    let targetID = senderID;
    let targetName;

    const repliedImage = await getImageFromReply(event);
    
    if (repliedImage) {
      imageBuffer = repliedImage;
      targetName = "User";
    } else if (mention[0]) {
      targetID = mention[0];
      imageBuffer = await getAvatar(targetID);
    } else {
      imageBuffer = await getAvatar(senderID);
    }

    let mentionName = mention[0] ? event.mentions[mention[0]] : null;
    targetName = await getProperName(api, targetID, Users, mentionName);

    // 4:6 Ratio Resize
    const imgWidth = 170;
    const imgHeight = 360;  
    const userImage = await resizeImage(imageBuffer, imgWidth, imgHeight);

    let template;
    try {
      template = await Jimp.read(templatePath);
    } catch (error) {
      template = await createFallbackTemplate();
    }
    
    // Position Settings
    const posX = 440;
    const posY = 65;
    
    template.composite(userImage, posX, posY);

    const outputPath = path.join(cacheDir, `coverdp6_${targetID}.png`);
    await template.writeAsync(outputPath);

    api.sendMessage(
      {
        body: `✨ 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧 ✨\n\n👤 ${targetName}\n\n💕 𝐘𝐨𝐮𝐫 𝐃𝐏 𝐢𝐬 𝐫𝐞𝐚𝐝𝐲!`,
        attachment: fs.createReadStream(outputPath),
        mentions: [{ tag: targetName, id: targetID }]
      },
      threadID,
      () => fs.unlinkSync(outputPath),
      messageID
    );

  } catch (error) {
    api.sendMessage("❌ Error: " + error.message, threadID, messageID);
  }
};
