const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "7.1.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Uzair API + 100MB Limit Fixed)",
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

    // 1. YouTube Search API Fix
    const searchUrl = `https://uzairrajputapis.qzz.io/api/search/youtube?q=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl);
    
    // Uzair API ke response objects ko dhyan me rakhte hue array extraction
    const searchResult = searchRes.data.result?.[0] || searchRes.data?.[0] || (searchRes.data.data && searchRes.data.data[0]);
    
    if (!searchResult) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Aapki search ka koi result nahi mila.", threadID, messageID);
    }

    const videoUrl = searchResult.url || searchResult.link || searchResult.videoUrl;
    const title = searchResult.title || "Video";

    // 2. YouTube Downloader API Fix (360p Lock)
    const downloadApiUrl = `https://uzairrajputapis.qzz.io/api/downloader/youtube?url=${encodeURIComponent(videoUrl)}&quality=360`;
    const downloadRes = await axios.get(downloadApiUrl);
    
    // Extracting link from exact API structure
    const downloadLink = downloadRes.data.url || downloadRes.data.downloadUrl || (downloadRes.data.result && downloadRes.data.result.url);

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Downloader API se download link nahi mil saka.", threadID, messageID);
    }

    // 3. 100MB Limit Tarika (Headers validation)
    const checkHeader = await axios.head(downloadLink).catch(() => null);
    if (checkHeader && checkHeader.headers['content-length']) {
      const fileSizeInBytes = checkHeader.headers['content-length'];
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

      // Agar video 100MB se barhi hai to yahin rok do
      if (fileSizeInMB > 100) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`⚠️ | Video size (${fileSizeInMB.toFixed(1)}MB) bohot zyada hai. Limit 100MB tak hai.`, threadID, messageID);
      }
    }

    // 4. High-Speed Stream Download (Memory Optimization for Big Files)
    const videoStream = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream',
      maxContentLength: 104857600, // 100MB Network boundary
      maxBodyLength: 104857600
    });

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Direct stream ko Facebook API par deliver kar rahe hain
    await api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n⚙️ Quality: 360p\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: videoStream.data
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Error: Uzair API offline hai ya file size 100MB se barha hai.", threadID, messageID);
  }
};
