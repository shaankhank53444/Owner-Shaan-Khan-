const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
  name: "mp3",
  version: "3.2.3",
  hasPermission: 0,
  credits: "SHAAN KHAN",
  description: "Smart music player using YouTube",
  usePrefix: false,
  commandCategory: "mp3",
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
  let filePath;

  try {
    searchingMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, event.threadID);

    // 1. YouTube Search
    const searchResult = await yts(query);
    const video = searchResult.videos[0];
    if (!video) {
      if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
      return api.sendMessage(`❌ | "${query}" ke liye koi result nahi mila.`, event.threadID);
    }

    const videoUrl = video.url;
    const title = video.title;

    // 2. API Call to kraza.qzz.io
    const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);

    // API Response validation
    if (!res.data || !res.data.status || !res.data.result || !res.data.result.mp3) {
      throw new Error("Download link server se nahi mil saka.");
    }

    const downloadUrl = res.data.result.mp3;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    filePath = path.join(cacheDir, `${Date.now()}.mp3`);

    // 3. Downloading Audio File
    const audioRes = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 300000 // 5 minutes timeout for slow servers
    });

    await fs.writeFile(filePath, Buffer.from(audioRes.data));

    // 4. Send Info Message
    await api.sendMessage(`🖤 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉MUSIC`, event.threadID);

    // 5. Send Audio Attachment
    await api.sendMessage({
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
      // Cleanup after sending
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    if (searchingMsg) api.unsendMessage(searchingMsg.messageID);

  } catch (error) {
    console.error("MUSIC ERROR:", error);
    if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    api.sendMessage(`❌ | Error: ${error.message || "Server busy hai!"}`, event.threadID);
  }
};
