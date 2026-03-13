const fs = require("fs-extra");
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

    // Search Logic
    const searchResult = await yts(query);
    const video = searchResult.videos[0];
    if (!video) {
      if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
      return api.sendMessage(`❌ | "${query}" ke liye koi result nahi mila.`, event.threadID);
    }

    const videoUrl = video.url;
    const title = video.title;

    // Fixed API Implementation
    const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);

    if (!res.data.status || !res.data.result || !res.data.result.mp3) {
      throw new Error("Download link nahi mil saka");
    }

    const downloadUrl = res.data.result.mp3;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    
    // Downloading logic using the working method
    const audioRes = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 180000
    });

    fs.writeFileSync(filePath, Buffer.from(audioRes.data));

    // 1. Text Message (Aapki original formatting)
    await api.sendMessage(`🖤 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉MUSIC`, event.threadID);

    // 2. Audio File send karna
    await api.sendMessage({
      attachment: fs.createReadStream(filePath)
    }, event.threadID);

    // Cleanup
    if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
    setTimeout(() => { 
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
    }, 15000);

  } catch (error) {
    console.error(error);
    if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
    api.sendMessage(`❌ | Error: ${error.message || "Server busy hai!"}`, event.threadID);
  }
};
