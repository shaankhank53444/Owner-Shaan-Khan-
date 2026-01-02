const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
  name: "music",
  version: "3.2.1",
  hasPermission: 0,
  credits: "SHAAN KHAN", // Updated as per your request
  description: "Smart music player using YouTube",
  usePrefix: false,
  commandCategory: "Music",
  cooldowns: 10
};

const triggerWords = ["pika", "music", "shan"];
const keywordMatchers = ["gana", "sand", "song", "suna", "sunao", "play", "chalao", "lagao"];

// --- Helper Functions ---
async function getBaseApi() {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
    return res.data.api;
  } catch (e) {
    return "https://d1pt0.onrender.com"; // Fallback API
  }
}

// Event handler for trigger words
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
    // Sirf simple waiting message rakha gaya hai
    searchingMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, event.threadID);

    // 1. Search Video on YouTube
    const searchResult = await yts(query);
    const video = searchResult.videos[0];
    if (!video) {
      if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
      return api.sendMessage(`❌ | "${query}" ke liye koi result nahi mila.`, event.threadID);
    }

    const videoID = video.videoId;
    const title = video.title;

    // 2. Get API Base URL
    const apiBase = await getBaseApi();

    // 3. Get Download Link
    const res = await axios.get(`${apiBase}/ytDl3?link=${videoID}&format=mp3`);

    if (!res.data || !res.data.downloadLink) {
      throw new Error("Download link nahi mil saka");
    }

    const downloadUrl = res.data.downloadLink;

    // 4. Download and Send
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    const writer = fs.createWriteStream(filePath);

    const stream = await axios.get(downloadUrl, { responseType: "stream" });
    stream.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: `🖤 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👇`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);

      // Cleanup
      if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
      setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 10000);
    });

  } catch (error) {
    console.error(error);
    if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
    api.sendMessage(`❌ | Error: ${error.message || "Server busy hai, baad mein koshish karein!"}`, event.threadID);
  }
};