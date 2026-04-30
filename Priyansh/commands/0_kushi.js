const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "dewani",
  version: "12.5.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — GF Style AI + Video/Audio Search Fix",
  commandCategory: "ai",
  usages: "dewani <msg | song | video name>",
  cooldowns: 2
};

const chatMemory = { history: {} };

const DL_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";
const YT_SEARCH_API = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";

function isYouTubeUrl(text) {
  return /(youtube\.com|youtu\.be)/i.test(text);
}

async function getYTData(query) {
  try {
    // Priority 1: Direct Search API
    const res = await axios.get(YT_SEARCH_API, { params: { q: query } });
    const data = res.data.result;
    const item = Array.isArray(data) ? data[0] : (data.items ? data.items[0] : data);
    
    if (item && (item.url || item.videoId || item.id)) {
      return {
        url: item.url || `https://www.youtube.com/watch?v=${item.videoId || item.id}`,
        title: item.title || "Your Song"
      };
    }
    // Priority 2: yt-search library fallback
    const search = await yts(query);
    return search.videos.length > 0 ? { url: search.videos[0].url, title: search.videos[0].title } : null;
  } catch (e) {
    return null;
  }
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  const cleanedMsg = body.replace(/^dewani[\s,!.?:-]*/i, "").trim() || body;
  const lowerMsg = cleanedMsg.toLowerCase();

  // Detect Video or Audio request
  if (lowerMsg.includes("song") || lowerMsg.includes("music") || lowerMsg.includes("video") || isYouTubeUrl(cleanedMsg)) {
    const isVideoReq = lowerMsg.includes("video");
    let query = cleanedMsg.replace(/song|music|play|video/gi, "").trim();
    
    if (!query && !isYouTubeUrl(cleanedMsg)) return api.sendMessage("Jaanu, kuch naam to likho music ka 😘", threadID, messageID);

    try {
      const videoData = await getYTData(query || cleanedMsg);
      if (!videoData) return api.sendMessage("Sorry baby, ye song nahi mil raha 🥺💔", threadID, messageID);

      const dlRes = await axios.get(DL_API, { params: { url: videoData.url } });
      const dlData = dlRes.data.result;
      const downloadUrl = isVideoReq ? dlData.video : dlData.audio;

      if (!downloadUrl) return api.sendMessage("Jaanu iska download link nahi mil raha, dusra try karein? 🥺", threadID, messageID);

      // Stylish message as requested
      const type = isVideoReq ? "𝑽𝑰𝑫𝑬𝑶" : "𝑴𝑼𝑺𝑰𝑪";
      await api.sendMessage(`✨ 𝑱𝑨𝑨𝑵𝑼 𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑨 ${type}\n\n🎵 𝑻𝒊𝒕𝒍𝒆: ${videoData.title}\n\n🚀 𝑶𝒘𝒏𝒆𝒓: 𝑺𝒉𝒂𝒂𝒏 𝑲𝒉𝒂𝒏`, threadID);

      const ext = isVideoReq ? "mp4" : "mp3";
      const filePath = `${__dirname}/cache_${senderID}_${Date.now()}.${ext}`;
      
      const fileStream = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      fileStream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      });
      
      writer.on("error", () => api.sendMessage("File save karne mein problem hui baby 🥺", threadID));
      return;

    } catch (err) {
      return api.sendMessage("Server busy hai shayad, thodi der baad try karo na 🥺", threadID, messageID);
    }
  }

  // Normal AI Chat
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 6) chatMemory.history[threadID].shift();

  const prompt = `Tumhara naam "Dewani" hai. Owner "Shaan Khan" hai. Tum ek cute, romantic girlfriend ho. Roman Urdu/Hindi me short aur sweet reply do (max 2 line). Emojis: 😘😍🥺💕\nContext:\n${chatMemory.history[threadID].join("\n")}\nDewani:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    const botReply = res.data?.result?.answer || "Ji mere hamsafar? 😘";
    api.sendMessage(botReply, threadID, messageID);
    chatMemory.history[threadID].push(`Dewani: ${botReply}`);
  } catch (err) {
    api.sendMessage("Jaanu, network issue hai shayad 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body || event.senderID == api.getCurrentUserID()) return;
  if ((event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) || event.body.toLowerCase().startsWith("dewani")) {
    this.run({ api, event });
  }
};
