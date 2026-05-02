const axios = require("axios");

module.exports.config = {
  name: "gimage",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Search images from Google",
  commandCategory: "search",
  usages: "[query]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const query = args.join(" ");
    
    if (!query) {
      return api.sendMessage("⚠️ Please enter a search query.", event.threadID, event.messageID);
    }

    const apiUrl = `http://rdx-api-zone.vercel.app/api/search/gimage?query=${encodeURIComponent(query)}`;

    const res = await axios.get(apiUrl);

    if (!res.data || !res.data.data || res.data.data.length === 0) {
      return api.sendMessage("❌ No images found.", event.threadID, event.messageID);
    }

    // Random image select
    const images = res.data.data;
    const randomImg = images[Math.floor(Math.random() * images.length)];

    // Send image
    return api.sendMessage({
      body: `🔍 Result for: ${query}`,
      attachment: await global.utils.getStreamFromURL(randomImg)
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error while fetching images.", event.threadID, event.messageID);
  }
};