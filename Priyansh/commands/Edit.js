const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "edit",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan ",
  description: "Reply to an image to edit it",
  commandCategory: "AI",
  usages: "reply [prompt]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;

  // 1. Check Reply & Attachment
  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("⚠️ Bhai image pe reply karo edit karne ke liye.", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("✏️ Edit ka prompt bhi likho bhai.", threadID, messageID);
  }

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const imgPath = path.join(cacheDir, `input_${Date.now()}.jpg`);
  const outputPath = path.join(cacheDir, `output_${Date.now()}.jpg`);

  try {
    api.sendMessage("⏳ Nano Banana AI se edit ho raha hai, thoda wait karein...", threadID, messageID);

    // 2. Download Image correctly
    const imgUrl = messageReply.attachments[0].url;
    const getImg = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(imgPath, Buffer.from(getImg.data));

    // 3. Setup API Request
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("image", fs.createReadStream(imgPath));

    // 🔥 APNA REAL API DETAILS YAHAN DAALO 🔥
    const API_URL = "https://your-real-api.com/edit"; 
    const API_KEY = "AIzaSyDqqWL-0NpI9iQ7ACuwZlYYj3nMsiB6qkc";

    const response = await axios.post(API_URL, formData, {
      headers: { 
        ...formData.getHeaders(),
        "Authorization": `Bearer ${API_KEY}`
      },
      responseType: "arraybuffer"
    });

    // 4. Save and Send Result
    fs.writeFileSync(outputPath, response.data);

    await api.sendMessage({
      body: `✅ Edit Ho Gaya!\nPrompt: ${prompt}`,
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
      // Cleanup
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    // Detail error check
    const errMsg = error.response ? `API Error: ${error.response.status}` : error.message;
    return api.sendMessage(`❌ Error: ${errMsg}`, threadID, messageID);
  }
};
