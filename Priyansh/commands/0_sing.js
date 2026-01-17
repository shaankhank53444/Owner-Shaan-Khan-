const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");
const nodeID3 = require("node-id3"); // Naya package title fix ke liye

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

function formatViews(views) {
    if (views >= 1000000000) return (views / 1000000000).toFixed(1) + 'B';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

module.exports.config = {
  name: "sing",
  version: "0.0.9",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Download music with metadata fix for E2EE",
  commandCategory: "music",
  usages: "sing <song name>",
  cooldowns: 5
};

async function handleMusic(api, event, query) {
  const { threadID, messageID } = event;
  const waiting = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  // File name ko random rakhne ke bajaye song title jaisa banane ki koshish
  const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

  try {
    const configRes = await axios.get(nix);
    let baseApi = configRes.data.api;
    if (baseApi.endsWith("/")) baseApi = baseApi.slice(0, -1);

    const search = await yts(query);
    if (!search.videos.length) throw new Error("No results found.");
    const video = search.videos[0];

    const apiUrl = `${baseApi}/play?url=${encodeURIComponent(video.url)}`;
    const res = await axios.get(apiUrl);

    const downloadUrl = res.data.downloadUrl || res.data.link || (res.data.data && res.data.data.downloadUrl);
    if (!downloadUrl) throw new Error("Could not find download link.");

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'arraybuffer' // Metadata edit karne ke liye buffer chahiye
    });

    // --- Metadata (ID3 Tags) Add Karna ---
    const tags = {
      title: video.title,
      artist: "SHAAN KHAN",
      album: "YouTube Music",
      image: video.thumbnail
    };

    const successBuffer = nodeID3.write(tags, response.data);
    fs.writeFileSync(filePath, successBuffer);

    const messageBody = `🖤Title: ${video.title}\n\n` + 
                        `👀Views: ${formatViews(video.views)}\n\n` +
                        `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
                        `🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇 MUSIC`;

    await api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(waiting.messageID);
      }, messageID);

  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (waiting.messageID) api.unsendMessage(waiting.messageID);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
}

// Same handleEvent aur run functions...
module.exports.handleEvent = async function ({ api, event }) {
  const { body } = event;
  if (!body) return;
  const args = body.split(/\s+/);
  if (args[0].toLowerCase() === "sing") {
    if (args.length === 1) return api.sendMessage("❌ Provide a song name.", event.threadID, event.messageID);
    return handleMusic(api, event, args.slice(1).join(" "));
  }
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) return api.sendMessage("❌ Provide a song name.", event.threadID, event.messageID);
  return handleMusic(api, event, args.join(" "));
};
