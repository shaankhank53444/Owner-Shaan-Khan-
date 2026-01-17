const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "sing",
  version: "1.5.0",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Music downloader with spaced info and signature below",
  commandCategory: "music",
  usages: "sing <song name>",
  cooldowns: 5
};

async function handleMusic(api, event, query) {
  const { threadID, messageID } = event;
  if (!query) return api.sendMessage("❌ Please provide a song name!", threadID, messageID);

  const waiting = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID);

  try {
    // 1. Search Song
    const search = await yts(query);
    if (!search.videos.length) {
        if (waiting) api.unsendMessage(waiting.messageID);
        return api.sendMessage("❌ Song not found on YouTube.", threadID);
    }
    
    const video = search.videos[0];
    const videoUrl = video.url;

    // 2. Get API URL
    const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";
    const configRes = await axios.get(nix);
    let baseApi = configRes.data.api;
    if (baseApi.endsWith("/")) baseApi = baseApi.slice(0, -1);

    const apiUrl = `${baseApi}/play?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.downloadUrl || res.data.link || res.data.data?.downloadUrl;

    if (!downloadUrl) throw new Error("Failed to generate download link.");

    // 3. Prepare File Path
    const tempDir = path.join(__dirname, "cache");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const safeFilename = `${Date.now()}_music.mp3`;
    const filePath = path.join(tempDir, safeFilename);

    // 4. Download as Stream
    const writer = fs.createWriteStream(filePath);
    const downloadResponse = await axios({
      method: "GET",
      url: downloadUrl,
      responseType: "stream",
    });

    downloadResponse.data.pipe(writer);

    writer.on("finish", () => {
      // 5. Formatting Details with Gaps (Double \n for space)
      const formattedViews = new Intl.NumberFormat('en-US', { notation: "compact" }).format(video.views);
      
      let infoMsg = `🎵 𝑻𝒊𝒕𝒍𝒆: ${video.title}\n\n` +
                    `⏱ 𝑫𝒖𝒓𝒂𝒕𝒊𝒐𝒏: ${video.duration.timestamp}\n\n` +
                    `👤 𝑨𝒓𝒕𝒊𝒔𝒕: ${video.author.name}\n\n` +
                    `👀 𝑽𝒊𝒆𝒘𝒔: ${formattedViews}\n\n` +
                    `📅 𝑼𝒑𝒍𝒐𝒂𝒅𝒆𝒅: ${video.ago}\n\n` +
                    `────────────────────\n\n` +
                    ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n` +
                    `          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉`;

      api.sendMessage(infoMsg, threadID);

      // 6. Send Audio File
      api.sendMessage({
          body: `🎧 ${video.title}`,
          attachment: fs.createReadStream(filePath)
      }, threadID, (err) => {
          if (waiting) api.unsendMessage(waiting.messageID);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

    writer.on("error", (err) => {
        if (waiting) api.unsendMessage(waiting.messageID);
        api.sendMessage("❌ Error while downloading file.", threadID);
    });

  } catch (err) {
    if (waiting) api.unsendMessage(waiting.messageID);
    return api.sendMessage("❌ Connection error or API issue.", threadID);
  }
}

// --- PREFIX & NO-PREFIX SUPPORT ---
module.exports.handleEvent = async function ({ api, event }) {
  const { body, threadID } = event;
  if (!body) return;
  const args = body.split(/\s+/);
  const command = args.shift().toLowerCase();
  if (command === "sing") {
    return handleMusic(api, event, args.join(" "));
  }
};

module.exports.run = async function ({ api, event, args }) {
  return handleMusic(api, event, args.join(" "));
};
