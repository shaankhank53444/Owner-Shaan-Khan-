const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";

module.exports = {
  config: {
    name: "play",
    version: "2.5.0",
    hasPermssion: 0,
    credits: "Shaan khan", 
    description: "Search and download songs using dynamic API from GitHub",
    commandCategory: "Media",
    usages: "[song name / link]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ");

    if (!query) return api.sendMessage("❌ Please provide a song name or YouTube link!", threadID, messageID);

    let baseApi;
    try {
      const configRes = await axios.get(nix);
      baseApi = configRes.data.api; 
      if (baseApi.endsWith("/")) baseApi = baseApi.slice(0, -1);
    } catch (e) {
      return api.sendMessage("❌ Failed to fetch API configuration from GitHub.", threadID, messageID);
    }

    if (query.startsWith("https://") || query.startsWith("http://")) {
      return downloadAndSend(api, threadID, null, query, baseApi);
    }

    try {
      const search = await yts(query);
      const results = search.videos.slice(0, 6);

      if (results.length === 0) return api.sendMessage("No results found.", threadID, messageID);

      let msg = ` YOUTUBE SE SONGS SEARCH KIYA HAI\n\n`;
      let attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (let i = 0; i < results.length; i++) {
        const video = results[i];
        const thumbnailPath = path.join(cacheDir, `thumb_${Date.now()}_${i}.jpg`);
        try {
          const thumbResponse = await axios.get(video.thumbnail, { responseType: 'arraybuffer' });
          fs.writeFileSync(thumbnailPath, Buffer.from(thumbResponse.data));
          attachments.push(fs.createReadStream(thumbnailPath));
        } catch (e) {}
        msg += `${i + 1}. ${video.title}\n⏱️ Duration: ${video.timestamp}\n\n`;
      }
      msg += `✨ Reply karo number (1-6) tak aur download Karo Song.`;

      return api.sendMessage({ body: msg, attachment: attachments }, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          results: results,
          baseApi: baseApi 
        });
      }, messageID);
    } catch (error) {
      return api.sendMessage("❌ Search error: " + error.message, threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    if (String(handleReply.author) !== String(senderID)) return;
    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.results.length) return;

    const selectedVideo = handleReply.results[choice - 1];
    api.unsendMessage(handleReply.messageID); 
    
    // Yahan null pass kiya hai taaki reply (quote) na kare
    return downloadAndSend(api, threadID, null, selectedVideo.url, handleReply.baseApi, selectedVideo.title);
  }
};

async function downloadAndSend(api, threadID, messageID, url, baseApi, manualTitle) {
  const waitMsg = await api.sendMessage(`✅ Apki Request Jari Hai please wait...`, threadID);
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

  try {
    const apiUrl = `${baseApi}/play?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.downloadUrl || res.data.link || (res.data.data && res.data.data.downloadUrl);
    const title = manualTitle || res.data.title || "Audio File";

    if (!downloadUrl) throw new Error("Could not find download link.");

    // Title upar aur stylish header niche
    const caption = `🖤 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉PLAY-LIST`;
    
    await api.sendMessage(caption, threadID);

    const response = await axios({ method: 'get', url: downloadUrl, responseType: 'stream', timeout: 120000 });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      // Yahan se messageID hata di gayi hai taaki seedha message jaye (no reply)
      await api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(waitMsg.messageID);
      });
    });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return api.sendMessage(`❌ Download Failed: ${err.message}`, threadID);
  }
}
