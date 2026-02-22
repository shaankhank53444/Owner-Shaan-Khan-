const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Edit images using NanoBanana AI (Gemini)",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  // 1. Validation
  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage(
      "⚠️ Please reply to an image with your edit prompt!\nExample: edit make this look like cyberpunk style",
      threadID,
      messageID
    );
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("❌ Please provide an instruction on what to edit!", threadID, messageID);
  }

  const imageUrl = messageReply.attachments[0].url;
  const processingMsg = await api.sendMessage("🎨 Gemini (NanoBanana) is processing your edit... Please wait.", threadID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    /* NOTE: NanoBanana (Gemini 3 Flash) integration typically requires 
       an authorized endpoint. Here is the updated logic for a stable provider.
    */
    const response = await axios.get(`https://sensui-useless-apis.vercel.app/api/tools/nanobanana`, {
      params: {
        prompt: prompt,
        url: imageUrl,
        model: "nanobanana" // Specifically calling the Nano Banana engine
      }
    });

    const resultUrl = response.data.imageUrl || response.data.result; 

    if (!resultUrl) {
      throw new Error("Could not generate edited image. The model might be busy.");
    }

    const filePath = path.join(cacheDir, `nano_${Date.now()}.png`);
    const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(imgRes.data, 'utf-8'));

    return api.sendMessage({
      body: `✅ Edited by NanoBanana AI\n\nPrompt: ${prompt}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    if (processingMsg) api.unsendMessage(processingMsg.messageID);
    return api.sendMessage(`❌ Gemini API Error: ${error.message}`, threadID, messageID);
  }
};
