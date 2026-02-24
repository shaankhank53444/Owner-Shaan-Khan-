const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stalk",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Gemini AI",
    description: "Stable FB Info Fetcher (Built-in Method)",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    try {
      let targetID;
      
      // 1. ID nikalne ka logic
      if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else if (messageReply) {
        targetID = messageReply.senderID;
      } else if (args.length > 0) {
        // Agar link di hai toh ID extract karein
        targetID = args[0].includes("facebook.com") 
          ? (args[0].split("/").pop().split("?")[0] || args[0]) 
          : args[0];
      } else {
        targetID = senderID;
      }

      await api.sendMessage("🔍 Fetching data from Facebook...", threadID);

      // 2. Built-in api.getUserInfo ka use (No Key Needed)
      const userInfo = await api.getUserInfo(targetID);
      const user = userInfo[targetID];

      if (!user) {
        return api.sendMessage("❌ User data nahi mila. Shayad ID galat hai ya account deactivated hai.", threadID, messageID);
      }

      // 3. Profile Picture URL (High Resolution)
      const pfpUrl = `https://graph.facebook.com/${targetID}/picture?width=1500&height=1500`;
      const pfpPath = path.join(__dirname, "cache", `stalk_${targetID}.png`);

      // Data formatting
      const name = user.name || "N/A";
      const username = user.vanity || "None";
      const gender = user.gender == 2 ? "Male" : user.gender == 1 ? "Female" : "Unknown";
      const profileUrl = `https://www.facebook.com/${targetID}`;

      const msg = `👤 𝐍𝐚𝐦𝐞: ${name}\n` +
                  `🆔 𝐈𝐃: ${targetID}\n` +
                  `⚧️ 𝐆𝐞𝐧𝐝𝐞𝐫: ${gender}\n` +
                  `🔗 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${username}\n` +
                  `🌐 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐋𝐢𝐧𝐤: ${profileUrl}\n\n` +
                  `💡 *Note: Detailed info (Followers/Bio) ke liye token zaroori hota hai.*`;

      // Image download logic
      const imgResponse = await axios.get(pfpUrl, { responseType: "arraybuffer" });
      fs.outputFileSync(pfpPath, Buffer.from(imgResponse.data));

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(pfpPath)
      }, threadID, () => fs.unlinkSync(pfpPath), messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error: Data fetch karne mein masla aa raha hai. Link ya ID check karein.", threadID, messageID);
    }
  }
};
