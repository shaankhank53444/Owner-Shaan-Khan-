const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json"
  );
  return base.data.x2;
};

module.exports.config = {
  name: "gemini",
  version: "1.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Describe image or text using Gemini AI",
  commandCategory: "AI",
  usages: "[prompt] (reply to an image or provide image URL)",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  let imageUrl = null;
  let promptText = args.join(" ");

  if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
    const attachment = event.messageReply.attachments[0];
    if (attachment.type === "photo") {
      imageUrl = attachment.url;
    }
  }

  if (!imageUrl && args[0]?.startsWith("http")) {
    imageUrl = args[0];
    promptText = args.slice(1).join(" ");
  }

  const finalPrompt = promptText.trim() || "What do you see?";

  try {
    const baseUrl = `${await baseApiUrl()}/xnil/geminiv2`;
    const key = "xnil8679926169";
    const apiUrl = `${baseUrl}?prompt=${encodeURIComponent(finalPrompt)}&key=${key}${imageUrl ? `&imgUrl=${encodeURIComponent(imageUrl)}` : ""}`;

    const res = await axios.get(apiUrl);
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return api.sendMessage("⚠️ Gemini couldn't generate a response.", event.threadID, event.messageID);
    }

    return api.sendMessage(`🧠 Gemini:\n${text}`, event.threadID, event.messageID);
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    return api.sendMessage("❌ Failed to connect to Gemini API.", event.threadID, event.messageID);
  }
};
