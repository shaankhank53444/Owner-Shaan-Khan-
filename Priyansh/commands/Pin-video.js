module.exports.config = {
  name: "Pinterest",
  version: "0.0.3",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Pinterest search for pictures",
  commandCategory: "tools",
  usages: "pin <text> - <number>",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    const axios = require("axios");

    const input = args.join(" ").trim();
    if (!input) {
        return api.sendMessage("❌ Kripya search query dein!\nExample: pin Mahi name girls dpz - 6", event.threadID, event.messageID);
    }

    // Split query and number (e.g. text - 6)
    const parts = input.split("-");
    const query = parts[0].trim();
    const limit = parseInt(parts[1]) || 6;

    if (!query) {
        return api.sendMessage("❌ Missing search query!", event.threadID, event.messageID);
    }

    try {
        api.sendMessage("⏳ Images search ho rahi hain, kripya intezaar karein...", event.threadID, event.messageID);

        // API Request
        const apiUrl = `https://api.nexray.eu.cc/search/pinterest?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Extract image array from response (Adjusting based on common API schemas like data.result or data.data)
        const images = data.result || data.data || data.images || data;

        if (!Array.isArray(images) || images.length === 0) {
            return api.sendMessage("❌ Koi image nahi mili. Dusra keyword try karein.", event.threadID, event.messageID);
        }

        const imgStreams = [];
        const count = Math.min(limit, images.length);

        for (let i = 0; i < count; i++) {
            const imgUrl = images[i].url || images[i];
            if (typeof imgUrl === "string" && imgUrl.startsWith("http")) {
                const streamRes = await axios.get(imgUrl, { responseType: "stream" });
                imgStreams.push(streamRes.data);
            }
        }

        if (imgStreams.length === 0) {
            return api.sendMessage("❌ Images download karne mein fail ho gaye.", event.threadID, event.messageID);
        }

        var msg = {
            body: `「  PINTEREST SEARCH  」\n\nQuery: ${query}\nTotal: ${imgStreams.length}\n\n★᭄𝗖𝗿𝗲𝗱𝗶𝘁'𝘀 : 𓆩⃝𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡𓆩๏𓆪`,
            attachment: imgStreams
        };

        return api.sendMessage(msg, event.threadID, event.messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Kuch galat ho gaya! Kripya baad mein try karein.", event.threadID, event.messageID);
    }
};
