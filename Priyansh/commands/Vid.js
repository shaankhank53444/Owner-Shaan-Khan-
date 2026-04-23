module.exports.config = {
name: "vid",
version: "1.0.0",
hasPermssion: 0,
credits: "Uzair Rajput",
description: "Download video from API",
commandCategory: "media",
usages: "video ",
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

let apiUrl = `https://uzair-new-music-api.onrender.com/download/video?q=${encodeURIComponent(query)}`; api.sendMessage("⏳ Downloading video...", event.threadID, event.messageID); const response = await axios({ url: apiUrl, method: "GET", responseType: "arraybuffer" }); let filePath = __dirname + "/cache/video.mp4"; fs.writeFileSync(filePath, Buffer.from(response.data, "binary")); return api.sendMessage({ body: "✅ Here is your video", attachment: fs.createReadStream(filePath) }, event.threadID, () => fs.unlinkSync(filePath), event.messageID); 

} catch (e) {
console.log(e);
return api.sendMessage("❌ Error downloading video", event.threadID, event.messageID);
}
};