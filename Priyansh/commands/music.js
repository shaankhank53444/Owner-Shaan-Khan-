const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
  name: "music",
  version: "3.2.2",
  hasPermission: 0,
  credits: "SHAAN KHAN",
  description: "Smart music player using YouTube",
  usePrefix: false,
  commandCategory: "Music",
  cooldowns: 10
};

const triggerWords = ["pika", "music", "shan"];
const keywordMatchers = ["gana", "sand", "song", "suna", "sunao", "play", "chalao", "lagao"];

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

  let songName = words.slice(keywordIndex + 1).join(" ").trim();
  if (!songName) return;

  module.exports.run({ api, event, args: [songName] });
};

module.exports.run = async function ({ api, event, args }) {
  const query = args.join(" ");
  if (!query) return api.sendMessage(`❌ | Kripya ek gaane ka naam likhein!`, event.threadID);

  let searchingMsg;
  try {
    searchingMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, event.threadID);

    const searchResult = await yts(query);
    const video = searchResult.videos[0];
    if (!video) {
      if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
      return api.sendMessage(`❌ | "${query}" ke liye koi result nahi mila.`, event.threadID);
    }

    const videoUrl = video.url;
    
    // Nayi API Call
    const apiUrl = `https://uzairrajputapis.qzz.io/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);

    // API response ke mutabik download link lena
    const downloadUrl = res.data.result?.downloadUrl || res.data.downloadLink; 

    if (!downloadUrl) {
      throw new Error("Download link nahi mil saka, API format check karein.");
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const writer = fs.createWriteStream(filePath);

    const stream = await axios.get(downloadUrl, { responseType: "stream" });
    stream.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage(`🖤 Title: ${video.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉MUSIC`, event.threadID);
      await api.sendMessage({ attachment: fs.createReadStream(filePath) }, event.threadID);
      
      if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
      setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 15000);
    });

  } catch (error) {
    console.error(error);
    if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
    api.sendMessage(`❌ | Error: ${error.message || "Server busy hai!"}`, event.threadID);
  }
}
