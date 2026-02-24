const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stalk",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Priyansh/Gemini",
    description: "Facebook user info fetcher (Multiple API fallback)",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    let targetID;
    if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
    else if (messageReply) targetID = messageReply.senderID;
    else if (args.length > 0) targetID = args[0];
    else targetID = senderID;

    // Link se ID nikalne ka simple tarika
    if (targetID.includes("facebook.com")) {
        targetID = targetID.split("/").pop().replace(/\?.*/, ""); 
    }

    await api.sendMessage("🔍 Fetching Facebook data... Please wait.", threadID);

    // List of APIs to try (Bina key wali ya public APIs)
    const apiEndpoints = [
      `https://graph.facebook.com/${targetID}/picture?width=500&height=500&redirect=false`, // Basic PFP
      `https://api.vyturex.com/facebook/stalk?id=${targetID}`, // Public API 1
      `https://joshweb.click/facebook/stalk?id=${targetID}`    // Public API 2
    ];

    try {
      // API call (Example using a common public endpoint)
      const res = await axios.get(`https://smv-api.vercel.app/api/fb-stalk?id=${targetID}`);
      const data = res.data;

      if (!data || data.error) {
         throw new Error("Primary API failed");
      }

      const msg = `👤 𝐍𝐚𝐦𝐞: ${data.name || "Not Found"}\n` +
                  `🆔 𝐈𝐃: ${targetID}\n` +
                  `🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "Private"}\n` +
                  `👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.followers || "N/A"}\n` +
                  `🏡 𝐇𝐨𝐦𝐞: ${data.hometown || "N/A"}\n` +
                  `🔗 𝐋𝐢𝐧𝐤: https://facebook.com/${targetID}`;

      // Profile Picture Handling
      const pfpUrl = `https://graph.facebook.com/${targetID}/picture?width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const cachePath = path.join(__dirname, "cache", `${targetID}.png`);
      
      const imgRes = await axios.get(pfpUrl, { responseType: "arraybuffer" });
      fs.outputFileSync(cachePath, Buffer.from(imgRes.data));

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (err) {
      console.error(err);
      // Agar sab fail ho jaye toh sirf basic link aur photo bhej do
      const basicPfp = `https://graph.facebook.com/${targetID}/picture?width=500`;
      return api.sendMessage(`❌ Detailed info nahi mil saki (API Down).\n🔗 Profile Link: https://facebook.com/${targetID}`, threadID, messageID);
    }
  }
};
