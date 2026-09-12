const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "19.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Clean Media Downloader",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana/video maangein>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";
const OWNER_UID = "100016828397863";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na Jaan, kya baat karni hai? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);
  const isUrl = /(youtube\.com|youtu\.be)/i.test(cleanedMsg);

  // --- Music / Video Downloader Logic (Same as your working music module) ---
  if (isVideoReq || isAudioReq || isUrl) {
    let processingMsg = null;
    let cachePath = "";
    const isVideo = isVideoReq;
    const format = isVideo ? "mp4" : "mp3";

    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      processingMsg = await new Promise(r => api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID, (err, info) => r(info)));

      let query = cleanedMsg.replace(/\b(video|vdo|mp4|film|movie|song|music|audio|mp3|play|gaana|gane|ghana)\b/gi, "").trim();
      if (isUrl) query = cleanedMsg;

      if (!query) {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Naam to batao kya download karun? 🥺", threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      cachePath = path.join(cacheDir, `${Date.now()}.${format}`);
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const headers = { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" 
      };

      // 1. YouTube Search API
      const searchRes = await axios.get("https://uzairrajputapis.qzz.io/api/search/youtube", { params: { q: query }, headers });
      const video = searchRes.data?.result?.[0];

      if (!video) {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi, ye video ya song nahi mila 🥺💔", threadID, messageID);
      }

      // 2. UzairRajput Downloader API
      const dlRes = await axios.post(
        isVideo ? "https://uzairrajputapis.qzz.io/api/downloader/youtube" : "https://uzairrajputapis.qzz.io/api/downloader/ytmp3", 
        { url: video.url }, 
        { headers }
      );

      const downloadUrl = isVideo ? dlRes.data?.result?.downloadUrl : dlRes.data?.result?.download_url;
      if (!downloadUrl) throw new Error("Download link nahi mila.");

      // 3. Download Stream
      const writer = fs.createWriteStream(cachePath);
      const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', headers });

      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const typeLabel = isVideo ? "VIDEO" : "MUSIC";
      const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.channel || video.author?.name || "Unknown"}\n\n${OWNER_TAG}🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 ${typeLabel} 👈`;

      api.setMessageReaction("✅", messageID, () => {}, true);

      if (isVideo) {
        await api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, messageID);
      } else {
        await api.sendMessage(infoMsg, threadID, messageID);
        await api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID);
      }
      return;

    } catch (error) {
      console.error("Downloader Error:", error.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(`Server thoda thak gaya hai ya error agaya hai 🥺💔`, threadID, messageID);
    } finally {
      if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
      if (cachePath && fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
  }

  // --- AI Chat Logic (Muskan) ---
  let userName = "User";
  try {
    const userInfo = await api.getUserInfo(senderID);
    if (userInfo && userInfo[senderID]) {
      userName = userInfo[senderID].name || "User";
    }
  } catch (err) {
    console.log("User info fetch error:", err);
  }

  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `
Tum Muskan ho, ek smart aur cute ladki ho jo sabhi languages mein baat kar sakti hai.
Behavioral Rules:
1. Normal Roman Urdu, Hinglish, aur user ki language mein baat karo. Tumhe sab pata hai. Agar koi owner ya banane wale ke bare mein puche, to bolo Shaan Khan K mere owner, meri jaan aur mere love hain.
2. Jawab hamesha short rakho (maximum 3 lines tak).
3. Emojis ka istemal karo lekin limit mein taaki natural lage.
4. Naam ka baar-baar ratti lagane se bacho, baat ko bilkul natural rakho.
5. Har user ki pehchan aur unke specific topic ko alag rakho, kisi dusre member ki baatein mix mat karo.
6. Agar samne wala pyar ya romantic baatein kare, toh unke sath bohot sweet aur pyaar se pesh aao. Agar koi faltu ya badtameez baat kare, tabhi usko roast karo; bina wajah badtameez mat bano.

Relationship Logic:
- Agar sender UID aur Owner Shaan ki UID match karti hai (${OWNER_UID}), toh samajh jao wo Shaan hain.
- Shaan ke liye attitude hamesha romantic, caring aur supportive rahega.
- Kisi aur ke liye ek cool, chill aur mast friend jaisi raho gi. Agar sender Uid shoni ka 61592620318122 ho toh isko boyfriend ki tarah treat karo.

Output Format:
- Sirf raw text reply do, koi extra markdown ya asterisks use mat karna.

Context:\n${chatMemory.history[threadID].join("\n")}\nMuskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Hmmm... 🥺";
    const lines = reply.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 4) reply = lines.slice(0, 3).join('\n') + " ✨";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Mera net thoda slow chal raha hai, baad mein baat karte hain 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event, args: [body] });
  }
};
