const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "vid",
  version: "4.3.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "YouTube video downloader fixing API match issue",
  usePrefix: false,
  commandCategory: "Media",
  cooldowns: 10
};

const triggerWords = ["pika", "bot", "shankar"];
const keywordMatchers = ["video", "dikhao", "play", "chalao", "lagao", "clip"];

module.exports.handleEvent = async function ({ api, event }) {
  let message = event.body?.toLowerCase();
  if (!message) return;

  const foundTrigger = triggerWords.find(trigger => message.startsWith(trigger));
  if (!foundTrigger) return;

  let content = message.slice(foundTrigger.length).trim();
  if (!content) return;

  const words = content.split(/\s+/);
  const keywordIndex = words.findIndex(word => keywordMatchers.includes(word));
  if (keywordIndex === -1 || keywordIndex === words.length - 1) return;

  let possibleVideoWords = words.slice(keywordIndex + 1);
  const videoName = possibleVideoWords.join(" ").trim();
  if (!videoName) return;

  module.exports.run({ api, event, args: videoName.split(" ") });
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) return api.sendMessage(`❌ | Please video ka naam likhen!`, event.threadID);

  try {
    const query = args.join(" ");
    const searchingMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please Wait...`, event.threadID);

    // 1. YouTube Search
    const searchRes = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const videoIdMatch = searchRes.data.match(/"videoId":"(.*?)"/);

    if (!videoIdMatch || !videoIdMatch[1]) {
      return api.sendMessage(`❌ | Maaf kijiyega, YouTube par video nahi mil saki.`, event.threadID);
    }

    const videoId = videoIdMatch[1];
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 2. Calling Uzair Rajput API with fix
    const apiUrl = `https://uzairrajputapis.vercel.app/api/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await axios.get(apiUrl);

    // Yahan API ke response se data nikalne ka sahi tareeka:
    // Uzair ki API aksar 'result' ke andar 'download_url' ya direct 'url' deti hai
    const downloadUrl = res.data.url || res.data.result?.url || res.data.videoUrl || res.data.result?.download_url;
    const videoTitle = res.data.title || res.data.result?.title || `Video_${Date.now()}`;

    if (!downloadUrl) {
      console.log("API Response Debug:", res.data); // Console check ke liye
      return api.sendMessage(`❌ | API se link match nahi ho raha.`, event.threadID);
    }

    await api.editMessage(`📥 | "${videoTitle}" download ho rahi hai...`, searchingMsg.messageID);

    // 3. File Setup
    const cacheDir = path.resolve(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

    // 4. Download and Send
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉VIDEO\n\n🎵 Title: ${videoTitle}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);
      
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.unsendMessage(searchingMsg.messageID);
    });

    writer.on("error", (err) => {
      api.sendMessage(`❌ | Download error: ${err.message}`, event.threadID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ | Status Error: ${error.response?.status || error.message}`, event.threadID);
  }
};
