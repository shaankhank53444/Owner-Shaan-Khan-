const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stalk",
    version: "1.0.3",
    hasPermssion: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Facebook user info fetcher",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // Updated Key
    const apiKey = "Apim_kyvptvZepZ2CEvb3hVqLV9jWFy7kZv3OAhPyM9j500U";
    
    try {
      let targetID;
      if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
      else if (messageReply) targetID = messageReply.senderID;
      else if (args.length > 0) targetID = args[0];
      else targetID = senderID;

      // Agar link hai toh usse ID nikalne ki koshish (Simple cleaning)
      if (targetID.includes("facebook.com")) {
        // Link handling logic agar API direct link support na kare
      }

      await api.sendMessage("🔍 Fetching data... Please wait.", threadID);

      // API Call - Maine yahan GET request try ki hai jo zyada stable hoti hai
      const res = await axios.get(`https://priyanshuapi.xyz/api/runner/fb-stalk/stalk`, {
        params: { 
            userId: targetID,
            apikey: apiKey // Kuch APIs query mein key mangti hain
        },
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!res.data || !res.data.success) {
        return api.sendMessage(`❌ API Response: ${res.data?.message || "Data nahi mila."}`, threadID, messageID);
      }

      const data = res.data.data;
      const msg = `👤 𝐍𝐚𝐦𝐞: ${data.name || "N/A"}\n🆔 𝐈𝐃: ${data.userId}\n🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "Secret"}\n👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.subscribersCount || "0"}\n🏡 𝐇𝐨𝐦𝐞: ${data.hometown || "N/A"}`;

      if (data.profilePictureUrl) {
        const cachePath = path.join(__dirname, "cache", `pfp_${targetID}.png`);
        const img = await axios.get(data.profilePictureUrl, { responseType: "arraybuffer" });
        fs.outputFileSync(cachePath, Buffer.from(img.data));

        return api.sendMessage({ body: msg, attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath), messageID);
      } else {
        return api.sendMessage(msg, threadID, messageID);
      }

    } catch (err) {
      console.error(err);
      return api.sendMessage(`❌ Error: API server response nahi de raha.`, threadID, messageID);
    }
  }
};
