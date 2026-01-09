const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
  name: "audio",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Uzair",
  description: "Song / Video Downloader using FastAPI backend",
  commandCategory: "media",
  usePrefix: false,
  cooldowns: 5
};

const triggerWords = ["bot"];
const keywordMatchers = ["song", "audio", "video", "gaana", "bhejo", "send"];

module.exports.handleEvent = async function ({ api, event }) {
  const msg = event.body?.toLowerCase();
  if (!msg) return;

  const trigger = triggerWords.find(t => msg.startsWith(t));
  if (!trigger) return;

  const content = msg.slice(trigger.length).trim();
  const words = content.split(/\s+/);

  const keyIndex = words.findIndex(w => keywordMatchers.includes(w));
  if (keyIndex === -1) return;

  const query = words.slice(keyIndex + 1).join(" ");
  if (!query) return;

  module.exports.run({ api, event, args: query.split(" "), type: words[keyIndex] });
};

module.exports.run = async function ({ api, event, args, type }) {
  const query = args.join(" ");
  if (!query) {
    return api.sendMessage("❌ | Song ya video ka naam likho", event.threadID);
  }

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  try {
    await api.sendMessage("✅ Apki Request Jari Hai Please wait…", event.threadID);

    const search = await yts(query);
    const video = search.videos[0];
    if (!video) {
      return api.sendMessage("❌ | Kuch nahi mila", event.threadID);
    }

    const isAudio = ["song", "audio", "gaana"].includes(type);
    const ext = isAudio ? "mp3" : "mp4";

    const fileName = `${Date.now()}.${ext}`;
    const filePath = path.join(cacheDir, fileName);

    const apiUrl =
      `https://alldl.onrender.com/download?url=${encodeURIComponent(video.url)}`;

    const response = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      timeout: 180000
    });

    fs.writeFileSync(filePath, response.data);

    await api.sendMessage(
      {
        body: `🎵 ${video.title}\n\n🥀 »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉${isAudio ? "song" : "video"} `,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath)
    );

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ | Download error, thori der baad try karo", event.threadID);
  }
};