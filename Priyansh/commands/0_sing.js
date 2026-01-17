const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "sing",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Music downloader optimized for E2EE (Mariai Bot)",
  commandCategory: "music",
  usages: "sing <song name>",
  cooldowns: 5
};

async function handleMusic(api, event, query) {
  const { threadID, messageID } = event;
  if (!query) return api.sendMessage("❌ Please provide a song name!", threadID, messageID);

  // Searching Message (Bilkul pehli file jaisa)
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
    const finalTitle = video.title || "Unknown Title";

    // 2. Get API URL (Nix API logic)
    const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";
    const configRes = await axios.get(nix);
    let baseApi = configRes.data.api;
    if (baseApi.endsWith("/")) baseApi = baseApi.slice(0, -1);

    const apiUrl = `${baseApi}/play?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.downloadUrl || res.data.link || res.data.data?.downloadUrl;

    if (!downloadUrl) throw new Error("Failed to generate download link.");

    // 3. Prepare File Path (E2EE Compatibility ke liye)
    const tempDir = path.join(__dirname, "cache");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    // File name ko clean karna zaruri hai
    const safeFilename = `${Date.now()}_music.mp3`;
    const filePath = path.join(tempDir, safeFilename);

    // 4. Download as Stream (Sabse fast aur reliable method)
    const writer = fs.createWriteStream(filePath);
    const downloadResponse = await axios({
      method: "GET",
      url: downloadUrl,
      responseType: "stream",
    });

    downloadResponse.data.pipe(writer);

    writer.on("finish", () => {
      // 5. Details Message (Professional Look)
      const formattedViews = new Intl.NumberFormat('en-US', { notation: "compact" }).format(video.views);
      let infoMsg = ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 \n\n🎵 Title: ${finalTitle}\n⏱ Duration: ${video.duration.timestamp}\n👤 Artist: ${video.author.name}\n👀 Views: ${formattedViews}`;

      api.sendMessage(infoMsg, threadID);

      // 6. Send Audio File as Attachment
      api.sendMessage({
          body: `🎧 ${finalTitle}`,
          attachment: fs.createReadStream(filePath)
      }, threadID, (err) => {
          // Cleanup
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
    return api.sendMessage("❌ Connection error or API issue.", threadID, messageID);
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
