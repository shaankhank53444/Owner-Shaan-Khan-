const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "video",
  version: "3.1.1",
  hasPermission: 0,
  credits: "SHAAN KHAN",
  description: "Smart video player using YouTube",
  usePrefix: false,
  commandCategory: "Media",
  cooldowns: 10
};

const triggerWords = ["pika", "bot", "shaan", "shaan khan"];
const keywordMatchers = ["video", "bhej", "music", "chalao", "lagao", "play", "dikhayo"];
const apiKey = "apim_C1dSo30JMCz-kycDGSTZeNr1Hhiuwg6jJmknrJkh06s";

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
  if (!args[0]) return api.sendMessage(`❌ | Baraye karam kisi video ka naam darj karein!`, event.threadID);

  try {
    const query = args.join(" ");
    const searching = await api.sendMessage(`✅ Apki Request Jari Hai Please Wait...`, event.threadID);

    // 1. YouTube search (via scraping YT search results)
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl);
    const videoIdMatch = data.match(/"videoId":"(.*?)"/);
    if (!videoIdMatch || !videoIdMatch[1]) {
      return api.sendMessage(`❌ | "${query}" ke liye koi video nahi mila.`, event.threadID);
    }

    const videoId = videoIdMatch[1];
    const youtubeUrl = `https://youtu.be/${videoId}`;

    // 2. Call new API for MP4 download with API key
    const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download?url=${encodeURIComponent(youtubeUrl)}&apikey=${apiKey}`;
    const res = await axios.get(apiUrl);

    const downloadUrl = res.data?.download || res.data?.result?.download_url || res.data?.url;
    const title = res.data?.title || res.data?.result?.title || query;

    if (!downloadUrl)
      return api.sendMessage(`❌ | Video ka download link hasil nahi ho saka.`, event.threadID);

    await api.editMessage(`🎬| "${title}" download kiya ja raha hai...`, searching.messageID);

    const filePath = path.resolve(__dirname, "cache", `${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`);
    const response = await axios.get(downloadUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: `🖤 Title"${title}"»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);
      fs.unlinkSync(filePath);
      api.unsendMessage(searching.messageID);
    });

    writer.on("error", async err => {
      console.error(err);
      await api.sendMessage(`❌ | File save karne mein kharabi ho gayi: ${err.message}`, event.threadID);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ | Kuch garbar ho gayi: ${error.message}`, event.threadID);
  }
};
