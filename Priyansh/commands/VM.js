const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "1.2.2",
  // ... (baki config same rahegi)
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const input = args.join(" ");
  
  if (!input) return api.sendMessage("⚠️ Format: vm <song name> [video]", threadID, messageID);

  const isVideo = args.includes("video");
  const query = input.replace("video", "").trim();
  const loadingMsg = await api.sendMessage("🔍 Searching and downloading...", threadID);

  try {
    // Yahan ek stable API ka use karein (Example: yts API or similar)
    const res = await axios.get(`https://api.xyz.com/download?query=${encodeURIComponent(query)}&type=${isVideo ? 'video' : 'audio'}`);
    const { url, title } = res.data; 

    if (!url) return api.sendMessage("❌ Media nahi mila.", threadID, messageID);

    const filePath = path.join(__dirname, `/cache/${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
    const writer = fs.createWriteStream(filePath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });

    response.data.pipe(writer);

    writer.on('finish', async () => {
      await api.sendMessage({
        body: `🎵 ${title}\n\nDownloaded successfully!`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath));
      api.unsendMessage(loadingMsg.messageID);
    });

  } catch (err) {
    api.sendMessage("❌ Error: API response mein masla hai ya server busy hai.", threadID);
  }
};
