const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Image Editor - Modify images using text prompts",
  commandCategory: "IMAGE",
  usages: "[reply to image] <prompt>",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply, attachments } = event;

  try {
    let imageUrl = null;

    // 1. Detect Image from Reply
    if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments.find(item => item.type === "photo" || item.type === "image");
      if (attachment) imageUrl = attachment.url;
    }

    // 2. Detect Image from Current Message
    if (!imageUrl && attachments && attachments.length > 0) {
      const attachment = attachments.find(item => item.type === "photo" || item.type === "image");
      if (attachment) imageUrl = attachment.url;
    }

    if (!imageUrl) {
      return api.sendMessage("❌ Please reply to an image or attach an image with this command.", threadID, messageID);
    }

    // 3. Handle Prompt
    const prompt = args.join(" ").trim();
    if (!prompt) {
      return api.sendMessage("❌ Please provide a prompt explaining what to edit.\nExample: edit2 make the background red", threadID, messageID);
    }

    // 4. Setup Cache Folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const uniqueID = Date.now();
    const inputPath = path.join(cacheDir, `input_${uniqueID}.jpg`);
    const outputPath = path.join(cacheDir, `output_${uniqueID}.jpg`);

    api.sendMessage("⏳ Processing your image, please wait...", threadID, messageID);

    // 5. Download Original Image
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(inputPath, Buffer.from(imgRes.data));

    // 6. Prepare Form Data for API
    const form = new FormData();
    form.append("image", fs.createReadStream(inputPath), { filename: "image.jpg", contentType: "image/jpeg" });
    form.append("prompt", prompt);
    form.append("resolution", "2K");
    form.append("ratio", "match_input_image");

    // 7. Send to AI API
    const apiRes = await axios.post("https://xrahat-image-edit.vercel.app/api/edit", form, {
      headers: { ...form.getHeaders() },
      timeout: 180000
    });

    const data = apiRes.data;
    const generatedUrl = data.imageUrl || data.image_url || data.url || data.result?.imageUrl;

    if (!data.success || !generatedUrl) {
      throw new Error(data.message || "The AI failed to process this image.");
    }

    // 8. Download Edited Image
    const outputRes = await axios.get(generatedUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(outputPath, Buffer.from(outputRes.data));

    // 9. Send Result
    return api.sendMessage({
      body: "✨ Here is your edited image:",
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
      // Cleanup files safely
      setTimeout(() => {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, 10000);
    }, messageID);

  } catch (error) {
    console.error(`Error in edit2:`, error);
    let msg = "❌ An error occurred during image editing.";
    if (error.response?.data?.message) msg += `\nReason: ${error.response.data.message}`;
    else if (error.message) msg += `\nReason: ${error.message}`;
    
    return api.sendMessage(msg, threadID, messageID);
  }
};
