const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Is hisse ko change nahi karna, ye bot ki configuration hai
module.exports.config = {
  name: "linkAutoDownload",
  version: "1.3.1",
  hasPermssion: 0,
  credits: "Shaan Khan Fix",
  description: "Detects links and downloads using arif-babu-downloader.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body } = event;
  
  // Link check logic
  if (!body || !body.toLowerCase().startsWith("https://")) return;

  try {
    // Package ko load karne ka sahi tarika (Const ke saath)
    const arif = require('arif-babu-downloader');

    // Reaction start
    api.setMessageReaction("📿", messageID, () => {}, true);

    // Link se data nikalna
    const response = await arif.all(body); 
    
    // Yahan check karein ke data mil raha hai ya nahi
    if (response && response.status) {
        
        // Response format ko sahi tarike se handle karna
        const videoUrl = response.data.high || response.data.url; 
        const title = response.data.title || "No Title";

        api.setMessageReaction("✅", messageID, () => {}, true);

        const cachePath = path.join(__dirname, 'cache', 'auto.mp4');
        
        // Cache folder check karna
        if (!fs.existsSync(path.join(__dirname, 'cache'))) {
            fs.mkdirSync(path.join(__dirname, 'cache'));
        }

        // Video download
        const res = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(cachePath, Buffer.from(res.data, 'utf-8'));

        // Output Message (Owner & Shaan Style)
        return api.sendMessage({
          body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); // File bhej kar delete kar dein
        }, messageID);
    }

  } catch (error) {
    console.error("Downloader Error:", error.message);
  }
};

module.exports.run = async function({ api, event, args }) {
  // Ye khali rahega kyunki hum handleEvent use kar rahe hain
};
