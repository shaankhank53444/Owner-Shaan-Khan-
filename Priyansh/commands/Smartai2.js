const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.3",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Media Downloader",
  commandCategory: "ai",
  usages: "muskan <message | song/video name>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

async function getDiptoApi() {
  const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  return base.data.api;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq) {
    if (!cleanedMsg.replace(/video|vdo|mp4|film|movie|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim()) 
      return api.sendMessage("Jaanu, kya download karun? Naam to batao. 🥺", threadID, messageID);

    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      let query = cleanedMsg.replace(/video|vdo|mp4|film|movie|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      const searchResult = await yts(query);
      const video = searchResult.videos[0];

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      if (isVideoReq) {
        const diptoApi = await getDiptoApi();
        const { data } = await axios.get(`${diptoApi}/ytDl3?link=${video.videoId}&format=mp4&quality=360`);
        await api.sendMessage(`🎬 𝗧𝗶𝘁𝗹𝗲: ${data.title}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 VIDEO`, threadID);
        
        const videoPath = path.join(cacheDir, `${Date.now()}.mp4`);
        const writer = fs.createWriteStream(videoPath);
        const response = await axios.get(data.downloadLink, { responseType: 'stream' });
        response.data.pipe(writer);
        writer.on('finish', () => api.sendMessage({ attachment: fs.createReadStream(videoPath) }, threadID, () => fs.unlinkSync(videoPath)));
      } else {
        const { data } = await axios.post(AUDIO_API, { url: video.url });
        await api.sendMessage(`🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 MP3`, threadID);
        
        const audioPath = path.join(cacheDir, `${Date.now()}.mp3`);
        const writer = fs.createWriteStream(audioPath);
        const response = await axios.get(data?.result?.download_url || data?.result?.url, { responseType: 'stream' });
        response.data.pipe(writer);
        writer.on('finish', () => api.sendMessage({ attachment: fs.createReadStream(audioPath) }, threadID, () => fs.unlinkSync(audioPath)));
      }
      api.setMessageReaction("✅", messageID, () => {}, true);
      return;
    } catch (err) {
      return api.sendMessage("Maafi Shaan, server issue hai 🥺", threadID, messageID);
    }
  }

  // AI Chat Logic (Log wala system)
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(cleanedMsg);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `System Command: Tum Muskan ho, Shaan ki GF.
Rules: Naam mat lo jab tak zaroori na ho. Roman Urdu use karo. AI machine wali feeling mat do. Owner UID: 100016828397863.
Context: ${chatMemory.history[threadID].join(", ")}
Muskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    return api.sendMessage(res.data?.result?.answer || "Hmmm... 🥺", threadID, messageID);
  } catch (e) { return api.sendMessage("Net slow hai baby 🥺", threadID, messageID); }
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body || event.senderID == api.getCurrentUserID()) return;
  if (event.body.toLowerCase().startsWith("muskan")) this.run({ api, event, args: [event.body] });
};
