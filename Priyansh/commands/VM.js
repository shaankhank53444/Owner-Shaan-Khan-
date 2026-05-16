const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (No MB Limit - Ultra Fast)",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name.", threadID, messageID);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🔎 | Processing video (No Limit Mode)...", threadID, messageID);

    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    api.setMessageReaction("🚀", messageID, () => {}, true);

    // METHOD 1: Direct URL Upload (Bypasses 25MB limit & Instant send)
    try {
      await api.sendMessage({
        body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
        attachment: {
          /* Facebook is link se direct video stream karega bina bot ko involve kiye */
          url: downloadLink 
        }
      }, threadID, messageID);
      
      api.setMessageReaction("✅", messageID, () => {}, true);
      return; // Agar Method 1 chal gaya to yahin ruk jaye

    } catch (urlError) {
      console.log("Direct URL upload failed, trying backup buffer method...");
      
      // METHOD 2: Backup Buffer Method (Agar direct link accept na ho)
      const videoRes = await axios({
        method: 'get',
        url: downloadLink,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'video/mp4,video/*;q=0.9'
        }
      });

      const videoBuffer = Buffer.from(videoRes.data);
      videoBuffer.path = `${Date.now()}.mp4`;

      await api.sendMessage({
        body: `✅ Downloaded Successfully (Backup Mode)!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
        attachment: videoBuffer
      }, threadID, messageID);
      
      api.setMessageReaction("✅", messageID, () => {}, true);
    }

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Error: Video zyada bari hai ya link expiring hai.", threadID, messageID);
  }
};
