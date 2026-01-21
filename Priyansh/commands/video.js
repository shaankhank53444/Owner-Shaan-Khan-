const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

// --- Dipto API Base URL Fetcher ---
const baseApiUrl = async () => {
    try {
        const base = await axios.get(`https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`);
        return base.data.api;
    } catch (e) {
        return "https://api.dipto.xyz"; 
    }
};

(async () => {
    global.apis = {
        diptoApi: await baseApiUrl()
    };
})();

module.exports.config = {
  name: "video",
  version: "2.2.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Smart YouTube video downloader using trigger with Dipto API",
  commandCategory: "media",
  usePrefix: false,
  cooldowns: 5
};

const triggerWords = ["pika", "bot", "shankar"];
const keywordMatchers = ["video", "bhejo", "bhej", "dikhao", "dikha", "lagao", "laga", "send", "dikhana"];

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

module.exports.run = async function({ api, event, args }) {
  const query = args.join(" ");
  if (!query) return api.sendMessage("❌ | Kripya video ka naam likhen.\nExample: video pal pal", event.threadID);

  try {
    const searching = await api.sendMessage(`✅ | Apki Request Jari Hai Please Wait...`, event.threadID);

    // Search logic wahi purana wala
    const searchResult = await yts(query);
    const video = searchResult.videos[0]; 

    if (!video) {
      api.unsendMessage(searching.messageID);
      return api.sendMessage("❌ | Maaf kijiyega, koi original video nahi mili.", event.threadID);
    }

    const videoUrl = video.url;
    const title = video.title.replace(/[^\w\s]/gi, '').substring(0, 50);
    const fileName = `${Date.now()}-${title}.mp4`;
    const filePath = path.join(__dirname, "cache", fileName);

    // FIX: Yahan ab Dipto ki API use ho rahi hai
    const res = await axios.get(`${global.apis.diptoApi}/ytDl3?link=${encodeURIComponent(videoUrl)}&format=mp4`);
    const downloadUrl = res.data.data.downloadLink;

    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 120000
    });

    if (!response.data) {
      api.unsendMessage(searching.messageID);
      return api.sendMessage("❌ | Video download karne mein masla aa raha hai.", event.threadID);
    }

    fs.writeFileSync(filePath, Buffer.from(response.data));

    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      // Transfer.sh logic (Badi file ke liye)
      const readStream = fs.createReadStream(filePath);
      axios.post("https://transfer.sh/" + fileName, readStream, {
        headers: { 'Content-Type': 'application/octet-stream' }
      }).then(uploadResponse => {
        fs.unlinkSync(filePath);
        api.unsendMessage(searching.messageID);
        return api.sendMessage(`⚠️ | Video size badi hai (${fileSizeMB.toFixed(2)}MB)\n💾 Download Link:\n${uploadResponse.data}`, event.threadID);
      }).catch(err => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return api.sendMessage(`❌ | Upload fail ho gaya: ${err.message}`, event.threadID);
      });
    } else {
      api.unsendMessage(searching.messageID);
      await api.sendMessage({
        body: `🎬 | Title: ${title}\n\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

  } catch (e) {
    console.error(e);
    api.sendMessage(`❌ | Error: ${e.message}`, event.threadID);
  }
};
