/**
 * Stalk Command for Mirai Bot
 * Author: 𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stalk",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Facebook user ki maloomat hasil karein",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    try {
      let userId;

      // Target ID maloom karna
      if (Object.keys(mentions).length > 0) {
        userId = Object.keys(mentions)[0];
      } else if (messageReply) {
        userId = messageReply.senderID;
      } else if (args.length > 0) {
        userId = args[0];
      } else {
        userId = senderID;
      }

      const processing = await api.sendMessage("🔍 Maloomat nikaali ja rahi hai, intezar karein...", threadID);

      // API Key check (config.json se ya direct)
      const apiKey = global.config?.apiKeys?.priyanshuApi || "YOUR_KEY_HERE";
      const API_URL = `https://priyanshuapi.xyz/api/runner/fb-stalk/stalk`;

      const res = await axios.post(API_URL, { userId: String(userId) }, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      if (!res.data.success) {
        return api.sendMessage("❌ User nahi mila ya API mein masla hai.", threadID, messageID);
      }

      const data = res.data.data;
      const callback = () => api.sendMessage({
        body: `👤 𝐍𝐚𝐦𝐞: ${data.name || "N/A"}\n🆔 𝐈𝐃: ${data.userId || "N/A"}\n📛 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${data.username || "N/A"}\n🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "N/A"} \n⚤ 𝐆𝐞𝐧𝐝𝐞𝐫: ${data.gender || "N/A"}\n💑 𝐒𝐭𝐚𝐭𝐮𝐬: ${data.relationshipStatus || "N/A"}\n🏡 𝐇𝐨𝐦𝐞: ${data.hometown || "N/A"}\n👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.subscribersCount || "0"}`,
        attachment: fs.createReadStream(__dirname + "/cache/stalk.png")
      }, threadID, () => fs.unlinkSync(__dirname + "/cache/stalk.png"), messageID);

      // Profile Picture download karna
      if (data.profilePictureUrl) {
        const img = (await axios.get(data.profilePictureUrl, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(__dirname + "/cache/stalk.png", Buffer.from(img, "utf-8"));
        api.unsendMessage(processing.messageID);
        return callback();
      } else {
        api.unsendMessage(processing.messageID);
        return api.sendMessage("Maloomat mil gayi magar DP nahi mili.", threadID, messageID);
      }

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error: API respond nahi kar rahi.", threadID, messageID);
    }
  }
};
