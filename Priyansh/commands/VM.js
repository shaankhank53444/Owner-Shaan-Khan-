const axios = require("axios");

module.exports.config = {
  name: "VM",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Shaan AI",
  description: "YouTube Audio + Video Downloader",
  commandCategory: "media",
  usages: "music <name> / music <name> video",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    let mode = "audio";

    // video detect
    if (args[args.length - 1]?.toLowerCase() === "video") {
      mode = "video";
      args.pop();
    }

    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("⚠️ Song name likho", threadID, messageID);
    }

    // 🔎 SEARCH MESSAGE
    const searching = await api.sendMessage(
      "✅ Apki Request Jari Hai Please Wait...",
      threadID
    );

    // ⏳ reaction loading
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const baseURL = "https://yt-amir.onrender.com";
    const apiUrl = `${baseURL}/search?query=${encodeURIComponent(query)}`;

    const res = await axios.get(apiUrl);
    const data = res.data;

    const audio =
      data.audio ||
      data.audioUrl ||
      data.result?.audio ||
      data.download?.audio;

    const video =
      data.video ||
      data.videoUrl ||
      data.result?.video ||
      data.download?.video;

    const title = data.title || data.name || query;

    // 📌 OWNER LINE (fixed as you requested)
    const ownerText =
      "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉";

    // 🎧 AUDIO
    if (mode === "audio") {
      if (!audio) throw new Error("Audio not found");

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(
        {
          body: `🎵 ${title}\n\n${ownerText} AUDIO SONG 🎧`,
          attachment: await global.utils.getStreamFromURL(audio)
        },
        threadID,
        () => api.unsendMessage(searching.messageID),
        messageID
      );
    }

    // 🎬 VIDEO
    if (mode === "video") {
      if (!video) throw new Error("Video not found");

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(
        {
          body: `🎵 ${title}\n\n${ownerText} VIDEO 🎬`,
          attachment: await global.utils.getStreamFromURL(video)
        },
        threadID,
        () => api.unsendMessage(searching.messageID),
        messageID
      );
    }

  } catch (err) {
    console.log(err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);

    return api.sendMessage(
      "❌ Error: API ya song not found",
      event.threadID,
      event.messageID
    );
  }
};