const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
  name: "video",
  version: "5.0.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "YouTube video downloader with auto-trigger",
  commandCategory: "media",
  usePrefix: true,
  prefix: true,
  cooldowns: 5
};

const API_BASE = "https://yt-tt.onrender.com";
const triggerWords = ["pika", "bot", "shankar"];
const keywordMatchers = ["video", "bhejo", "bhej", "dikhao", "dikha", "lagao", "laga", "send", "dikhana"];

// --- Helper Function for Downloading ---
async function downloadVideo(videoUrl) {
    try {
        const response = await axios.get(`${API_BASE}/api/youtube/video`, {
            params: { url: videoUrl },
            timeout: 120000,
            responseType: 'arraybuffer'
        });
        return response.data ? { success: true, data: response.data } : null;
    } catch (err) {
        console.log("Video download failed:", err.message);
        return null;
    }
}

// --- Event Handler (Auto Trigger) ---
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

  let possibleWords = words.slice(keywordIndex + 1);
  possibleWords = possibleWords.filter(word => !keywordMatchers.includes(word));
  const query = possibleWords.join(" ").trim();
  if (!query) return;

  module.exports.run({ api, event, args: query.split(" ") });
};

// --- Main Command Run ---
module.exports.run = async function({ api, event, args }) {
  const query = args.join(" ");
  if (!query) return api.sendMessage("❌ | Kripya video ka naam likhen.\nExample: video pal pal", event.threadID, event.messageID);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const searchingMsg = await api.sendMessage(`✅ | Apki Request Jari Hai, Please Wait...`, event.threadID);

  try {
    const searchResult = await yts(query);
    const video = searchResult.videos[0]; 

    if (!video) {
      api.unsendMessage(searchingMsg.messageID);
      return api.sendMessage("❌ | Maaf kijiyega, koi video nahi mili.", event.threadID, event.messageID);
    }

    const videoUrl = video.url;
    const title = video.title.replace(/[^\w\s]/gi, '').substring(0, 40);
    const filePath = path.join(cacheDir, `${Date.now()}_video.mp4`);

    const downloadResult = await downloadVideo(videoUrl);

    if (!downloadResult || !downloadResult.success) {
      api.unsendMessage(searchingMsg.messageID);
      return api.sendMessage("❌ | Download server busy hai ya video nahi mil rahi.", event.threadID, event.messageID);
    }

    fs.writeFileSync(filePath, Buffer.from(downloadResult.data));

    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
        api.unsendMessage(searchingMsg.messageID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return api.sendMessage(`⚠️ | Video size badi hai (${fileSizeMB.toFixed(2)}MB). Messenger limit 25MB hai.`, event.threadID);
    }

    await api.sendMessage({
        body: `🎬 | Title: ${video.title}\n📺 | Channel: ${video.author.name}\n\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉VIDEO`,
        attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(searchingMsg.messageID);
    });

  } catch (e) {
    console.error("Error:", e.message);
    if (searchingMsg && searchingMsg.messageID) api.unsendMessage(searchingMsg.messageID);
    api.sendMessage(`❌ | Error: ${e.message}`, event.threadID);
  }
};
