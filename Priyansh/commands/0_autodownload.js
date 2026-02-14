const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "linkAutoDownload",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Detects links and downloads using arif-babu-downloader with original Shaan UI.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body } = event;
  
  // Link check logic
  if (!body || !body.toLowerCase().startsWith("https://")) return;

  try {
    const arif = require('arif-babu-downloader');

    // Reaction (Processing start)
    api.setMessageReaction("📿", messageID, () => {}, true);

    // Arif Babu Downloader API call
    const result = await arif.all(body); 
    
    if (result && result.status) {
        // High quality link ya normal url lena
        const videoUrl = result.data.high || result.data.url; 
        const title = result.data.title || "No Title";

        // Success Reaction
        api.setMessageReaction("✅", messageID, () => {}, true);

        const cachePath = __dirname + '/cache/auto.mp4';
        
        // Video file download karna
        const res = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(cachePath, Buffer.from(res.data, 'utf-8'));

        // Wahi Purana Message Style (Owner & Shaan)
        return api.sendMessage({
          body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
          attachment: fs.createReadStream(cachePath)
        }, threadID, messageID);
    }

  } catch (error) {
    console.error("Downloader Error:", error.message);
  }
};

module.exports.run = async function({ api, event, args }) {};
