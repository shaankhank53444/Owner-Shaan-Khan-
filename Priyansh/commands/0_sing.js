const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

// Views formatting function
function formatViews(views) {
    if (views >= 1000000000) return (views / 1000000000).toFixed(1) + 'B';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

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
  version: "0.0.9",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Download music with customized layout (E2EE Optimized)",
  commandCategory: "music",
  usages: "sing <song name>",
  cooldowns: 5
};

async function handleMusic(api, event, query) {
  const { threadID, messageID } = event;
  const waiting = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

  try {
    const apiBase = await getApiUrl();
    const search = await yts(query);
    if (!search.videos.length) throw new Error("No results found.");

    const video = search.videos[0];
    const videoUrl = video.url;

    const apiUrl = `${apiBase}?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);

    if (!res.data.status || !res.data.downloadUrl)
      throw new Error("API error.");

    // Unique name for E2EE delivery stability
    const filePath = path.join(__dirname, `music_${messageID}.mp3`);

    // Use stream instead of arraybuffer for better encryption handling
    const response = await axios({
      method: 'get',
      url: res.data.downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      const messageBody = `🖤Title: ${video.title}\n\n` + 
                          `👀Views: ${formatViews(video.views)}\n\n` +
                          `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
                          `🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC`;

      await api.sendMessage(
        {
          body: messageBody,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        (err) => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          if (waiting && waiting.messageID) api.unsendMessage(waiting.messageID);
        },
        messageID
      );
    });

    writer.on('error', (err) => {
        throw err;
    });

  } catch (err) {
    if (waiting && waiting.messageID) api.unsendMessage(waiting.messageID);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
}

module.exports.handleEvent = async function ({ api, event }) {
  const { body, threadID, messageID } = event;
  if (!body) return;
  const args = body.split(/\s+/);
  const trigger = args.shift().toLowerCase();
  if (trigger === "sing") {
    if (args.length === 0) return api.sendMessage("❌ Provide a song name.", threadID, messageID);
    return handleMusic(api, event, args.join(" "));
  }
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) return api.sendMessage("❌ Provide a song name.", event.threadID, event.messageID);
  return handleMusic(api, event, args.join(" "));
};
