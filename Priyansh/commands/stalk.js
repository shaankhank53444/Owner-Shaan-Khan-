/**
 * Stalk Command for Mirai Bot
 * Updated with New API Key
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stalk",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Facebook user ki maloomat hasil karein (New Key)",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // Nayi Updated API Key
    const apiKey = "Apim_kyvptvZepZ2CEvb3hVqLV9jWFy7kZv3OAhPyM9j500U";
    const API_URL = "https://priyanshuapi.xyz/api/runner/fb-stalk/stalk";

    try {
      let userId;

      // Target ID maloom karne ka logic
      if (Object.keys(mentions).length > 0) {
        userId = Object.keys(mentions)[0];
      } else if (messageReply) {
        userId = messageReply.senderID;
      } else if (args.length > 0) {
        userId = args[0];
      } else {
        userId = senderID;
      }

      const processing = await api.sendMessage("🔍 Nayi Key se data fetch ho raha hai...", threadID);

      const isLink = userId.toString().includes("facebook.com") || userId.toString().includes("fb.com");
      const payload = isLink ? { link: userId } : { userId: String(userId) };

      const res = await axios.post(API_URL, payload, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000 // Thora zyada time diya hai slow network ke liye
      });

      if (!res.data || !res.data.success) {
        api.unsendMessage(processing.messageID);
        return api.sendMessage(`❌ API Error: ${res.data?.message || "User details nahi mil sakin."}`, threadID, messageID);
      }

      const data = res.data.data;
      const cacheDir = path.join(__dirname, "cache");
      const cachePath = path.join(cacheDir, `stalk_${Date.now()}.png`);

      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const infoMsg = `👤 𝐍𝐚𝐦𝐞: ${data.name || "N/A"}\n` +
                      `🆔 𝐈𝐃: ${data.userId || "N/A"}\n` +
                      `📛 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${data.username || "N/A"}\n` +
                      `🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "N/A"}\n` +
                      `⚤ 𝐆𝐞𝐧𝐝𝐞𝐫: ${data.gender || "N/A"}\n` +
                      `💑 𝐒𝐭𝐚𝐭𝐮𝐬: ${data.relationshipStatus || "N/A"}\n` +
                      `🏡 𝐇𝐨𝐦𝐞: ${data.hometown || "N/A"}\n` +
                      `👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.subscribersCount || "0"}`;

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
      api.unsendMessage(processing?.messageID).catch(() => {});
      const errorMsg = err.response?.data?.message || err.message;
      return api.sendMessage(`❌ Masla Aa Gaya: ${errorMsg}\n(Check karein agar API limit khatam ho gayi hai)`, threadID, messageID);
    }
  }
};
