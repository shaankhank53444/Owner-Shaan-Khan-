const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports = {
  config: {
    name: "play",
    version: "2.4.0",
    hasPermssion: 0,
    credits: "Shaan",
    description: "Search and download songs (Customized)",
    commandCategory: "Media",
    usages: "[song name / link]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ");

    if (!query) return api.sendMessage("Janaab, please gaane ka naam ya link dein.", threadID, messageID);

    // Initial response as per your request
    api.sendMessage("✅ aapki request Jari hai please wait", threadID, messageID);

    let baseApi;
    try {
      const configRes = await axios.get(nix);
      baseApi = configRes.data.api;
    } catch (e) {
      return api.sendMessage("API connection error.", threadID, messageID);
    }

    if (query.startsWith("https://") || query.startsWith("http://")) {
      return downloadAndSend(api, threadID, messageID, query, baseApi);
    }

    try {
      const search = await yts(query);
      const results = search.videos.slice(0, 6);

      if (results.length === 0) return api.sendMessage("Koyi result nahi mila.", threadID, messageID);

      let msg = "🔎 YouTube Search Results\n\n";
      let attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (let i = 0; i < results.length; i++) {
        const video = results[i];
        const thumbnailPath = path.join(cacheDir, `thumb_${Date.now()}_${i}.jpg`);
        try {
          const thumbResponse = await axios.get(video.thumbnail, { responseType: 'arraybuffer' });
          await fs.writeFile(thumbnailPath, Buffer.from(thumbResponse.data));
          attachments.push(fs.createReadStream(thumbnailPath));
        } catch (e) {}
        msg += `(${i + 1}) ${video.title}\n⏳ Time: ${video.timestamp}\n\n`;
      }
      msg += "Reply karein 1 se 6 tak kisi bhi number ka.";

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
      return api.sendMessage("Error: " + error.message, threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    if (handleReply.author !== senderID) return;

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.results.length) {
      return api.sendMessage("Ghalat number! 1-6 tak reply dein.", threadID, messageID);
    }

    const selectedVideo = handleReply.results[choice - 1];
    api.unsendMessage(handleReply.messageID); 
    
    return downloadAndSend(api, threadID, messageID, selectedVideo.url, handleReply.baseApi, selectedVideo.thumbnail);
  }
};

async function downloadAndSend(api, threadID, messageID, url, baseApi, thumbUrl) {
  // Notification before final download
  const msgWait = await api.sendMessage("📥 Downloading... Bas thori der aur.", threadID);
  
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  
  const audioPath = path.join(cacheDir, `song_${Date.now()}.mp3`);
  const imagePath = path.join(cacheDir, `pic_${Date.now()}.jpg`);

  try {
    const apiUrl = `${baseApi}/play?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.downloadUrl || res.data.link;

    const audioRes = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
    const audioWriter = fs.createWriteStream(audioPath);
    audioRes.data.pipe(audioWriter);

    let hasImage = false;
    if (thumbUrl) {
      try {
        const imgRes = await axios.get(thumbUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(imagePath, Buffer.from(imgRes.data));
        hasImage = true;
      } catch (e) {}
    }

    audioWriter.on('finish', async () => {
      let attachments = [];
      if (hasImage) attachments.push(fs.createReadStream(imagePath));
      attachments.push(fs.createReadStream(audioPath));

      await api.unsendMessage(msgWait.messageID);

      await api.sendMessage({
        body: " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉",
        attachment: attachments
      }, threadID, () => {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);
    });

  } catch (err) {
    return api.sendMessage("Download fail: " + err.message, threadID, messageID);
  }
}
