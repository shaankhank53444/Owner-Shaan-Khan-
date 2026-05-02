const axios = require("axios");

module.exports.config = {
  name: "gif",
  version: "1.0.0",
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

    const url = `https://rdx-api-zone.vercel.app/api/search/tenorGif?query=${encodeURIComponent(query)}&apikey=RDX-API-FREE-191852893`;

    const res = await axios.get(url);

    if (!res.data || !res.data.result || res.data.result.length === 0) {
      return api.sendMessage("❌ No GIF found!", event.threadID, event.messageID);
    }

    // Random GIF select
    const randomGif = res.data.result[Math.floor(Math.random() * res.data.result.length)];

    const gifUrl = randomGif.media[0].gif.url;

    // Send GIF
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
    console.error(error);
    return api.sendMessage("⚠️ Error fetching GIF!", event.threadID, event.messageID);
  }
};