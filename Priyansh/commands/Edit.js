const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.3.5",
  hasPermssion: 0,
  credits: "Gemini",
  description: "Edit images using Pollinations AI (No Logo)",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("⚠️ Image ko reply karein aur batayein kya edit karna hai!", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("❌ Prompt likhna zaroori hai!", threadID, messageID);

  const imageUrl = messageReply.attachments[0].url;
  const processingMsg = await api.sendMessage("🚀 Processing... Logo hataya ja raha hai.", threadID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    // No Watermark Logic:
    // 1. nologo=true (Official parameter)
    // 2. private=true (Kuch models mein logo hide karta hai)
    // 3. enhance=false (Kyunki enhancement kabhi kabhi extra artifacts lata hai)
    const resultUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?image=${encodeURIComponent(imageUrl)}&width=1024&height=1024&nologo=true&private=true&enhance=false&seed=${Math.floor(Math.random() * 1000000)}`;

    const filePath = path.join(cacheDir, `no_logo_${Date.now()}.png`);
    
    const response = await axios({
      url: resultUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 40000
    });

    fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));

    api.unsendMessage(processingMsg.messageID);
    return api.sendMessage({
      body: `✨ Edited Image (No Watermark)\n\nPrompt: ${prompt}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (error) {
    console.error(error);
    if (processingMsg) api.unsendMessage(processingMsg.messageID);
    return api.sendMessage(`❌ Error: Image generate nahi ho saki.`, threadID, messageID);
  }
};
