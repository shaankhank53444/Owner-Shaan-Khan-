const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";

module.exports = {
  config: {
    name: "play",
    version: "2.7.0",
    hasPermssion: 0,
    credits: "Shaan khan",
    description: "Search and download songs using APIs",
    commandCategory: "Media",
    usages: "[song name / link]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ");

    if (!query) return api.sendMessage("❌ Please provide a song name or YouTube link!", threadID, messageID);

    if (query.startsWith("https://") || query.startsWith("http://")) {
      return downloadAndSend(api, threadID, null, query);
    }

    try {
      const searchRes = await axios.get(`${YT_SEARCH}?q=${encodeURIComponent(query)}`);
      
      // LOGIC FIX: Check karein response ka format
      let results = searchRes.data.results || searchRes.data.data || searchRes.data || [];
      
      // Agar results array nahi hai, toh error ko rokein
      if (!Array.isArray(results)) {
        return api.sendMessage("❌ Search API ka format match nahi ho raha. Check API Response.", threadID, messageID);
      }
      
      results = results.slice(0, 6);

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
        msg += `${i + 1}. ${video.title}\n⏱️ Duration: ${video.timestamp || 'N/A'}\n\n`;
      }
      msg += `✨ Reply karo number (1-6) tak aur download Karo Song.`;

      return api.sendMessage({ body: msg, attachment: attachments }, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          results: results
        });
      }, messageID);
    } catch (error) {
      return api.sendMessage("❌ Search error: " + error.message, threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, body, senderID } = event;
    if (String(handleReply.author) !== String(senderID)) return;
    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.results.length) return;

    const selectedVideo = handleReply.results[choice - 1];
    api.unsendMessage(handleReply.messageID);

    return downloadAndSend(api, threadID, null, selectedVideo.url, selectedVideo.title);
  }
};

async function downloadAndSend(api, threadID, messageID, url, manualTitle) {
  const waitMsg = await api.sendMessage(`✅ Apki Request Jari Hai please wait...`, threadID);
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

  try {
    const res = await axios.get(AUDIO_API, { params: { url: url } });
    
    // Yahan bhi check kar liya ke link kahan hai
    const data = res.data.data || res.data;
    const downloadUrl = data.downloadUrl || data.link || data.result || data.audio;
    const title = manualTitle || data.title || "Audio File";

    if (!downloadUrl) throw new Error("Could not find download link.");

    const caption = `🖤 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉PLAY-LIST`;

    await api.sendMessage(caption, threadID);

    const response = await axios({ method: 'get', url: downloadUrl, responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
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
