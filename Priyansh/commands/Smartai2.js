const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.3",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Fixed API Downloader",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana maangein>",
  cooldowns: 5
};

const SEARCH_API = "https://uzairrajputapis.qzz.io/api/search/youtube?q=";
const DOWNLOAD_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";
const MP3_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq) {
    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      
      const searchRes = await axios.get(`${SEARCH_API}${encodeURIComponent(query)}`);
      // API response structure check
      const video = searchRes.data?.data?.[0] || searchRes.data?.results?.[0];
      
      if (!video) return api.sendMessage("Babu, ye gaana ya video nahi mila, kuch aur try karein? 🥺", threadID, messageID);

      const downloadEndpoint = isAudioReq ? MP3_API : DOWNLOAD_API;
      const downloadRes = await axios.get(`${downloadEndpoint}?url=${encodeURIComponent(video.url)}`);
      
      // Dynamic link extractor
      const downloadUrl = downloadRes.data?.data?.download || downloadRes.data?.data?.url || downloadRes.data?.url || downloadRes.data?.result;
      
      if (!downloadUrl) throw new Error("Link nahi mila");

      const format = isAudioReq ? "mp3" : "mp4";
      const cachePath = path.join(__dirname, "cache", `${Date.now()}.${format}`);
      if (!fs.existsSync(path.dirname(cachePath))) fs.mkdirSync(path.dirname(cachePath), { recursive: true });

      const writer = fs.createWriteStream(cachePath);
      const streamRes = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
      streamRes.data.pipe(writer);

      writer.on("finish", async () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        const infoMsg = `🖤 ${video.title}\n\n🥀 Ye lo tumhari demand!`;
        api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath));
      });

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("Babu, server response nahi de raha, shayad API down hai. 🥺", threadID, messageID);
    }
    return;
  }
  // Yahan AI logic continue hogi...
};
