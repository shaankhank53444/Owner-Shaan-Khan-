const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Shaan AI",
  description: "YouTube Audio + Video Downloader",
  commandCategory: "media",
  usages: "vm <name> / vm <name> video",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    let mode = "audio";

    // Video detection
    if (args[args.length - 1]?.toLowerCase() === "video") {
      mode = "video";
      args.pop();
    }

    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("⚠️ Song ka naam likho, eg: vm [song name]", threadID, messageID);
    }

    // Searching status
    const searching = await api.sendMessage("✅ Apki Request Jari Hai, Please Wait...", threadID);
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const baseURL = "https://yt-amir.onrender.com";
    const apiUrl = `${baseURL}/search?query=${encodeURIComponent(query)}`;

    const res = await axios.get(apiUrl);
    const data = res.data;

    const audio = data.audio || data.audioUrl || data.result?.audio || data.download?.audio;
    const video = data.video || data.videoUrl || data.result?.video || data.download?.video;
    const title = data.title || data.name || query;

    const ownerText = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉";

    // Media Logic
    const targetUrl = mode === "audio" ? audio : video;
    if (!targetUrl) throw new Error("Media not found");

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Using global.utils for streaming (Ensure your bot has this helper)
    const stream = await global.utils.getStreamFromURL(targetUrl);

    return api.sendMessage(
      {
        body: `🎵 ${title}\n\n${ownerText} ${mode.toUpperCase()} 🎧`,
        attachment: stream
      },
      threadID,
      () => {
        if (searching) api.unsendMessage(searching.messageID);
      },
      messageID
    );

  } catch (err) {
    console.error("VM Command Error:", err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return api.sendMessage("❌ Error: API response nahi de rahi ya song nahi mila.", threadID, messageID);
  }
};
