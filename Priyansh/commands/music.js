const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "music",
  version: "3.0.0",
  hasPermission: 0,
  credits: "SHANKAR + ChatGPT",
  description: "Smart music player using YouTube",
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
  if (!args[0]) return api.sendMessage(`❌ | कृपया एक गाने का नाम दर्ज करें!`, event.threadID);

  try {
    const query = args.join(" ");
    const searching = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...| "${query}" YouTube पर खोजा जा रहा है...`, event.threadID);

    // 1. YouTube search (via scraping YT search results)
    const searchUrl = `https://yt-tt.onrender.com/results?search_query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl);
    const videoIdMatch = data.match(/"videoId":"(.*?)"/);
    if (!videoIdMatch || !videoIdMatch[1]) {
      return api.sendMessage(`❌ | "${query}" के लिए कोई वीडियो नहीं मिला।`, event.threadID);
    }

    const videoId = videoIdMatch[1];
    const youtubeUrl = `https://youtu.be/${videoId}`;

    // 2. Call your provided API for mp3 download
    const apiUrl = `https://shankar-all-apis.vercel.app/api/ytdl?url=${youtubeUrl}&format=mp3`;
    const res = await axios.get(apiUrl);

    if (!res.data?.status || !res.data.result?.download_url)
      return api.sendMessage(`❌ | गाने का MP3 लिंक प्राप्त नहीं हो सका।`, event.threadID);

    const { title, download_url, thumbnail } = res.data.result;

    await api.editMessage(`🎵 | "${title}" डाउनलोड किया जा रहा है...`, searching.messageID);

    const filePath = path.resolve(__dirname, "cache", `${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`);
    const response = await axios.get(download_url, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: `🎶 |  »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉: "${title}"`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);
      fs.unlinkSync(filePath);
      api.unsendMessage(searching.messageID);
    });

    writer.on("error", async err => {
      console.error(err);
      await api.sendMessage(`❌ | फाइल सेव करने में त्रुटि: ${err.message}`, event.threadID);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ | कुछ गड़बड़ हो गई: ${error.message}`, event.threadID);
  }
};