const axios = require("axios");

module.exports.config = {
  name: "gif",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search GIF from Tenor API",
  commandCategory: "media",
  usages: "[search text]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("⚠️ Please enter something to search GIF.", event.threadID, event.messageID);
    }

    // Is URL ko check karein ki apikey valid hai ya nahi
    const url = `https://rdx-api-zone.vercel.app/api/search/tenorGif?query=${encodeURIComponent(query)}&apikey=RDX-API-FREE-191852893`;

    const res = await axios.get(url);
    
    // Debugging: Console check karein agar error aaye
    const results = res.data.result || res.data.results || res.data.data;

    if (!results || results.length === 0) {
      return api.sendMessage("❌ No GIF found for your search!", event.threadID, event.messageID);
    }

    // Random GIF select
    const randomGif = results[Math.floor(Math.random() * results.length)];

    // API structure ke hisaab se URL nikalna
    // Kuch APIs me structure: item.media[0].gif.url hota hai, kuch me direct item.url
    const gifUrl = randomGif.media ? randomGif.media[0].gif.url : randomGif.url;

    if (!gifUrl) {
      return api.sendMessage("❌ GIF URL not found in API response.", event.threadID, event.messageID);
    }

    const attachment = await axios({
      url: gifUrl,
      method: "GET",
      responseType: "stream"
    });

    return api.sendMessage({
      body: `✨ Result for: ${query}`,
      attachment: attachment.data
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error("GIF Error:", error.response ? error.response.data : error.message);
    return api.sendMessage("⚠️ API Server busy or invalid key!", event.threadID, event.messageID);
  }
};
