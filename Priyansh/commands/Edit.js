const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit2",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "Reply to an image to edit it using Nano Banana AI",
  commandCategory: "AI",
  usages: "reply [prompt]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, messageID, type, messageReply } = event;

    // Check reply
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ Bhai image pe reply karo edit karne ke liye.", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];

    if (attachment.type !== "photo") {
      return api.sendMessage("⚠️ Sirf photo pe hi kaam karega.", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("✏️ Edit ka prompt bhi likho bhai.\nExample: reply image + make it cyberpunk style", threadID, messageID);
    }

    api.sendMessage("⏳ Image edit ho raha hai Nano Banana AI se, thoda wait karo...", threadID);

    // Download replied image
    const imgPath = path.join(__dirname, "cache", `input_${Date.now()}.jpg`);
    const writer = fs.createWriteStream(imgPath);

    const response = await axios({
      url: attachment.url,
      method: "GET",
      responseType: "stream"
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Send to Nano Banana AI API
    const formData = new (require("form-data"))();
    formData.append("prompt", prompt);
    formData.append("image", fs.createReadStream(imgPath));

    const apiResponse = await axios.post(
      "https://your-nano-banana-api.com/edit", // 🔥 Yaha apna real API URL daalo
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "Authorization": "Bearer YOUR_API_KEY" // 🔥 Yaha apna API key daalo
        },
        responseType: "arraybuffer"
      }
    );

    const outputPath = path.join(__dirname, "cache", `output_${Date.now()}.jpg`);
    fs.writeFileSync(outputPath, apiResponse.data);

    await api.sendMessage(
      {
        body: `✅ Nano Banana AI se edit ho gaya!\n\n📝 Prompt: ${prompt}`,
        attachment: fs.createReadStream(outputPath)
      },
      threadID,
      messageID
    );

    // Clean cache
    fs.unlinkSync(imgPath);
    fs.unlinkSync(outputPath);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Edit karte time error aa gaya bhai.", event.threadID, event.messageID);
  }
};