module.exports.config = {
  name: "Pinterest",
  version: "0.0.4",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Pinterest search for DPs/Images or download Videos",
  commandCategory: "tools",
  usages: "pin dpz <text> - <number> OR pin video <pinterest_url>",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    const axios = require("axios");

    const action = args[0] ? args[0].toLowerCase() : "";

    if (!action) {
        return api.sendMessage(
            "❌ Sahi tareeqa istemal karein:\n\n1. Dpz ke liye:\npin dpz Mahi name girls dpz - 6\n\n2. Video ke liye:\npin video https://pin.it/6z8TIEFvz", 
            event.threadID, 
            event.messageID
        );
    }

    // --- PINTEREST VIDEO DOWNLOADER ---
    if (action === "video") {
        const pinUrl = args[1];
        if (!pinUrl || !pinUrl.startsWith("http")) {
            return api.sendMessage("❌ Kripya valid Pinterest video link dein!\nExample: pin video https://pin.it/6z8TIEFvz", event.threadID, event.messageID);
        }

        try {
            api.sendMessage("⏳ Video download ho rahi hai, kripya intezaar karein...", event.threadID, event.messageID);

            const apiUrl = `https://api.nexray.eu.cc/downloader/pinterest?url=${encodeURIComponent(pinUrl)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            // API response structure handle karne ke liye (data.url, data.result, etc.)
            const videoUrl = data.url || data.result || data.data || data.video;

            if (!videoUrl) {
                return api.sendMessage("❌ Video link fetch nahi ho saka. Dusra link try karein.", event.threadID, event.messageID);
            }

            const videoStream = await axios.get(videoUrl, { responseType: "stream" });

            var msg = {
                body: `「  PINTEREST VIDEO  」\n\n★᭄𝗖𝗿𝗲𝗱𝗶𝘁'𝘀 : 𓆩⃝𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡𓆩๏𓆪`,
                attachment: videoStream.data
            };

            return api.sendMessage(msg, event.threadID, event.messageID);

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Video download karne mein error aa gaya! Kripya dobara try karein.", event.threadID, event.messageID);
        }
    }

    // --- PINTEREST DPZ / IMAGES SEARCH ---
    else if (action === "dpz" || action === "pic" || action === "search") {
        const queryArgs = args.slice(1).join(" ").trim();
        if (!queryArgs) {
            return api.sendMessage("❌ Search query missing hai!\nExample: pin dpz Mahi name girls dpz - 6", event.threadID, event.messageID);
        }

        const parts = queryArgs.split("-");
        const query = parts[0].trim();
        const limit = parseInt(parts[1]) || 6;

        if (!query) {
            return api.sendMessage("❌ Query text theek se enter karein!", event.threadID, event.messageID);
        }

        try {
            api.sendMessage("⏳ Images search ho rahi hain, kripya intezaar karein...", event.threadID, event.messageID);

            const apiUrl = `https://api.nexray.eu.cc/search/pinterest?q=${encodeURIComponent(query)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            // Response se image list nikalna
            const images = data.result || data.data || data.images || data;

            if (!Array.isArray(images) || images.length === 0) {
                return api.sendMessage("❌ Is keyword par koi image nahi mili.", event.threadID, event.messageID);
            }

            const imgStreams = [];
            const count = Math.min(limit, images.length);

            for (let i = 0; i < count; i++) {
                const imgUrl = images[i].url || images[i].image || images[i];
                if (typeof imgUrl === "string" && imgUrl.startsWith("http")) {
                    try {
                        const streamRes = await axios.get(imgUrl, { responseType: "stream" });
                        imgStreams.push(streamRes.data);
                    } catch (err) {
                        // Agar koi ek image fail ho toh baaki download ho jayein
                    }
                }
            }

            if (imgStreams.length === 0) {
                return api.sendMessage("❌ Images download karne mein fail ho gaye.", event.threadID, event.messageID);
            }

            var msg = {
                body: `「  PINTEREST DPZ  」\n\nQuery: ${query}\nTotal: ${imgStreams.length}\n\n★᭄𝗖𝗿𝗲𝗱𝗶𝘁'𝘀 : 𓆩⃝𝗦𝗛𝑨𝗔𝗡 𝗞𝗛𝗔𝗡𓆩๏𓆪`,
                attachment: imgStreams
            };

            return api.sendMessage(msg, event.threadID, event.messageID);

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Search API hit karne mein error aa gaya! Kripya baad mein try karein.", event.threadID, event.messageID);
        }
    } 
    else {
        return api.sendMessage("❌ Invalid command usage!\nUse:\n- pin dpz <text> - <number>\n- pin video <url>", event.threadID, event.messageID);
    }
};
