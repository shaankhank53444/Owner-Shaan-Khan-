const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    version: "0.0.9",
    author: "Shaan Khan",
    countDown: 5,
    role: 0,
    shortDescription: "Edit image",
    longDescription: "Reply to any image with prompt to edit",
    category: "image",
    guide: "{pn} [text]"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    const react = (emoji) => {
      try {
        api.setMessageReaction(emoji, messageID, () => {}, true);
      } catch (e) {
        // Fallback agar reaction supported na ho
      }
    };

    try {
      const prompt = args.join(" ").trim();

      if (!prompt) {
        react("⚠️");
        return api.sendMessage("⚠️ | Please provide text.", threadID, messageID);
      }

      // Mirai-specific image check from replied message
      const imageUrl = messageReply?.attachments?.[0]?.url || messageReply?.url;

      if (!imageUrl) {
        react("🖼️");
        return api.sendMessage("🖼️ | Please reply to an image.", threadID, messageID);
      }

      react("⏳");

      const apiUrl = `https://azadx69x.is-a.dev/api/editor?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

      // Stream ki jagah arraybuffer use karna ziada stable rehta hai Mirai/Messenger par
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data, "binary");

      react("✅");

      return api.sendMessage(
        {
          body:
            `✨ ───────────────── ✨\n` +
            `𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 IMAGE 🥀\n` +
            `📝 Prompt: ${prompt}\n` +
            `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
            `✨ ───────────────── ✨`,
          attachment: imageBuffer
        },
        threadID,
        messageID
      );
    } catch (error) {
      console.error(error);
      react("❌");
      return api.sendMessage("❌ | Failed to process image.", threadID, messageID);
    }
  }
};
