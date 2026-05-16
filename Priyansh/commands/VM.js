const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "6.2.0", // Updated version for optimization
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Super Fast Memory Buffer)",
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
    
    // Ek hi message mein info de rahe hain taake API calls kam hon
    const infoMessage = await api.sendMessage("🔎 | Searching & Processing fast...", threadID, messageID);

    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    // Direct RAM memory buffer mein high speed download
    const videoRes = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'arraybuffer', // High-speed binary fetching
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'video/mp4,video/*;q=0.9'
      },
      timeout: 45000 // 45 seconds timeout taake stuck na ho
    });

    // Buffer ko readable stream ki shakal mein convert karna bina save kiye
    const videoBuffer = Buffer.from(videoRes.data);
    
    // Facebook API direct buffer stream ko support karti hai extension batane par
    videoBuffer.path = `${Date.now()}.mp4`; 

    api.setMessageReaction("✅", messageID, () => {}, true);

    await api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: videoBuffer
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Speed Error: Ya to video size 25MB se zyada hai ya server slow hai.", threadID, messageID);
  }
};
