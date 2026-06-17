const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Priyanshu API Media Downloader",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana maangein>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const SEARCH_API = "https://uzairrajputapis.qzz.io/api/search/youtube?q=";
const DOWNLOAD_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";
const MP3_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na, kya baat karni hai? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq) {
    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      
      const searchRes = await axios.get(`${SEARCH_API}${encodeURIComponent(query)}`);
      const video = searchRes.data?.data?.[0];
      if (!video) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi, ye video ya song nahi mila 🥺💔", threadID, messageID);
      }

      const format = isVideoReq ? "mp4" : "mp3";
      const apiUrl = isVideoReq ? DOWNLOAD_API : MP3_API;
      const response = await axios.get(`${apiUrl}?url=${encodeURIComponent(video.url)}`);
      
      const downloadUrl = response.data?.data?.download || response.data?.data?.url;
      if (!downloadUrl) throw new Error("Link not found");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const cachePath = path.join(cacheDir, `${Date.now()}.${format}`);

      const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n👤 𝗔𝘂𝘁𝗵𝗼𝗿: ${video.author}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 ${format.toUpperCase()}`;

      const writer = fs.createWriteStream(cachePath);
      const streamResponse = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
      streamResponse.data.pipe(writer);

      writer.on("finish", async () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath));
      });
      return;
    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Server thoda thak gaya hai, baad mein try karo 🥺", threadID, messageID);
    }
  }

  // --- AI Chat Logic (Muskan) ---
  let userName = "User";
  try {
    const userInfo = await api.getUserInfo(senderID);
    if (userInfo && userInfo[senderID]) userName = userInfo[senderID].name || "User";
  } catch (err) {}

  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `System Command: Tum Muskan ho... [Tumhara AI Prompt yahan hai] ... Context: ${chatMemory.history[threadID].join("\n")} Muskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Hmmm... 🥺";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Mera net thoda slow chal raha hai, baad mein baat karte hain 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event });
  }
};
