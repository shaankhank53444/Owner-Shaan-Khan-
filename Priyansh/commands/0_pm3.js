const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: 'song2',
    aliases: ['yt', 'ytmusic'],
    description: 'Download song/video from YouTube',
    credits: 'Shaan Khan',
    usage: 'song2 [song name] [video]',
    category: 'Media',
    prefix: true
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ");
    
    if (!input) return api.sendMessage("❌ Please provide a song name.", threadID, messageID);

    const wantVideo = input.toLowerCase().includes("video");
    const searchTerm = input.replace(/video/gi, "").trim();
    const type = wantVideo ? "video" : "audio";

    // 1. Searching Message
    let loadingMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, threadID);

    try {
      const searchResults = await yts(searchTerm);
      const video = searchResults.videos[0];

      if (!video) {
        return api.sendMessage("❌ No results found.", threadID, messageID);
      }

      const { title, url } = video;

      // 2. Download Logic
      const apiEndpoint = wantVideo ? 'ytmp4' : 'ytmp3';
      const apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(url)}&apikey=Anabot`;

      const { data } = await axios.get(apiUrl);
      if (!data || !data.result) throw new Error("API Link Error");

      const downloadUrl = data.result.url;
      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      
      const filePath = path.join(cachePath, `${Date.now()}.${wantVideo ? "mp4" : "mp3"}`);

      const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(filePath, Buffer.from(response.data));

      // 3. Final Combined Message (For End-to-End Encryption Groups)
      // Isme Body aur Attachment ek sath jayenge taaki preview show ho
      await api.sendMessage({
        body: `🎵 **Title:** ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        // Loading message delete karna
        api.unsendMessage(loadingMsg.messageID);
      });

    } catch (err) {
      console.error(err);
      api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
  }
};
