const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "play",
    version: "2.8.0",
    hasPermssion: 0,
    credits: "Shaan khan", 
    description: "Search and download songs using updated RDX API",
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
          results: results
        });
      }, messageID);
    } catch (error) {
      return api.sendMessage("❌ Search error: " + error.message, threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, senderID } = event;
    if (String(handleReply.author) !== String(senderID)) return;
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.results.length) return;

    const selectedVideo = handleReply.results[choice - 1];
    api.unsendMessage(handleReply.messageID); 

    // Yahan hum song ka title ya URL bhej rahe hain taaki API direct query handle kare
    return downloadAndSend(api, threadID, null, selectedVideo.title, selectedVideo.title);
  }
};

async function downloadAndSend(api, threadID, messageID, searchQuery, manualTitle) {
  const waitMsg = await api.sendMessage(`✅ Apki Request Jari Hai please wait...`, threadID);
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

  const apiKey = "RDX-API-FREE-191852893";
  // Yahan url ke bajaye 'query' parameter use kiya hai taaki yt-dlp cookie error bypass ho jaye
  const initialUrl = `https://rdx-apis-zone.vercel.app/api/download/playmusic?query=${encodeURIComponent(searchQuery)}&apikey=${apiKey}`;

  try {
    // 1. Initial Request to RDX API for Task ID
    const response = await axios.get(initialUrl, { headers: { "accept": "application/json" } });
    const resData = response.data;

    if (!resData.success) {
      if (waitMsg) api.unsendMessage(waitMsg.messageID);
      const errorMsg = resData.error || "Internal Server Error";
      const hintMsg = resData.hint || "Try different input or retry later.";
      return api.sendMessage(`❌ **Error:** ${errorMsg}\n💡 **Hint:** ${hintMsg}`, threadID);
    }

    const taskId = resData.data?.taskId;
    const statusUri = resData.status_url;

    if (!taskId || !statusUri) {
      if (waitMsg) api.unsendMessage(waitMsg.messageID);
      return api.sendMessage("❌ API se valid task ID nahi mila bhai!", threadID);
    }

    const statusUrl = `https://rdx-apis-zone.vercel.app${statusUri}&apikey=${apiKey}`;

    // 2. Polling loop to check task status and get download link
    let attempts = 0;
    let finalResult = null;

    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 4000)); // 4 seconds delay
      try {
        const statusRes = await axios.get(statusUrl, { headers: { "accept": "application/json" } });
        const stData = statusRes.data;

        if (stData && stData.success) {
          finalResult = stData.data || stData;
          if (finalResult.downloadUrl || finalResult.url || finalResult.audio) {
            break;
          }
        } else if (stData && stData.success === false) {
          finalResult = { error: stData.error, hint: stData.hint };
          break;
        }
      } catch (err) {}
      attempts++;
    }

    if (waitMsg) api.unsendMessage(waitMsg.messageID);

    if (finalResult && finalResult.error) {
      return api.sendMessage(`❌ **Upstream Error:** ${finalResult.error}\n💡 ${finalResult.hint || ""}`, threadID);
    }

    const downloadUrl = finalResult?.downloadUrl || finalResult?.url || finalResult?.audio;
    const title = manualTitle || finalResult?.title || "Audio File";

    if (!downloadUrl) {
      return api.sendMessage(`⚠️ Task ID generate ho gaya tha, lekin download link fetch nahi ho saki. Dobara try karein!`, threadID);
    }

    const caption = `🖤 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑩𝑨𝑷𝑲𝑰👉PLAY-LIST`;

    await api.sendMessage(caption, threadID);

    // 3. Download Stream & Send File
    const audioRes = await axios({ method: 'get', url: downloadUrl, responseType: 'stream', timeout: 120000 });
    const writer = fs.createWriteStream(filePath);
    audioRes.data.pipe(writer);

    writer.on('finish', async () => {
      await api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

    writer.on('error', (err) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.sendMessage("❌ File writing error!", threadID);
    });

  } catch (err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return api.sendMessage(`❌ Download Failed: ${err.message}`, threadID);
  }
}
