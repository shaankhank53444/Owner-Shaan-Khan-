const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: 'mp3',
    aliases: ['yt', 'ytmusic'],
    description: 'Download song/video from YouTube',
    credits: 'Shaan Khan',
    usage: 'song2 [song name] [video]',
    category: 'Media',
    prefix: true
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    if (!query) return api.sendMessage("❌ Please provide a song name.", threadID, messageID);

    const wantVideo = query.toLowerCase().includes("video");
    const searchTerm = query.replace(/video/gi, "").trim();
    const format = wantVideo ? "video" : "audio";

    let loadingMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...for "${searchTerm}"...`, threadID);

    try {
      const searchResults = await yts(searchTerm);
      const video = searchResults.videos[0];

      if (!video) {
        return api.sendMessage("❌ No results found.", threadID, messageID);
      }

      const { title, url, author, duration, timestamp } = video;

      // 1. Pehle details bhejna (First step)
      const infoMsg = ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 **Title:** ${title}\n👤 **Channel:** ${author.name}\n⏱️ **Duration:** ${timestamp}\n🔗 **Link:** ${url}\n\n📥 Sending ${format}, please wait...`;
      await api.sendMessage(infoMsg, threadID);

      // 2. Download process
      const apiEndpoint = wantVideo ? 'ytmp4' : 'ytmp3';
      const apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(url)}&apikey=freeApikey${wantVideo ? '&quality=360' : ''}`;

      const fetchRes = await axios.get(apiUrl);
      if (!fetchRes.data.success) throw new Error("API could not process the link.");

      const downloadUrl = fetchRes.data.data.result.urls;
      const filePath = path.join(__dirname, "cache", `${Date.now()}.${wantVideo ? "mp4" : "mp3"}`);

      const downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      await fs.outputFile(filePath, Buffer.from(downloadRes.data));

      // 3. File send karna (Automatic)
      await api.sendMessage({
        body: `✅ Downloaded: ${title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        // Cleanup: File delete karna aur loading msg hatana
        fs.unlinkSync(filePath);
        api.unsendMessage(loadingMsg.messageID);
      });

    } catch (err) {
      console.error(err);
      api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
  }
};