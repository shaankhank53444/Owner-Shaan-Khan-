const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { downloadFile } = require("./../../utils/index");

module.exports.config = {
  name: "edit",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "AI Image Editor - Modify images with a prompt",
  commandCategory: "AI Tools",
  usages: "reply to an image with: edit [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;
  const prompt = args.join(" ").trim();

  // 1. Basic Validation
  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt.\nExample: reply to an image with 'edit change color to white'", threadID, messageID);
  }

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Please reply to an image to edit it.", threadID, messageID);
  }

  const cacheDir = path.join(__dirname, "cache");
  const tempPath = path.join(cacheDir, `input_${Date.now()}.jpg`);
  const editedPath = path.join(cacheDir, `edited_${Date.now()}.png`);

  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    api.sendMessage("🎨 Editing your image... please wait a moment. ✨", threadID, messageID);

    // 2. Download and Upload to ImgBB
    const attachmentUrl = messageReply.attachments[0].url;
    await downloadFile(attachmentUrl, tempPath);

    const apiKey = 'e17a15dd6af452cbe53747c0b2b0866d';
    const imageBuffer = await fs.readFile(tempPath);
    const base64Image = imageBuffer.toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    formData.append('image', base64Image);

    const uploadResponse = await axios.post('https://api.imgbb.com/1/upload', formData);
    const imageUrl = uploadResponse.data.data.url;

    // Remove input temp file early
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    // 3. Call Nano-Banana AI API
    const apiUrl = `https://api.kraza.qzz.io/imagecreator/nanobanana?imageUrl=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;
    const response = await axios.get(apiUrl, { timeout: 150000 });

    if (!response.data || response.data.status !== true) {
      throw new Error(response.data.message || "AI Server failed to process image.");
    }

    // 4. Download Edited Image
    const resultImageUrl = response.data.result.image;
    const imageRes = await axios.get(resultImageUrl, { responseType: 'arraybuffer' });
    await fs.writeFile(editedPath, Buffer.from(imageRes.data));

    // 5. Send Result
    return api.sendMessage({
      body: `✨ **Image Edited Successfully!**\n\n📝 **Prompt:** ${prompt}\n🎨 **Model:** Nano-Banana AI`,
      attachment: fs.createReadStream(editedPath)
    }, threadID, () => {
      // Cleanup edited file after sending
      if (fs.existsSync(editedPath)) fs.unlinkSync(editedPath);
    }, messageID);

  } catch (error) {
    console.error("Edit Command Error:", error);
    
    // Cleanup on failure
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    if (fs.existsSync(editedPath)) fs.unlinkSync(editedPath);

    let msg = "❌ Failed to edit image.";
    if (error.code === 'ECONNABORTED') msg += "\n\n⏳ Request timed out. The AI is taking too long.";
    else msg += `\n\n📌 Error: ${error.message}`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
