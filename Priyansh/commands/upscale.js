const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "upscale",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan", // Modified for Mirai by Gemini
  description: "Image quality ko 2x ya 4x upscale karein",
  commandCategory: "Media",
  usages: "[2|4] (Image par reply karein)",
  cooldowns: 15
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  // 1. Check if user replied to an image
  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      "❌ Please reply to an image to upscale it!\n\nUsage:\n• /upscale - 2x (free)\n• /upscale 4 - 4x (paid)",
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== 'photo') {
    return api.sendMessage("❌ Sirf photos hi upscale ki ja sakti hain!", threadID, messageID);
  }

  // 2. Parse scale parameter
  let scale = 2;
  if (args[0] === "4") scale = 4;

  const imageUrl = attachment.url;
  const processingText = scale === 4 
    ? "⏳ 4K Upscaling start ho rahi hai... (Paid only)\nIsme 10-30 seconds lag sakte hain."
    : "⏳ HD Upscaling start ho rahi hai (2x)...\nKripya thoda intezar karein.";

  // 3. Send processing message
  api.sendMessage(processingText, threadID, async (err, info) => {
    if (err) return;

    const processingMessageID = info.messageID;
    const tempDir = path.join(__dirname, 'cache'); // Mirai usually uses 'cache' folder
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, `input_${Date.now()}.jpg`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.jpg`);

    try {
      // Download image
      const imageStream = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(inputPath, imageStream.data);

      // API Key & Form Data
      const apiKey = global.config?.priyanshuApi || 'apim_8oGEKB_s8N3xdt7sVic_JnV11tjju_NHOvxIDX_A63w';
      const formData = new FormData();
      formData.append('image', fs.createReadStream(inputPath));
      formData.append('scale', scale.toString());

      // Call API
      const response = await axios.post(
        'https://priyanshuapi.xyz/api/runner/upscale/upscale',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 100000 
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'API Error');
      }

      // Download Result
      const resultResponse = await axios.get(response.data.imageUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(outputPath, resultResponse.data);

      // Send Success
      const msgBody = scale === 4 ? "✅ 4K Ultra HD Quality!" : "✅ HD Quality Enhanced!";
      
      api.sendMessage({
        body: msgBody,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        api.unsendMessage(processingMessageID);
        // Clean up
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, messageID);

    } catch (error) {
      console.error(error);
      api.unsendMessage(processingMessageID);
      
      let errorMsg = "❌ Upscale fail ho gaya.";
      if (error.response?.data?.message?.includes('paid')) {
        errorMsg += "\n💡 4x mode sirf paid users ke liye hai. Aap '/upscale 2' use karein.";
      } else {
        errorMsg += "\nServer busy hai ya image size bahut bada hai.";
      }
      
      api.sendMessage(errorMsg, threadID, messageID);
      
      // Cleanup on error
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    }
  });
};
