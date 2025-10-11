module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.3.3",
    hasPermssion: 0,
    credits: "Nawaz Boss",
    description: "Auto-downloads videos from links like Instagram, YouTube, Pinterest, etc.",
    commandCategory: "Utilities",
    usages: "",
    cooldowns: 5,
  },

  run: async function ({ events, args }) {},

  handleEvent: async function ({ api, event }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const { alldown } = require("arif-babu-media");

    const content = event.body ? event.body.trim() : "";
    if (!content.startsWith("https://")) return;

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // लिंक से वीडियो डेटा लाना
      const data = await alldown(content);
      if (!data || !data.data) {
        return api.sendMessage("⚠ वीडियो डाउनलोड करने में समस्या आई!", event.threadID, event.messageID);
      }

      let { high, title } = data.data;

      // टाइटल सही से सेट करना
      if (!title || title.trim() === "") {
        if (content.includes("youtube.com") || content.includes("youtu.be")) {
          title = "YouTube Video 🎥";
        } else if (content.includes("instagram.com")) {
          title = "Instagram Video 📷";
        } else if (content.includes("pinterest.com")) {
          title = "Pinterest Video 📌";
        } else {
          title = "नाम उपलब्ध नहीं ❌";
        }
      }

      const filePath = `${__dirname}/cache/auto.mp4`;

      // वीडियो डाउनलोड
      const videoBuffer = (await axios.get(high, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(videoBuffer, "utf-8"));

      api.setMessageReaction("📥", event.messageID, () => {}, true);

      return api.sendMessage(
        {
          body: `🎬 **वीडियो डाउनलोड हो गया!**\n\n📌 **नाम:** ${title}\n👑 **𝗢𝗪𝗡𝗘𝗥 𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡**\n\n✅ **इस्तेमाल के लिए तैयार!**`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        event.messageID
      );
    } catch (error) {
      console.error("⛔ डाउनलोड एरर:", error);
      return api.sendMessage("❌ डाउनलोड फेल! कुछ गड़बड़ हो गई।", event.threadID, event.messageID);
    }
  },
};