const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "vid",
  version: "4.2.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "YouTube video downloader with custom branding",
  usePrefix: false,
  commandCategory: "Media",
  cooldowns: 10
};

const triggerWords = ["pika", "bot", "shan"];
const keywordMatchers = ["video", "dikhao", "play", "chalao", "lagao", "clip"];

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
  const videoName = possibleVideoWords.join(" ").trim();
  if (!videoName) return;

  module.exports.run({ api, event, args: videoName.split(" ") });
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) return api.sendMessage(`❌ | Please video ka naam likhen!`, event.threadID);

  try {
    const query = args.join(" ");
    // Search message update
    const searchingMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please Wait...`, event.threadID);

    // YouTube search logic
    const searchRes = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const videoIdMatch = searchRes.data.match(/"videoId":"(.*?)"/);

    if (!videoIdMatch || !videoIdMatch[1]) {
      return api.sendMessage(`❌ | Maaf kijiyega, video nahi mil saki.`, event.threadID);
    }

    const videoId = videoIdMatch[1];
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Uzair Rajput API call
    const apiUrl = `https://uzairrajputapis.vercel.app/api/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await axios.get(apiUrl);

    const downloadUrl = res.data.videoUrl || res.data.result?.download_url || res.data.data?.url;
    const videoTitle = res.data.title || `Video_${Date.now()}`;

    if (!downloadUrl) {
      return api.sendMessage(`❌ | Download link nahi mil saka. API issue ho sakta hai.`, event.threadID);
    }

    await api.editMessage(`📥 | "${videoTitle}" download ho rahi hai...`, searchingMsg.messageID);

    const filePath = path.resolve(__dirname, "cache", `${Date.now()}.mp4`);
    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      // Body with your custom text
      await api.sendMessage({
        body: `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉VIDEO\n\n🎵 Title: ${videoTitle}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);
      
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.unsendMessage(searchingMsg.messageID);
    });

    writer.on("error", (err) => {
      throw err;
    });

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ | Kuch ghalat ho gaya: ${error.message}`, event.threadID);
  }
};
