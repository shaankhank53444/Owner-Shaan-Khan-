const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Configuration Constants
const API_KEY = "apim_YB6fj3ZggkCWp07bQoT1kULoSV2bfdl6mzn8gqJkJGs"; 
const BASE_URL = "https://priyanshuapi.qzz.io";

module.exports.config = {
  name: "song",
  version: "1.0.0",
  hasPermssion: 0, // Mirai standard permission format
  credits: "Shaan Khan",
  description: "Download audio from YouTube",
  commandCategory: "UTILITY",
  usages: "[song name or link]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Please provide a song name or YouTube link!", threadID, messageID);
  }

  let waitMsg;
  try {
    waitMsg = await api.sendMessage("✅ Apki Request Jari Hai please wait...", threadID, messageID);

    let videoUrl = query;

    // Logic: Search if not a direct link
    if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
      const searchRes = await axios.get(`${BASE_URL}/api/search/youtube`, {
        params: { q: query, apikey: API_KEY }
      });

      // Robust parsing of search results
      const searchData = searchRes.data.result || searchRes.data.data || searchRes.data;
      const video = Array.isArray(searchData) ? searchData[0] : (searchData.items ? searchData.items[0] : searchData);

      if (!video || (!video.url && !video.link)) {
        if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
        return api.sendMessage("❌ Could not find any results for your search.", threadID, messageID);
      }
      videoUrl = video.url || video.link;
    }

    // Logic: Download the MP3
    const downloadRes = await axios.get(`${BASE_URL}/api/downloader/ytmp3`, {
      params: { url: videoUrl, apikey: API_KEY }
    });

    const audioData = downloadRes.data.result || downloadRes.data.data || downloadRes.data;
    
    // Checking for multiple possible download link keys from the API
    const downloadLink = audioData.download_url || audioData.link || audioData.audio || audioData.url;
    const title = audioData.title || "audio";

    if (!downloadLink) {
      if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
      return api.sendMessage("⚠️ Failed to generate download link. The API might be down or key is invalid.", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const cachePath = path.join(cacheDir, `${Date.now()}_song.mp3`);

    // Download file to cache
    const response = await axios.get(downloadLink, { responseType: "arraybuffer" });
    fs.writeFileSync(cachePath, Buffer.from(response.data));

    if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);

    // Send the file
    return api.sendMessage({
      body: `🖤 Title: ${title}\n\n━━━━━━━━━━━━━\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉SONG`,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }, messageID);

  } catch (error) {
    if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
    console.error(`Error in song command:`, error);
    return api.sendMessage(`⚠️ Server respond nahi kar raha ya API Key invalid hai!`, threadID, messageID);
  }
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;

  // Detect if message starts with 'song ' (no prefix mode)
  if (body.toLowerCase().startsWith("song ")) {
    const args = body.split(" ").slice(1);
    return this.run({ api, event, args });
  }
};
