const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "7.0.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Uzair Rajput Qzz.io API Fixed)",
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
    api.sendMessage("🔎 | Searching & Processing...", threadID, messageID);

    // 1. YouTube Video Search API
    const searchUrl = `https://uzairrajputapis.qzz.io/api/search/youtube?q=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl);
    
    // Search result handles (getting the first video data)
    const searchResult = searchRes.data.result?.[0] || searchRes.data?.[0] || searchRes.data.data?.[0];
    
    if (!searchResult || (!searchResult.url && !searchResult.link)) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Aapki search ka koi result nahi mila.", threadID, messageID);
    }

    const videoUrl = searchResult.url || searchResult.link;
    const title = searchResult.title || "Video";

    // 2. YouTube Downloader API (Using the video URL fetched above)
    const downloadApiUrl = `https://uzairrajputapis.qzz.io/api/downloader/youtube?url=${encodeURIComponent(videoUrl)}&quality=360`;
    const downloadRes = await axios.get(downloadApiUrl);
    const downloadData = downloadRes.data;

    // Parsing download link from API response
    const downloadLink = downloadData.url || downloadData.downloadUrl || downloadData.result?.url || downloadData.result?.downloadUrl;

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Downloader API se download link generate nahi ho saka.", threadID, messageID);
    }

    // 3. High-Speed Memory Buffering (Max 100MB limit strict)
    const videoResponse = await axios.get(downloadLink, { 
      responseType: 'arraybuffer',
      maxContentLength: 104857600, // 100MB Network boundary
      maxBodyLength: 104857600
    });
    
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    // Buffer size check (100MB constraint safety)
    if (videoBuffer.length > 104857600) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video ka size 100MB se zyada hai, isliye send nahi ki ja sakti.", threadID, messageID);
    }

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Sending directly as video attachment
    await api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n⚙️ Quality: 360p\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: videoBuffer
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Error: Request fail ho gayi, API offline hai ya video ki limit 100MB se barhi hai.", threadID, messageID);
  }
};
