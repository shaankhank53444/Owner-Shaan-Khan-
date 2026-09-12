const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.9",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Shaan API Media Downloader (Video Fix)",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana maangein>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";
const OWNER_UID = "100000000000000"; // Apni Owner UID yahan add karein

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na Jaan, kya baat karni hai? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);
  const isUrl = /(youtube\.com|youtu\.be)/i.test(cleanedMsg);

  // --- Music / Video Downloader Logic ---
  if (isVideoReq || isAudioReq || isUrl) {
    let processingMsg = null;
    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      processingMsg = await new Promise(r => api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID, (err, info) => r(info)));

      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      if (isUrl) query = cleanedMsg;

      if (!query) {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Naam to batao kya download karun? 🥺", threadID, messageID);
      }

      const headers = { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      };

      // Search YouTube via API
      let video = null;
      if (isUrl) {
        video = { url: query, title: "YouTube Media" };
      } else {
        const searchRes = await axios.get("https://uzairrajputapis.qzz.io/api/search/youtube", { params: { q: query }, headers, timeout: 10000 });
        video = searchRes.data.result?.[0];
      }

      if (!video || !video.url) {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi, ye video ya song nahi mila 🥺💔", threadID, messageID);
      }

      let downloadUrl = null;
      const format = isVideoReq ? "mp4" : "mp3";

      // Helper to extract Video ID
      const getVideoID = (url) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        return match ? match[1] : null;
      };

      // Method 1: Try 360p Quality API first for videos
      if (isVideoReq) {
        try {
          const baseRes = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json", { timeout: 8000 });
          const diptoApi = baseRes.data?.api;
          const videoID = getVideoID(video.url);
          
          if (diptoApi && videoID) {
            const dl1 = await axios.get(`${diptoApi}/ytDl3?link=${videoID}&format=mp4&quality=360`, { headers, timeout: 15000 });
            downloadUrl = dl1.data?.downloadLink || dl1.data?.result?.downloadLink;
          }
        } catch (e) {
          console.log("Method 1 Failed, trying fallback...");
        }
      }

      // Method 2: Fallback to UzairRajput API if Method 1 fails or for Audio
      if (!downloadUrl) {
        try {
          const dl2 = await axios.post(
            isVideoReq ? "https://uzairrajputapis.qzz.io/api/downloader/youtube" : "https://uzairrajputapis.qzz.io/api/downloader/ytmp3", 
            { url: video.url }, 
            { headers, timeout: 20000 }
          );
          downloadUrl = isVideoReq 
            ? (dl2.data?.result?.downloadUrl || dl2.data?.result?.download_url || dl2.data?.downloadUrl) 
            : (dl2.data?.result?.download_url || dl2.data?.downloadUrl);
        } catch (e) {
          console.log("Method 2 Failed...");
        }
      }

      if (!downloadUrl) throw new Error("Download link nahi mila.");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const cachePath = path.join(cacheDir, `${Date.now()}.${format}`);
      const typeLabel = isVideoReq ? "MP4" : "MP3";
      const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.channel || video.author?.name || "Unknown"}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 ${typeLabel}`;

      // Download Stream
      const writer = fs.createWriteStream(cachePath);
      const response = await axios({ 
        url: downloadUrl, 
        method: 'GET', 
        responseType: 'stream', 
        headers: {
          ...headers,
          "Referer": "https://www.youtube.com/"
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000 // 2 Minutes Timeout
      });

      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", (err) => {
          writer.close();
          reject(err);
        });
      });

      // Check file size (Facebook limit: ~25MB)
      const stats = fs.statSync(cachePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      if (fileSizeInMB > 25) {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Yeh video 25MB se badi hai, is waja se Messenger par send nahi ho sakti 🥺. Koi choti video try karo!", threadID, messageID);
      }

      if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
      api.setMessageReaction("✅", messageID, () => {}, true);

      if (isVideoReq) {
        await api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
      } else {
        await api.sendMessage(infoMsg, threadID, messageID);
        await api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        });
      }
      return;
    } catch (err) {
      console.error("Downloader Error:", err.message);
      if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Server thoda thak gaya hai ya video restricted hai, baad mein try karo 🥺", threadID, messageID);
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
