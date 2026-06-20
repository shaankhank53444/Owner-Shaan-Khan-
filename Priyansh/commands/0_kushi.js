const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "khushi",
  version: "17.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — Short AI + Fixed Video/Audio Downloader",
  commandCategory: "ai",
  usages: "khushi <message | song/video name>",
  cooldowns: 2
};

const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube"; 
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;
  let cleanedMsg = (body || "").replace(/^khushi[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na jaanu, kya chahiye? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq) {
    let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play/gi, "").trim();
    if (!query) return api.sendMessage("Jaanu naam to batao kya download karun? 🥺", threadID, messageID);

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const searchRes = await axios.get(YT_SEARCH, { params: { q: query } });
      const video = searchRes.data?.result?.[0];
      if (!video) return api.sendMessage("Maafi jaanu, ye video nahi mili 🥺", threadID, messageID);

      const apiUrl = isVideoReq ? VIDEO_API : AUDIO_API;
      const downloadRes = await axios.post(apiUrl, { url: video.url });
      const downloadUrl = downloadRes.data?.result?.download_url || downloadRes.data?.result?.url || downloadRes.data?.result?.video;

      if (!downloadUrl) return api.sendMessage("Jaanu link nahi mila, server busy hai 🥺", threadID, messageID);

      const ext = isVideoReq ? "mp4" : "mp3";
      const filePath = `${__dirname}/cache/${senderID}_${Date.now()}.${ext}`;
      
      const writer = fs.createWriteStream(filePath);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
      res.data.pipe(writer);

      writer.on("finish", async () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        await api.sendMessage({
          body: `${OWNER_TAG}\n\n🎵 𝑻𝒊𝒕𝒍𝒆: ${video.title}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 ${ext.toUpperCase()} tayar hai! 💖`,
          attachment: fs.createReadStream(filePath)
        }, threadID);
        fs.unlinkSync(filePath);
      });
    } catch (e) {
      api.sendMessage("Net issue hai baby, main thak gayi hoon 🥺", threadID, messageID);
    }
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  if (event.body?.toLowerCase().startsWith("khushi")) this.run({ api, event });
};
