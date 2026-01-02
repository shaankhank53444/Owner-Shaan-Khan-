const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

const getApiUrl = async () => {
    try {
        const configRes = await axios.get(nix);
        const baseUrl = configRes.data?.api;
        if (!baseUrl) throw new Error("Missing 'api' base URL.");
        return `${baseUrl}/play`; 
    } catch (error) {
        throw new Error(`Failed to load API config: ${error.message}`);
    }
};

module.exports.config = {
  name: "sing",
  version: "0.0.4",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Download music with details",
  commandCategory: "music",
  usages: "sing <song name>",
  cooldowns: 5
};

async function handleMusic(api, event, query) {
  const { threadID, messageID } = event;
  const waiting = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

  try {
    const apiBase = await getApiUrl();
    
    // YTS se extra details nikalne ke liye
    const search = await yts(query);
    if (!search.videos.length) throw new Error("No results found.");
    const video = search.videos[0];
    const videoUrl = video.url;

    const apiUrl = `${apiBase}?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);

    if (!res.data.status || !res.data.downloadUrl)
      throw new Error("API error.");

    const mp3name = `${Date.now()}.mp3`; 
    const filePath = path.join(__dirname, mp3name);

    const audio = await axios.get(res.data.downloadUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, audio.data);

    // --- Message Format ---
    const messageBody = `🖤 𝑻𝑰𝑻𝑳𝑬: ${video.title}\n` +
                        `📺 𝑪𝑯𝑨𝑵𝑵𝑬𝑳: ${video.author.name}\n` +
                        `👀 𝑽𝑰𝑬𝑾𝑺: ${video.views.toLocaleString()}\n` +
                        `⏳ 𝑫𝑼𝑹𝑨𝑻𝑰𝑶𝑵: ${video.timestamp}\n` +
                        `📅 𝑼𝑷𝑳𝑶𝑨𝑫𝑬𝑫: ${video.ago}\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
                        `🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC`;

    await api.sendMessage(
      {
        body: messageBody,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(waiting.messageID);
      },
      messageID
    );

  } catch (err) {
    if (waiting.messageID) api.unsendMessage(waiting.messageID);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
}

// NO PREFIX
module.exports.handleEvent = async function ({ api, event }) {
  const { body } = event;
  if (!body) return;
  const args = body.split(/\s+/);
  const trigger = args.shift().toLowerCase();
  if (trigger === "sing") {
    if (args.length === 0) return api.sendMessage("❌ Provide a song name.", event.threadID, event.messageID);
    return handleMusic(api, event, args.join(" "));
  }
};

// WITH PREFIX
module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) return api.sendMessage("❌ Provide a song name.", event.threadID, event.messageID);
  return handleMusic(api, event, args.join(" "));
};
