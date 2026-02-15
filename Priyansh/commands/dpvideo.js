const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "dpvideo",
  version: "15.0.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Image se video banayein (API Based)",
  commandCategory: "Media",
  usages: "dpvideo (reply to image)",
  cooldowns: 10
};

const SONG_LIST = [
  { name: "🎵 Tera Ban Jaunga", query: "Tera Ban Jaunga lyrical" },
  { name: "🎵 Tum Hi Ho", query: "Tum Hi Ho Aashiqui 2" },
  { name: "🎵 Kesariya", query: "Kesariya Brahmastra" },
  { name: "🎵 Perfect", query: "Perfect Ed Sheeran" },
  { name: "🎵 Believer", query: "Believer Imagine Dragons" }
];

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply, senderID } = event;

  if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Pehle ek image ko reply karein!", threadID, messageID);
  }

  const imageUrl = messageReply.attachments[0].url;
  let msg = "✨ *Ek song select karein:*\n\n";
  SONG_LIST.forEach((song, i) => msg += `${i + 1}. ${song.name}\n`);
  msg += "\n📌 *Number reply karein!*";

  return api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID,
      imageUrl: imageUrl
    });
  }, messageID);
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { body, threadID, messageID, senderID } = event;
  if (senderID != handleReply.author) return;

  const index = parseInt(body) - 1;
  if (isNaN(index) || index < 0 || index >= SONG_LIST.length) {
    return api.sendMessage("❌ Galat number!", threadID, messageID);
  }

  api.unsendMessage(handleReply.messageID);
  const selectedSong = SONG_LIST[index];
  
  api.sendMessage(`🎬 Video process ho rahi hai...\n🎵 Song: ${selectedSong.name}`, threadID);

  try {
    // Yahan hum ek external API use kar rahe hain jo image + audio ko mix karti hai
    // Note: Agar aapka apna FFmpeg server nahi hai, toh ye best method hai.
    const res = await axios.get(`https://api.samirxpider.me/api/video-maker?image=${encodeURIComponent(handleReply.imageUrl)}&query=${encodeURIComponent(selectedSong.query)}`);
    
    const videoUrl = res.data.videoUrl; // API response ke mutabiq change karein
    const videoPath = path.join(__dirname, "cache", `dp_${Date.now()}.mp4`);

    const videoStream = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(videoPath, Buffer.from(videoStream.data));

    return api.sendMessage({
      body: "✅ Aapki DP Video taiyar hai!",
      attachment: fs.createReadStream(videoPath)
    }, threadID, () => fs.unlinkSync(videoPath), messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: API ne response nahi diya ya link expire ho gaya.", threadID, messageID);
  }
};
