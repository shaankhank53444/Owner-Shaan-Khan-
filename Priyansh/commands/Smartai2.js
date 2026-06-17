const axios = require("axios");
const yts = require("yt-search");
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
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  return base.data.api;
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na, kya baat karni hai? 😘", threadID, messageID);

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
      const videoID = video.videoId;
      const format = isVideoReq ? "mp4" : "mp3";

      const diptoApi = await baseApiUrl();
      const { data } = await axios.get(`${diptoApi}/ytDl3?link=${videoID}&format=${format}&quality=360`);
      const downloadUrl = data.downloadLink;

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

  const prompt = `System Command: Tum Muskan ho, ek real aur cute larki. Sirf Roman Urdu mein bilkul natural baat karo, jaise hum aam zindgi mein karte hain.
Owner UID: 100016828397863
Shaan mera boyfriend hai ❤️
Rules: Baat chhoti rakho, sweet raho, naam baar baar mat lo, AI wali feeling na aaye.
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
