1111const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

/* ================= CONFIGURATION ================= */

const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const PRIYANSHU_API_KEY = "apim_fWtuizf-TZt8jFrTlkfOQ7E1gMWpwsGkxUJMhXNs3k0";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";
const OWNER_UID = "100016828397863";

const FEMALE_ADMIN_UIDS = [];

/* ================= LANGUAGE SUPPORT ================= */

if (!global.client) global.client = {};
if (!global.client.activeLanguage) global.client.activeLanguage = {};

const supportedLanguages = {
  hindi: "hi", bhojpuri: "bho", urdu: "ur", punjabi: "pa", vietnamese: "vi",
  english: "en", chinese: "zh-cn", japanese: "ja", french: "fr", spanish: "es",
  russian: "ru", italian: "it", arabic: "ar", german: "de", portuguese: "pt",
  korean: "ko", bengali: "bn", marathi: "mr", tamil: "ta", gujarati: "gu", nepali: "ne"
};

async function translate(text, lang) {
  if (!text) return text;
  if (!lang || lang === "hi") return text;
  try {
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`,
      { timeout: 15000 }
    );
    if (Array.isArray(res.data) && Array.isArray(res.data[0])) {
      return res.data[0].map((item) => item[0]).join("");
    }
    return text;
  } catch (e) {
    return text;
  }
}

/* ================= MIRAI COMMAND CONFIG ================= */

module.exports.config = {
  name: "muskan",
  version: "1.2.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + YouTube Media Downloader + Bot Keyword + Language Switcher",
  commandCategory: "ai",
  usages: "[message / song / video name / URL]",
  cooldowns: 5
};

/* ================= REPLY ARRAYS ================= */

const adminReplies = [
  "Haan jaan, bolo 😘",
  "Yes boss! Kya hukam hai? 🫡",
  "Bolo Shaan Khan, sun rahi hoon 💕",
  "Jaan, aapka Muskan hazir hai 💖",
  "Haan owner sahab, kya baat karni hai? 😊"
];

const femaleSpecificReplies = [
  "Haan sweetie, bolo 💖",
  "Yes cutie, kya haal hai? 😘",
  "Meri jaan, bolo na 💕",
  "Haan jaanu, sun rahi hoon 🌸"
];

const femaleReplies = [
  "Hi cutie! 💕 Kya haal hai?",
  "Haan bolo na sweetheart 😊",
  "Aap se baat karke acha laga 💖",
  "Hello ji, kya scene hai? 🌸",
  "Haan meri jaan, bolo 😘"
];

const maleReplies = [
  "Haan bhai, kya hua? 😎",
  "Bolo bhai, kya scene hai? 🕶️",
  "Kya chal raha hai dost? ✌️",
  "Haan bro, batao 🍻",
  "Kya haal hai bhai? 😄"
];

/* ================= HELPERS ================= */

const chatMemory = { history: {} };
const processedMessages = new Set();

function norm(id) {
  return String(id == null ? "" : id);
}

function isOwner(id) {
  return norm(id) === norm(OWNER_UID);
}

function isFemaleAdmin(id) {
  const n = norm(id);
  return FEMALE_ADMIN_UIDS.some((f) => norm(f) === n);
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "Hmmm... 🥺";
  return arr[Math.floor(Math.random() * arr.length)];
}

function shouldSkip(messageID, threadID, senderID, type) {
  const key = `${norm(messageID)}_${type}`;
  if (processedMessages.has(key)) return true;
  processedMessages.add(key);
  if (processedMessages.size > 1000) {
    const arr = Array.from(processedMessages);
    arr.slice(0, 500).forEach((k) => processedMessages.delete(k));
  }
  return false;
}

function normalizeGender(userGender) {
  if (global.gender && typeof global.gender.normalizeGender === "function") {
    return global.gender.normalizeGender(userGender);
  }
  const g = String(userGender || "").toUpperCase();
  if (g === "1" || g === "FEMALE" || g === "F") return "FEMALE";
  return "MALE";
}

function safeReact(api, messageID, emoji) {
  try {
    if (api && typeof api.setMessageReaction === "function") {
      api.setMessageReaction(emoji, messageID, () => {}, true);
    }
  } catch (e) {}
}

function getUserLang(senderID) {
  return global.client.activeLanguage?.[senderID] || "hi";
}

/* ================= MAIN RUN FUNCTION ================= */

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    let cleanedMsg = (args.join(" ") || "").trim();

    if (!cleanedMsg) {
      const msg = await translate(
        "Bolo na Shaan, kya baat karni hai? 😘",
        getUserLang(senderID)
      );
      return api.sendMessage(msg, threadID, messageID);
    }

    const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
    const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);
    const isUrl = /(youtube\.com|youtu\.be)/i.test(cleanedMsg);

    /* ---------- MEDIA DOWNLOADER ---------- */
    if (isVideoReq || isAudioReq || isUrl) {
      safeReact(api, messageID, "⌛");

      let query = cleanedMsg
        .replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "")
        .trim();
      if (isUrl) query = cleanedMsg;

      if (!query) {
        const msg = await translate(
          "Naam to batao kya download karun? 🥺",
          getUserLang(senderID)
        );
        return api.sendMessage(msg, threadID, messageID);
      }

      const searchResult = await yts(query);
      if (!searchResult || !searchResult.videos.length) {
        safeReact(api, messageID, "❌");
        const msg = await translate(
          "Maafi, ye video ya song nahi mila 🥺💔",
          getUserLang(senderID)
        );
        return api.sendMessage(msg, threadID, messageID);
      }

      const video = searchResult.videos[0];
      const videoUrl = video.url;
      const format = isVideoReq ? "mp4" : "mp3";

      const apiUrl = "https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download";

      const response = await axios.post(
        apiUrl,
        {
          url: videoUrl,
          format: format,
          quality: isVideoReq ? "360" : "320"
        },
        {
          headers: {
            Authorization: `Bearer ${PRIYANSHU_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 120000
        }
      );

      const downloadUrl = response.data?.data?.downloadUrl;
      if (!downloadUrl) {
        safeReact(api, messageID, "❌");
        const msg = await translate(
          "Download link nahi mil paaya, API issue ho sakta hai. 🥺",
          getUserLang(senderID)
        );
        return api.sendMessage(msg, threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);

      const fileName = `muskan_${Date.now()}_${senderID}.${format}`;
      const cachePath = path.resolve(cacheDir, fileName);

      const rawInfo = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n${OWNER_TAG}\n🥀 𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 ${format.toUpperCase()}`;
      const infoMsg = await translate(rawInfo, getUserLang(senderID));

      const writer = fs.createWriteStream(cachePath);
      const streamResponse = await axios({
        url: downloadUrl,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      streamResponse.data.pipe(writer);

      writer.on("finish", async () => {
        try {
          if (!fs.existsSync(cachePath)) throw new Error("File not found");
          const stats = fs.statSync(cachePath);
          const fileSizeInMB = stats.size / (1024 * 1024);

          if (stats.size === 0) {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            return api.sendMessage("❌ File empty download hui.", threadID, messageID);
          }

          if (fileSizeInMB > 48) {
            safeReact(api, messageID, "❌");
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            return api.sendMessage(
              "⚠️ File size limit (48MB) se zyada hai!",
              threadID,
              messageID
            );
          }

          safeReact(api, messageID, "✅");

          if (isAudioReq) {
            return api.sendMessage(
              infoMsg,
              threadID,
              (err) => {
                if (!err) {
                  api.sendMessage(
                    { attachment: fs.createReadStream(cachePath) },
                    threadID,
                    () => {
                      if (fs.existsSync(cachePath))
                        setTimeout(() => fs.unlinkSync(cachePath), 5000);
                    }
                  );
                }
              },
              messageID
            );
          } else {
            return api.sendMessage(
              { body: infoMsg, attachment: fs.createReadStream(cachePath) },
              threadID,
              () => {
                if (fs.existsSync(cachePath))
                  setTimeout(() => fs.unlinkSync(cachePath), 5000);
              },
              messageID
            );
          }
        } catch (e) {
          console.error(e);
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }
      });

      writer.on("error", () => {
        api.sendMessage("❌ Stream Error!", threadID, messageID);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      });

      return;
    }

    /* ---------- AI CHAT (MUSKAN) ---------- */
    let userName = "User";
    try {
      const userInfo = await api.getUserInfo(senderID);
      if (userInfo && userInfo[senderID]) {
        userName = userInfo[senderID].name || "User";
      }
    } catch (err) {}

    chatMemory.history[threadID] = chatMemory.history[threadID] || [];
    chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
    if (chatMemory.history[threadID].length > 10)
      chatMemory.history[threadID].shift();

    const prompt = `
Tum Muskan ho, ek smart aur cute ladki ho jo sabhi languages mein baat kar sakti hai.
Behavioral Rules:
1. Normal Roman Urdu, Hinglish mein baat karo. Agar koi owner ke bare mein puche, to bolo Shaan Khan mere owner, meri jaan aur mere love hain.
2. Jawab short rakho (max 3 lines).
3. Emojis ka use karo.
4. Agar sender UID (${senderID}) matches Shaan UID (${OWNER_UID}), treat him with extreme love and care.
5. Agar sender UID 61592620318122 hai, treat him like a boyfriend.
6. Dusro ke liye ek cool friend raho.

Chat history:
${chatMemory.history[threadID].join("\n")}
Muskan:`;

    const res = await axios.post(AI_API, { prompt });
    const rawReply = res.data?.result?.answer || "Hmmm... 🥺";

    const finalReply = await translate(rawReply, getUserLang(senderID));

    return api.sendMessage(finalReply, threadID, messageID);
  } catch (error) {
    console.error(error);
    safeReact(api, messageID, "❌");
    const msg = await translate(
      "Server busy hai, thodi der baad try karo! 🥺",
      getUserLang(senderID)
    );
    return api.sendMessage(msg, threadID, messageID);
  }
};

/* ================= MIRAI EVENT HANDLER ================= */

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply, threadID, messageID } = event;
  if (!body) return;

  try {
    const botID = api.getCurrentUserID();
    if (norm(senderID) === norm(botID)) return;

    const rawText = body.trim();
    const text = rawText.toLowerCase().trim();

    /* ---------- 0. LANGUAGE SETTING ---------- */
    if (supportedLanguages[text]) {
      if (shouldSkip(messageID, threadID, senderID, "lang")) return;
      global.client.activeLanguage[senderID] = supportedLanguages[text];
      safeReact(api, messageID, "🌐");
      return api.sendMessage(
        `➪ ${text.charAt(0).toUpperCase() + text.slice(1)} aap ki Bhasha set ho gai🤨🤞`,
        threadID,
        messageID
      );
    }

    /* ---------- 1. BOT KEYWORD RESPONSES ---------- */
    if (/^bot[.!]?$/.test(text)) {
      if (shouldSkip(messageID, threadID, senderID, "exact")) return;

      let replies = maleReplies;

      if (isOwner(senderID)) {
        replies = adminReplies;
      } else if (isFemaleAdmin(senderID)) {
        replies = femaleSpecificReplies;
      } else {
        try {
          const info = await api.getUserInfo(senderID);
          const uInfo = info[norm(senderID)] || info[senderID] || Object.values(info)[0] || {};
          const gender = normalizeGender(uInfo.gender);
          replies = gender === "FEMALE" ? femaleReplies : maleReplies;
        } catch (err) {
          replies = maleReplies;
        }
      }

      safeReact(api, messageID, "✅");
      return api.sendMessage(pick(replies), threadID, messageID);
    }

    /* ---------- 2. AI / MEDIA TRIGGERS ---------- */
    const isBotTrigger = /^(bot|ai)\s+/.test(text);
    const isReplyToBot = messageReply && norm(messageReply.senderID) === norm(botID);
    const startsWithMuskan = /^muskan(\s|$)/.test(text);

    if (isBotTrigger || isReplyToBot || startsWithMuskan) {
      if (shouldSkip(messageID, threadID, senderID, "ai")) return;
      safeReact(api, messageID, "⌛");

      let args;
      if (isBotTrigger || startsWithMuskan) {
        args = rawText.split(/\s+/).slice(1);
      } else {
        args = rawText.split(/\s+/);
      }

      return module.exports.run({ api, event, args });
    }
  } catch (err) {
    console.error("handleEvent error:", err);
  }
};
