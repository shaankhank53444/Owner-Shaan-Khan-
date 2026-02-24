/**
 * Stalk Command for Mirai Bot
 * Fixed API Key Version
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stalk",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Facebook user ki maloomat hasil karein (Fixed Key)",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // Aapki di hui Fixed API Key
    const apiKey = "Apim_SuwK8RNuEYSbj3frHMgkDIVUhPxfSpTbov_T3cYqRhA";
    const API_URL = "https://priyanshuapi.xyz/api/runner/fb-stalk/stalk";

    try {
      let userId;

      // Target ID maloom karne ka logic
      if (Object.keys(mentions).length > 0) {
        userId = Object.keys(mentions)[0];
      } else if (messageReply) {
        userId = messageReply.senderID;
      } else if (args.length > 0) {
        // Agar link hai to link use karein, warna ID
        userId = args[0];
      } else {
        userId = senderID;
      }

      const processing = await api.sendMessage("🔍 Data fetch ho raha hai, thora sabar karein...", threadID);

      // Payload taiyar karna (Link ya ID)
      const isLink = userId.toString().includes("facebook.com") || userId.toString().includes("fb.com");
      const payload = isLink ? { link: userId } : { userId: String(userId) };

      const res = await axios.post(API_URL, payload, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (!res.data || !res.data.success) {
        return api.sendMessage(`❌ Error: ${res.data?.message || "User nahi mila."}`, threadID, messageID);
      }

      const data = res.data.data;
      const cachePath = path.join(__dirname, "cache", `stalk_${Date.now()}.png`);

      // Cache folder check karna
      if (!fs.existsSync(path.join(__dirname, "cache"))) {
        fs.mkdirSync(path.join(__dirname, "cache"));
      }

      // Information text
      const infoMsg = `👤 𝐍𝐚𝐦𝐞: ${data.name || "N/A"}\n` +
                      `🆔 𝐈𝐃: ${data.userId || "N/A"}\n` +
                      `📛 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${data.username || "N/A"}\n` +
                      `🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "N/A"}\n` +
                      `⚤ 𝐆𝐞𝐧𝐝𝐞𝐫: ${data.gender || "N/A"}\n` +
                      `💑 𝐒𝐭𝐚𝐭𝐮𝐬: ${data.relationshipStatus || "N/A"}\n` +
                      `🏡 𝐇𝐨𝐦𝐞: ${data.hometown || "N/A"}\n` +
                      `👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.subscribersCount || "0"}`;

      // Profile Picture handle karna
      if (data.profilePictureUrl) {
        const imgRes = await axios.get(data.profilePictureUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(imgRes.data));

        api.unsendMessage(processing.messageID);
        
        return api.sendMessage({
          body: infoMsg,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
      } else {
        api.unsendMessage(processing.messageID);
        return api.sendMessage(infoMsg, threadID, messageID);
      }

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message;
      return api.sendMessage(`❌ Masla Aa Gaya: ${errorMsg}`, threadID, messageID);
    }
  }
};
