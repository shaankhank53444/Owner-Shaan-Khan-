const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan AI",
  description: "Generate images using Gemini Nano/Imagen technology",
  commandCategory: "AI",
  usages: "[prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");

  if (!prompt) {
    return api.sendMessage("🎨 Bhai kya banana hai? Prompt likho. Jaise: 'A futuristic city in ocean'", threadID, messageID);
  }

  // ✅ AAPKA API KEY
  const API_KEY = "AIzaSyCJsxy6kCDTPKcAUQsEyjYhEyC7lkSRCe4";
  
  // Imagen/Nano model endpoint (Generate Image)
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;

  try {
    api.sendMessage("🎨 Nano AI aapki image bana raha hai, thoda sabr rakhein...", threadID, messageID);

    const requestBody = {
      instances: [
        { prompt: prompt }
      ],
      parameters: {
        sampleCount: 1
      }
    };

    const response = await axios.post(API_URL, requestBody);

    // Image data base64 mein milti hai
    const imageData = response.data.predictions[0].bytesBase64Encoded;
    const imgPath = path.join(__dirname, 'cache', `nano_${Date.now()}.png`);

    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
    }

    fs.writeFileSync(imgPath, Buffer.from(imageData, 'base64'));

    return api.sendMessage({
      body: `✨ Ye rahi aapki image: "${prompt}"`,
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => fs.unlinkSync(imgPath), messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: Shayad aapke model ki access nahi hai ya API limit ka masla hai.", threadID, messageID);
  }
};
