const axios = require("axios");

module.exports.config = {
  name: "gif",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search GIF from Tenor via RDX API",
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

    // API URL with search query
    const url = `https://rdx-api-zone.vercel.app/api/search/tenorGif?query=${encodeURIComponent(query)}&apikey=RDX-API-FREE-191852893`;

    const res = await axios.get(url);

    // RDX API aksar 'results' ya 'result' key use karta hai
    const data = res.data.result || res.data.results;

    if (!data || data.length === 0) {
      return api.sendMessage(`❌ No GIF found for: ${query}`, event.threadID, event.messageID);
    }

    // Random GIF select karna
    const randomGif = data[Math.floor(Math.random() * data.length)];

    /* Tenor API structure check: 
       Kayi baar URL direct hota hai, aur kayi baar media[0].gif.url ke andar.
    */
    let gifUrl = "";
    if (randomGif.media && randomGif.media[0] && randomGif.media[0].gif) {
        gifUrl = randomGif.media[0].gif.url;
    } else {
        gifUrl = randomGif.url || randomGif.itemurl;
    }

    if (!gifUrl) {
      return api.sendMessage("❌ Could not extract GIF URL.", event.threadID, event.messageID);
    }

    // GIF download karke stream bhejna
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
    console.error("GIF_ERROR:", error);
    
    // Agar API Key galat ho ya limit khatam ho
    if (error.response && error.response.status === 403) {
        return api.sendMessage("⚠️ API Key invalid ya expire ho chuki hai.", event.threadID, event.messageID);
    }
    
    return api.sendMessage("⚠️ API server se connect nahi ho pa raha. Baad me try karein.", event.threadID, event.messageID);
  }
};
