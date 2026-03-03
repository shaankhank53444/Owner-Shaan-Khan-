const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "remini",
  version: "1.1",
  author: "Shaan Khan",
  countDown: 5,
  role: 0,
  shortDescription: "Enhance image like Remini",
  longDescription: "AI image enhancer for Mirai bot",
  category: "ai",
};

module.exports.onStart = async function ({ message, event }) {
  // 1. Reply check fix
  const reply = event.messageReply;
  if (!reply || !reply.attachments || reply.attachments.length === 0) {
    return message.reply("📸 Kisi image ko reply karo enhance karne ke liye.");
  }

  if (reply.attachments[0].type !== "photo") {
    return message.reply("❌ Sirf image reply karo.");
  }

  try {
    message.reaction("⌛");

    const imageUrl = reply.attachments[0].url;
    const api = `https://api.popcat.xyz/remini?url=${encodeURIComponent(imageUrl)}`; // Note: Check API parameter name

    const response = await axios.get(api, { responseType: "arraybuffer" });

    // 2. Cache folder check
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `enhanced_${Date.now()}.jpg`);
    await fs.writeFile(filePath, Buffer.from(response.data, "binary"));

    message.reaction("✅");

    await message.reply({
      body: "✨ Image Enhanced Successfully!",
      attachment: fs.createReadStream(filePath)
    });

    // 3. Cleanup
    fs.unlinkSync(filePath);

  } catch (err) {
    console.error(err);
    message.reaction("❌");
    message.reply("❌ API server down hai ya image enhance nahi ho saki.");
  }
};
