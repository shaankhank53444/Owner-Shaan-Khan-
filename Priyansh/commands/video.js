const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
  name: "video",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Smart YouTube video downloader using trigger",
  commandCategory: "media",
  usePrefix: false,
  cooldowns: 5
};

const triggerWords = ["pika", "bot", "shaan"];
// Keywords ko mazeed behtar kiya gaya hai (bhej, dikha, send, etc.)
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

  // Simulate run command
  module.exports.run({ api, event, args: query.split(" ") });
};

module.exports.run = async function({ api, event, args }) {
  const query = args.join(" ");
  if (!query) return api.sendMessage("❌ | Kripya kisi video ka naam likhen.\nMisal ke taur par: video Lal Dupatta", event.threadID);

  try {
    // Sirf request status message, extra text hata diya gaya hai
    const searching = await api.sendMessage(`✅ | "${query}" Aapki Request Jari Hai Please Wait...`, event.threadID);

    // Search using yt-search
    const searchResult = await yts(query);
    const video = searchResult.videos[0];

    if (!video) {
      api.unsendMessage(searching.messageID);
      return api.sendMessage("❌ | Koi bhi video nahi mili.", event.threadID);
    }

    const videoUrl = video.url;
    const title = video.title.replace(/[^\w\s]/gi, '').substring(0, 50);
    const fileName = `${Date.now()}-${title}.mp4`;
    const filePath = path.join(__dirname, "cache", fileName);

    // Download using API
    const apiUrl = `https://yt-tt.onrender.com/api/youtube/video?url=${encodeURIComponent(videoUrl)}`;

    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      timeout: 90000
    });

    if (!response.data) {
      api.unsendMessage(searching.messageID);
      return api.sendMessage("❌ | Video download karne mein masla hua hai.", event.threadID);
    }

    // Write video to file
    fs.writeFileSync(filePath, Buffer.from(response.data));

    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      const readStream = fs.createReadStream(filePath);
      const uploadReq = axios.post("https://transfer.sh/" + fileName, readStream, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      }).then(uploadResponse => {
        fs.unlinkSync(filePath);
        api.unsendMessage(searching.messageID);
        return api.sendMessage(`⚠️ | Video size: ${fileSizeMB.toFixed(2)}MB\n💾 Download Link:\n${uploadResponse.data}`, event.threadID);
      }).catch(err => {
        fs.unlinkSync(filePath);
        return api.sendMessage(`❌ | Video bohot badi hai aur upload karne mein masla hua: ${err.message}`, event.threadID);
      });
    } else {
      api.unsendMessage(searching.messageID);
      await api.sendMessage({
        body: `🎬 | "${title}"\n\n »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath));
    }

  } catch (e) {
    console.error(e);
    api.sendMessage(`❌ | Koi ghalti hui hai: ${e.message}`, event.threadID);
  }
};
