module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.5.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Automatically downloads video from links and shows title.",
    commandCategory: "Utilities",
    usages: "[link]",
    cooldowns: 5,
  },

  onLoad: function () {
    const fs = require("fs");
    // Credit security check
    const fileData = fs.readFileSync(__filename, "utf8");
    if (!fileData.includes('credits: "Shaan Babu"')) {
      console.log("\n❌ ERROR: Credits have been changed! Module disabled. ❌\n");
      process.exit(1);
    }
  },

  run: async function ({ api, event, args }) {
    // Agar user command ke sath link bheje (.linkAutoDownload https://...)
    if (args[0] && args[0].startsWith("https://")) {
      return this.handleEvent({ api, event });
    }
    return api.sendMessage("Please send a valid link to download.", event.threadID);
  },

  handleEvent: async function ({ api, event }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const { alldown } = require("arif-babu-downloader");

    const body = (event.body || "").trim();
    
    // Sirf tab trigger hoga jab message sirf ek link ho
    if (!body.startsWith("http") || body.includes(" ")) return;

    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const data = await alldown(body);

      if (!data || !data.data || !data.data.high) {
        // Reaction hatao agar link kaam nahi kar raha
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return; 
      }

      const videoTitle = data.data.title || "No Title Found";
      const videoURL = data.data.high;
      const filePath = __dirname + `/cache/auto_${Date.now()}.mp4`;

      // Video download process
      const getVid = (await axios.get(videoURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(getVid, "utf-8"));

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      return api.sendMessage(
        {
          body: `✨❁ ━━ ━[ 𝑶𝑾𝑵𝑬𝑹 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => {
          // File delete after sending
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    }
  },
};
