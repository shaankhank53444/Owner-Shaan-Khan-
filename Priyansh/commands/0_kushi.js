const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "dewani",
  version: "11.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — romantic gf style AI + auto song (dual API)",
  commandCategory: "ai",
  usages: "dewani <message | song name | YouTube URL>",
  cooldowns: 2
};

const chatMemory = {
  history: {}
};

const SONG_API_1    = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";       
const SONG_API_2    = "https://uzair-new-music-api.onrender.com/download/dlmp3";  
const YT_SEARCH_API = "https://uzairrajputapis.qzz.io/api/search/youtube";         
const AI_API        = "https://uzairrajputapis.qzz.io/api/ai/gemini";              

function isYouTubeUrl(text) {
  return /(youtube\.com|youtu\.be)/i.test(text);
}

async function searchYouTube(query) {
  try {
    const { data } = await axios.get(YT_SEARCH_API, {
      params: { q: query },
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000
    });

    const candidates = [];
    const pushItem = (it) => { if (it && typeof it === "object") candidates.push(it); };
    if (Array.isArray(data?.result)) data.result.forEach(pushItem);
    else if (Array.isArray(data?.result?.items)) data.result.items.forEach(pushItem);
    else if (Array.isArray(data?.result?.videos)) data.result.videos.forEach(pushItem);
    else if (data?.result && typeof data.result === "object") pushItem(data.result);
    if (Array.isArray(data?.results)) data.results.forEach(pushItem);
    if (Array.isArray(data?.data))    data.data.forEach(pushItem);
    if (Array.isArray(data?.items))   data.items.forEach(pushItem);
    if (Array.isArray(data?.videos))  data.videos.forEach(pushItem);

    for (const it of candidates) {
      const id    = it.videoId || it.id || it.video_id;
      const url   = it.url || it.link || it.videoUrl || (id ? `http://googleusercontent.com/youtube.com/watch?v=${id}` : null);
      const title = it.title || it.name || it.videoTitle;
      if (url && /(youtube\.com|youtu\.be)/i.test(url)) {
        return { url, title: title || "Your Song" };
      }
    }
  } catch (e) {
    console.log("⚠️ YT search API fail:", e.message);
  }

  try {
    const search = await yts(query);
    const video = search.videos?.[0];
    if (video) return { url: video.url, title: video.title };
  } catch (e) {
    console.log("⚠️ yt-search fallback fail:", e.message);
  }

  return null;
}

async function fetchSongAPI1(query) {
  let videoUrl = "";
  let title = "Your Song";

  if (isYouTubeUrl(query)) {
    videoUrl = query.trim();
  } else {
    const found = await searchYouTube(query);
    if (!found) return null;
    videoUrl = found.url;
    title = found.title;
  }

  const dl = await axios.post(
    SONG_API_1,
    { url: videoUrl },
    { headers: { "Content-Type": "application/json" }, timeout: 20000 }
  );

  const audioUrl = dl.data?.result?.download_url;
  if (!audioUrl) return null;
  return { audioUrl, title };
}

async function fetchSongAPI2(query) {
  const apiUrl = isYouTubeUrl(query)
    ? `${SONG_API_2}?url=${encodeURIComponent(query.trim())}`
    : `${SONG_API_2}?q=${encodeURIComponent(query.trim())}`;

  const { data } = await axios.get(apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 25000
  });

  if (!data || data.success === false) return null;
  const audioUrl = data.downloadUrl || data.url || data.link || data.audio;
  if (!audioUrl) return null;
  const title = data.title || data.searchResult?.title || "Your Song";
  return { audioUrl, title };
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  const userMsg = body || "";
  const cleanedMsg = userMsg.replace(/^dewani[\s,!.?:-]*/i, "").trim() || userMsg;

  if (
    cleanedMsg.toLowerCase().includes("song") ||
    cleanedMsg.toLowerCase().includes("music") ||
    cleanedMsg.toLowerCase().includes("play") ||
    isYouTubeUrl(cleanedMsg)
  ) {
    try {
      let query;
      if (isYouTubeUrl(cleanedMsg)) {
        query = cleanedMsg.trim();
      } else {
        query = cleanedMsg.replace(/song|music|play/gi, "").trim();
        if (!query) {
          return api.sendMessage("Jaanu song ka naam to batao 😘🎶", threadID, messageID);
        }
      }

      let songInfo = null;
      try {
        songInfo = await fetchSongAPI1(query);
      } catch (e) {
        console.log("⚠️ API-1 fail:", e.message);
      }
      if (!songInfo) {
        try {
          songInfo = await fetchSongAPI2(query);
        } catch (e) {
          console.log("⚠️ API-2 fail:", e.message);
        }
      }

      if (!songInfo) {
        return api.sendMessage("Sorry baby, ye song nahi mila 🥺💔", threadID, messageID);
      }

      const { audioUrl, title } = songInfo;
      
      // Pehle title aur message bhejna
      await api.sendMessage(`🔎 Search ho gaya baby...\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 MUSIC\n\n🎵 Title: ${title}\n\nAbhi file bhej rahi hoon, ruko thoda sa... 🎶`, threadID);

      const filePath = __dirname + `/cache_${senderID}_${Date.now()}.mp3`;

      const response = await axios({
        url: audioUrl,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 60000
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Bina user ke reply ka intezar kiye song bhej dena
      return api.sendMessage(
        {
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => { try { fs.unlinkSync(filePath); } catch (_) {} }
      );

    } catch (err) {
      return api.sendMessage("Song laate hue chhoti si problem aa gayi 🥺", threadID, messageID);
    }
  }

  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 8) chatMemory.history[threadID].shift();

  const fullChat = chatMemory.history[threadID].join("\n");

  const prompt =
`Tumhara naam "Dewani" hai. Tumhe owner "Shaan Khan" ne banaya hai.
Tum ek pyaari, romantic, thodi flirty Hindi/Urdu bolne wali girlfriend ho.
User se Hinglish (Roman Urdu/Hindi) me romantic + thoda teasing/hot gf andaaz me reply karo.
Cute emojis use karo (😘😍🥺💕🔥). Hamesha apne character me raho.

STRICT RULES:
- Reply MAX 2 line ka ho.
- Jawab chhota aur pura ho.
- Agar koi pooche "owner kaun hai" — bolna: "Mujhe mere Shaan Khan ne banaya hai 💕".

Conversation:
${fullChat}

Dewani ka reply (Hinglish, max 2 line, romantic style):`;

  try {
    const res = await axios.post(
      AI_API,
      { prompt },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    const botReply = (res.data?.result?.answer || "Samjhi nahi jaanu, dobara bolo na 🥺").trim();
    chatMemory.history[threadID].push(`Dewani: ${botReply}`);

    return api.sendMessage(botReply, threadID, messageID);

  } catch (err) {
    return api.sendMessage("Kuch toh gadbad hai jaanu, abhi reply nahi de pa rahi 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

  if (isReplyToBot || body.toLowerCase().startsWith("dewani")) {
    this.run({ api, event, args: [body] });
  }
};
