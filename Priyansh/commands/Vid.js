module.exports.config = {
  name: "vid",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Download video with 100MB limit check",
  commandCategory: "media",
  usages: "video [query/url]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs");

  try {
    let query = args.join(" ");
    if (!query) {
      return api.sendMessage("❌ Please enter URL or search query", event.threadID, event.messageID);
    }

    api.sendMessage("⏳ Checking file size...", event.threadID, event.messageID);

    let apiUrl = `https://uzair-new-music-api.onrender.com/download/video?q=${encodeURIComponent(query)}`;

    // 1. File size check karne ke liye request
    const checkHeader = await axios.head(apiUrl);
    const fileSizeInBytes = checkHeader.headers['content-length'];
    
    if (fileSizeInBytes) {
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
        
        // 100MB Limit Check
        if (fileSizeInMB > 100) {
          return api.sendMessage(`❌ File size bohot bada hai (${fileSizeInMB.toFixed(2)}MB). Maximum limit 100MB hai.`, event.threadID, event.messageID);
        }
    }

    // 2. Download process
    const response = await axios({
      url: apiUrl,
      method: "GET",
      responseType: "arraybuffer"
    });

    let filePath = __dirname + "/cache/video.mp4";
    fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

    // Size calculation for display
    const finalSize = (response.data.length / (1024 * 1024)).toFixed(2);

    return api.sendMessage({
      body: `✅ Video downloaded!\n📊 Size: ${finalSize} MB`,
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, event.messageID);

  } catch (e) {
    console.log(e);
    return api.sendMessage("❌ Error: Video download nahi ho saki. Shayad file 100MB se zyada hai ya API down hai.", event.threadID, event.messageID);
  }
};
