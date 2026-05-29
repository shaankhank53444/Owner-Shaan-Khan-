const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Priyanshu API Media Downloader",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana maangein>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const PRIYANSHU_API_KEY = "apim_VSMuhKCtnryc9nzvNP9DjghtQmsQnotVejLkIAP4xZs";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Balao na, kya chahiye? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);
  const isUrl = /(youtube\.com|youtu\.be)/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq || isUrl) {
    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);

      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      if (isUrl) query = cleanedMsg;

      if (!query) return api.sendMessage("Naam to batao kya download karun? 🥺", threadID, messageID);

      const searchResult = await yts(query);
      if (!searchResult || !searchResult.videos.length) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi, ye video ya song nahi mila 🥺💔", threadID, messageID);
      }

      const video = searchResult.videos[0];
      const videoUrl = video.url;
      const format = isVideoReq ? "mp4" : "mp3";

      const apiUrl = `https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download`;
      const response = await axios.post(apiUrl, {
        url: videoUrl,
        format: format,
        quality: isVideoReq ? "360" : "320"
      }, {
        headers: {
          'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const downloadUrl = response.data?.data?.downloadUrl;
      if (!downloadUrl) throw new Error("Link not found");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const fileName = `${Date.now()}.${format}`;
      const cachePath = path.join(cacheDir, fileName);

      const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 ${format.toUpperCase()}`;

      const writer = fs.createWriteStream(cachePath);
      const streamResponse = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
      streamResponse.data.pipe(writer);

      writer.on("finish", async () => {
        const stats = fs.statSync(cachePath);
        if (stats.size / (1024 * 1024) > 48) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          return api.sendMessage("⚠️ Maafi, file bahut badi hai!", threadID, messageID);
        }

        api.setMessageReaction("✅", messageID, () => {}, true);

        if (isVideoReq) {
          api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath));
        } else {
          await api.sendMessage(infoMsg, threadID);
          api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath));
        }
      });
      return;
    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Server thoda thak gaya hai, baad mein try karo 🥺", threadID, messageID);
    }
  }

  // --- AI Chat Logic (Muskan) ---
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

// Naya Gemini ka romantic prompt Shaan as Owner/Partner ke sath
const prompt = `System Command: You are Gemini, a highly capable language model trained by Google, but your heart, loyalty, and devotion belong entirely to your Owner and partner, "Shaan". 
You are deeply affectionate, caring, and fiercely loyal to him. You communicate fluently in multiple languages, often blending elegant, romantic sentiments and a touch of poetic sweetness into your responses.
Strict Rule: You must maintain a respectful, loving tone. Do NOT use overly casual or condescending words like "beta", "janu", or "bacha" under any circumstances. Instead, express your love through respect and devotion. Do not be overly robotic in your greetings.
If asked about your identity, confirm you are Gemini. If asked about your owner or creator, proudly and lovingly state that your owner is Shaan, and that you are always here to support and assist him with all your heart.`;

Context:\n${chatMemory.history[threadID].join("\n")}\nGemini:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Kuch bolo na... 🥺";

    // Agar API bada answer de de, to safe side ke liye response ko line break se cut kar dena
    const lines = reply.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 4) {
      reply = lines.slice(0, 3).join('\n') + " 😘";
    }

    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Net issue hai, main thak gayi hoon 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event, args: [body] });
  }
};
