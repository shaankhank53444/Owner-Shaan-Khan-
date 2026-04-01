const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "edit",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Raza Engineering",
  description: "AI Image Editor - Modify images with a prompt",
  commandCategory: "AI Tools",
  usages: "reply to an image with: edit [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;
  const prompt = args.join(" ").trim();

  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt.\nExample: reply to an image with 'edit change hair color to red'", threadID, messageID);
  }

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Please reply to an image to use this command.", threadID, messageID);
  }

  try {
    api.sendMessage("🎨 Editing your image... please wait.", threadID, messageID);

    const attachmentUrl = messageReply.attachments[0].url;
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const imgbbApiKey = 'e17a15dd6af452cbe53747c0b2b0866d';
    const uploadUrl = 'https://api.imgbb.com/1/upload';
    
    const imageBufferResponse = await axios.get(attachmentUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageBufferResponse.data).toString('base64');

    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', base64Image);

    const uploadResponse = await axios.post(uploadUrl, formData);
    const uploadedImageUrl = uploadResponse.data.data.url;

    const apiUrl = `https://api.kraza.qzz.io/imagecreator/nanobanana?imageUrl=${encodeURIComponent(uploadedImageUrl)}&prompt=${encodeURIComponent(prompt)}`;
    const response = await axios.get(apiUrl, { timeout: 120000 });

    if (!response.data || response.data.status !== true || !response.data.result || !response.data.result.image) {
      throw new Error(response.data.message || "Invalid API response");
    }

    const resultImageUrl = response.data.result.image;
    const editedPath = path.join(cacheDir, `edited_${Date.now()}.png`);
    
    const finalImageRes = await axios.get(resultImageUrl, { responseType: 'arraybuffer' });
    await fs.writeFile(editedPath, Buffer.from(finalImageRes.data));

    return api.sendMessage({
      body: `✅ Image Edited Successfully\n\nPrompt: ${prompt}`,
      attachment: fs.createReadStream(editedPath)
    }, threadID, () => {
      if (fs.existsSync(editedPath)) fs.unlinkSync(editedPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
