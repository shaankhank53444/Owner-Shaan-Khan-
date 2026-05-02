const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "slap",
  version: "1.0.0",
  hasPermssion: 0, // 0 = Public, 1 = Admin, 2 = Creator
  credits: "Shaan Khan",
  description: "Slap another user with a gender-based GIF",
  commandCategory: "FUN",
  usages: "[@mention]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    // Check if user mentioned someone
    const mentionKeys = Object.keys(mentions);

    if (mentionKeys.length === 0) {
      return api.sendMessage(
        `❌ Please mention someone to slap!\n\nUsage: ${global.config.PREFIX}slap [@mention]`,
        threadID,
        messageID
      );
    }

    const targetID = mentionKeys[0];

    // Self-slap check
    if (targetID === senderID) {
      return api.sendMessage(
        "🤔 You can't slap yourself! That would be weird...",
        threadID,
        messageID
      );
    }

    // Reaction for processing
    api.setMessageReaction("⏳", messageID, (err) => {}, true);

    // Get user info (Mirai standard: Users.getData or api.getUserInfo)
    const senderData = await Users.getData(senderID);
    const targetData = await Users.getData(targetID);
    
    const senderName = senderData.name;
    const targetName = targetData.name;

    // Determine gender (Mirai gender: 1 = Female, 2 = Male)
    let genderType = 'male'; 
    if (senderData.gender === 1 || senderData.gender === "FEMALE") {
      genderType = 'female';
    }

    // API Key (Custom check: agar config me nahi hai to default use karega)
    const apiKey = global.config?.priyanshuApi || 'apim_PHNPYM8mq_Mpav9ue8sGJ6MNPAEvKNKJ13Uq1YZGcX4';

    // Fetch GIF
    const response = await axios.post(
      'https://priyanshuapi.xyz/api/runner/slap-gif/fetch',
      { gender: genderType },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 20000
      }
    );

    if (!response.data) throw new Error('API did not return data');

    // Setup Temp File
    const cacheDir = path.join(__dirname, 'cache'); // Mirai me usually 'cache' folder hota hai
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const tempFilePath = path.join(cacheDir, `slap_${senderID}.gif`);
    fs.writeFileSync(tempFilePath, Buffer.from(response.data, 'utf-8'));

    // Messages array
    const slapMessages = [
      `💥 ${senderName} slapped ${targetName}!`,
      `👋 ${senderName} gave ${targetName} a good slap!`,
      `🤜 SLAP! ${senderName} hit ${targetName}!`,
      `🎯 Direct hit! ${senderName} slapped ${targetName}!`
    ];
    const randomMsg = slapMessages[Math.floor(Math.random() * slapMessages.length)];

    // Send Message
    return api.sendMessage({
      body: randomMsg,
      attachment: fs.createReadStream(tempFilePath),
      mentions: [
        { tag: senderName, id: senderID },
        { tag: targetName, id: targetID }
      ]
    }, threadID, () => {
        // Cleanup after sending
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        api.setMessageReaction("✅", messageID, (err) => {}, true);
    }, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
