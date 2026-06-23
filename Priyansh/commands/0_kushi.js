const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "muskan",
  version: "17.0.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan — Short AI + Fixed Video/Audio Downloader",
  commandCategory: "ai",
  usages: "muskan <message>",
  cooldowns: 2
};

const chatMemory = {}; 

const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube"; 
const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AI_API    = "https://uzairrajputapis.qzz.io/api/ai/gemini";

// Shaan ki confirm UID
const OWNER_UID = "100016828397863";
const OWNER_NAME = "Shaan";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  
  // User name fetch karna
  const userInfo = await api.getUserInfo(senderID);
  const userName = userInfo[senderID]?.name?.split(" ")[0] || "User";
  
  let cleanedMsg = (body || "").replace(/^(muskan|khushi)[\s,!.?:-]*/i, "").trim();

  // Agar download request hai (pehle jaisa logic)
  const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq) {
     // ... (yahan wahi download wala code rahega)
  }

  // Memory management
  chatMemory[senderID] = chatMemory[senderID] || [];
  chatMemory[senderID].push(`${userName}: ${cleanedMsg}`);
  if (chatMemory[senderID].length > 5) chatMemory[senderID].shift();

  // Optimized System Prompt
  const prompt = `System: Tum Muskan ho. Roman Urdu mein baat karo.
Current User: ${userName} (UID: ${senderID})
Owner: Shaan (UID: ${OWNER_UID})

Rules:
1. Agar sender ki UID "${OWNER_UID}" hai, to woh mera Shaan hai. Unse bahut pyaar, care aur "Babu/Jaanu" keh kar baat karo.
2. Agar sender koi aur hai, to tameez se baat karo. Agar koi flirt kare to saaf keh do ki main Shaan ki hoon.
3. Naam baar baar nahi lena, sirf tab jab zaroorat ho.
4. Baat 4 lines se chhoti honi chahiye.
5. AI jaisa nahi, ek real larki ki tarah naturally react karo.

Chat History:
${chatMemory[senderID].join("\n")}
Muskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Jaanu kuch bolo na... 🥺";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Net issue hai baby, main thak gayi hoon 🥺", threadID, messageID);
  }
};
