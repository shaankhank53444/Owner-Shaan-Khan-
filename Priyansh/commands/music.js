const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "music",
  version: "3.1.0",
  hasPermission: 0,
  credits: "SHANKAR + ChatGPT",
  description: "Smart music player using YouTube (Roman Urdu Version)",
  usePrefix: false,
  commandCategory: "Music",
  cooldowns: 10
};

const triggerWords = ["pika", "bot", "shankar"];
const keywordMatchers = ["gana", "music", "song", "suna", "sunao", "play", "chalao", "lagao"];

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

  let possibleSongWords = words.slice(keywordIndex + 1);
  possibleSongWords = possibleSongWords.filter(word => !keywordMatchers.includes(word));

  const songName = possibleSongWords.join(" ").trim();
  if (!songName) return;

  module.exports.run({ api, event, args: songName.split(" ") });
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) return api.sendMessage(`❌ | Kripya ek gaane ka naam likhein!`, event.threadID);

  try {
    const query = args.join(" ");
    const searching = await api.sendMessage(`✅ Apki Request Jari Hai Please Wait...| "${query}" YouTube par search kiya ja raha hai...`, event.threadID);

    // YouTube Video ID search
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl);
    const videoIdMatch = data.match(/"videoId":"(.*?)"/);
    
    if (!videoIdMatch || !videoIdMatch[1]) {
      return api.sendMessage(`❌ | "${query}" ke liye koi video nahi mili.`, event.threadID);
    }

    const videoId = videoIdMatch[1];
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // New API Call
    const apiUrl = `https://yt-tt.onrender.com/api/ytdl?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
    const res = await axios.get(apiUrl);

    if (!res.data || !res.data.result || !res.data.result.download_url) {
      return api.sendMessage(`❌ | Gaane ka MP3 link nahi mil saka.`, event.threadID);
    }

    const { title, download_url } = res.data.result;

    await api.editMessage(`🎵 | "${title}" download ho raha hai...`, searching.messageID);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
    
    const response = await axios.get(download_url, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: `🎶 |  »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉: ${title}\n\nAapka gaana taiyar hai!`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);
      
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 5000); 
      api.unsendMessage(searching.messageID);
    });

    writer.on("error", async (err) => {
      console.error(err);
      api.sendMessage(`❌ | Download mein galti hui: ${err.message}`, event.threadID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ | Kuch galat ho gaya: ${error.message}`, event.threadID);
  }
};
