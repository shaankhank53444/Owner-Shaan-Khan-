const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "vid",
  version: "4.0.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "YouTube se video download karne ke liye",
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
  possibleVideoWords = possibleVideoWords.filter(word => !keywordMatchers.includes(word));

  const videoName = possibleVideoWords.join(" ").trim();
  if (!videoName) return;

  module.exports.run({ api, event, args: videoName.split(" ") });
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) return api.sendMessage(`❌ | Please video ka naam ya link likhen!`, event.threadID);

  try {
    const query = args.join(" ");
    const searchingMsg = await api.sendMessage(`🔍 | "${query}" YouTube par search kiya ja raha hai, thora wait karein...`, event.threadID);

    // 1. YouTube Search Logic
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const { data: searchData } = await axios.get(searchUrl);
    const videoIdMatch = searchData.match(/"videoId":"(.*?)"/);

    if (!videoIdMatch || !videoIdMatch[1]) {
      return api.sendMessage(`❌ | Maaf kijiyega, "${query}" ke liye koi video nahi mili.`, event.threadID);
    }

    const videoId = videoIdMatch[1];
    const youtubeUrl = `https://youtu.be/${videoId}`;

    // 2. Uzair Rajput API for MP4 download
    const apiUrl = `https://uzairrajputapis.vercel.app/api/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await axios.get(apiUrl);

    const result = res.data;
    // Check if result has the direct link (Adjust key if API response structure differs)
    const downloadUrl = result.videoUrl || (result.result && result.result.download_url);
    const videoTitle = result.title || `video_${Date.now()}`;

    if (!downloadUrl) {
      return api.sendMessage(`❌ | Video link nikalne mein masla ho raha hai.`, event.threadID);
    }

    await api.editMessage(`📥 | "${videoTitle}" download ho rahi hai...`, searchingMsg.messageID);

    // 3. File setup in cache
    const cacheDir = path.resolve(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

    // 4. Download and Send
    const response = await axios.get(downloadUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: `✅: "${videoTitle}"\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);
      
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.unsendMessage(searchingMsg.messageID);
    });

    writer.on("error", async (err) => {
      console.error(err);
      api.sendMessage(`❌ | File save karne mein masla hua hai.`, event.threadID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ | Kuch ghalat ho gaya: ${error.message}`, event.threadID);
  }
};
