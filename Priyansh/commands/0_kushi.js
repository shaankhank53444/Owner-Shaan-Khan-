const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "dewani",
  version: "12.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — GF Style AI + Smart Audio/Video Downloader",
  commandCategory: "ai",
  usages: "dewani <message | song name | video link>",
  cooldowns: 2
};

const chatMemory = { history: {} };

// APIs
const DL_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";
const YT_SEARCH_API = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";

function isYouTubeUrl(text) {
  return /(youtube\.com|youtu\.be)/i.test(text);
}

async function getYouTubeData(query) {
  try {
    if (isYouTubeUrl(query)) return { url: query.trim(), title: "YouTube Video" };
    const { data } = await axios.get(YT_SEARCH_API, { params: { q: query } });
    const item = data?.result?.[0] || data?.result?.items?.[0] || (await yts(query)).videos[0];
    return item ? { url: item.url || `https://www.youtube.com/watch?v=${item.videoId}`, title: item.title } : null;
  } catch (e) { return null; }
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  const cleanedMsg = body.replace(/^dewani[\s,!.?:-]*/i, "").trim() || body;
  const lowerMsg = cleanedMsg.toLowerCase();

  // Music or Video detection
  if (lowerMsg.includes("song") || lowerMsg.includes("music") || lowerMsg.includes("video") || isYouTubeUrl(cleanedMsg)) {
    const isVideoReq = lowerMsg.includes("video");
    let query = cleanedMsg.replace(/song|music|play|video/gi, "").trim();
    if (!query && !isYouTubeUrl(cleanedMsg)) return api.sendMessage("Jaanu, naam to batao kya bhejoon? 😘", threadID, messageID);

    try {
      const videoData = await getYouTubeData(query || cleanedMsg);
      if (!videoData) return api.sendMessage("Sorry baby, nahi mila 🥺", threadID, messageID);

      const { data } = await axios.get(DL_API, { params: { url: videoData.url } });
      const downloadUrl = isVideoReq ? data.result.video : data.result.audio;
      const ext = isVideoReq ? "mp4" : "mp3";

      if (!downloadUrl) return api.sendMessage("File link nahi mil rahi baby 🥺", threadID, messageID);

      // Stylish Title Display
      const stylishTitle = videoData.title.toUpperCase().split('').map(c => c + '').join(''); 
      await api.sendMessage(`✨ 𝑱𝑨𝑨𝑵𝑼 𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑨 ${isVideoReq ? '𝑽𝑰𝑫𝑬𝑶' : '𝑴𝑼𝑺𝑰𝑪'}\n\n🎵 𝑻𝒊𝒕𝒍𝒆: ${videoData.title}\n\n🚀 𝑶𝒘𝒏𝒆𝒓: 𝑺𝒉𝒂𝒂𝒏 𝑲𝒉𝒂𝒏`, threadID);

      const filePath = `${__dirname}/cache_${senderID}_${Date.now()}.${ext}`;
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => fs.unlinkSync(filePath));
      });
      return;
    } catch (e) {
      return api.sendMessage("Kuch error aa gaya baby, sorry 🥺", threadID, messageID);
    }
  }

  // Normal AI Chat
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `Tumhara naam "Dewani" hai. Owner "Shaan Khan" hai. Tum ek romantic, flirty girlfriend ho. Roman Urdu/Hindi me short reply karo (max 2 line). Emojis use karo. Context:\n${chatMemory.history[threadID].join("\n")}\nDewani:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    const reply = res.data?.result?.answer || "Ji jaanu?";
    api.sendMessage(reply, threadID, messageID);
    chatMemory.history[threadID].push(`Dewani: ${reply}`);
  } catch (e) {
    api.sendMessage("Net slow hai shayad jaanu 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body || event.senderID == api.getCurrentUserID()) return;
  if ((event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) || event.body.toLowerCase().startsWith("dewani")) {
    this.run({ api, event });
  }
};
