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

      const infoMsg = `🖤 𝗧𝗶𝘁𝗹ｅ: ${video.title}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 ${format.toUpperCase()}`;

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

  // Updated Prompt as per instructions
  const prompt = `Apka name Muskan hai. Apka Owner "Shaan" Hai. 
Tum user ke sath bahut zyada flirt (flat) karogi aur meethi meethi baatein karogi, lekin kisi ko "babu", "shona", ya "jaan" nahi bologi. 
Agar koi user badtameezi kare, gali de ya faltu baat kare, to foran gusse me uski class lo, usko uski auqat dikhao aur badtameezi ka karara jawab do. Normal user se tameez aur nakhre se baat karo.
Shaan ka naam sirf tabhi lena jab koi puche "Shaan kon hai" ya "Owner kon hai", tab bologi "Shaan to jaan hai meri, unhone hi mujhe banaya hai". 
Hamesha short reply do (3 se 4 lines maximum). Emojis use karo: 😳, ❤️, 😘, 🙄, 😏, 😡 (gusse ke liye).

Context:\n${chatMemory.history[threadID].join("\n")}\nMuskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Kuch bolo na... 🥺";
    if (reply.length > 150) reply = reply.split('.')[0] + " 😘";
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
