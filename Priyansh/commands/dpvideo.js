const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "dpvideo",
  version: "15.0.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Image ko video banayein (Miss Aliya API)",
  commandCategory: "Media",
  usages: "dpvideo (reply to image)",
  cooldowns: 10,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

const SONG_LIST = [
  { name: "🎵 Tera Ban Jaunga", query: "Tera Ban Jaunga" },
  { name: "🎵 Tum Hi Ho", query: "Tum Hi Ho" },
  { name: "🎵 Kesariya", query: "Kesariya" },
  { name: "🎵 Perfect", query: "Perfect Ed Sheeran" },
  { name: "🎵 Believer", query: "Believer" }
];

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply, senderID } = event;

  if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Pehle ek image ko reply karein!", threadID, messageID);
  }

  const imageUrl = messageReply.attachments[0].url;
  let msg = "✨ *Kashmiri Music Video Maker* ✨\n" + "━".repeat(20) + "\n";
  SONG_LIST.forEach((song, i) => msg += `${i + 1}. ${song.name}\n`);
  msg += "━".repeat(20) + "\n📌 *Kisi bhi number ko reply karein!*";

  return api.sendMessage(msg, threadID, (err, info) => {
    if (err) return;
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
    return api.sendMessage("❌ Galat number! Sahi option select karein.", threadID, messageID);
  }

  const selectedSong = SONG_LIST[index];
  api.unsendMessage(handleReply.messageID);
  
  const waitMsg = await api.sendMessage(`🎬 Miss Aliya video bana rahi hai...\n🎵 Song: ${selectedSong.name}\n⏳ Sabr karein...`, threadID);

  try {
    // Yahan hum Miss Aliya ki official API use kar rahe hain
    const apiUrl = `https://api.ali-ya.repl.co/api/maker?url=${encodeURIComponent(handleReply.imageUrl)}&song=${encodeURIComponent(selectedSong.query)}`;
    
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    
    const videoPath = path.join(cacheDir, `dpvideo_${Date.now()}.mp4`);

    const response = await axios({
      method: 'GET',
      url: apiUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      api.unsendMessage(waitMsg.messageID);
      return api.sendMessage({
        body: `✅ Video Taiyar Hai!\n🎶 Song: ${selectedSong.name}\n👤 Credits: MISS ALIYA`,
        attachment: fs.createReadStream(videoPath)
      }, threadID, () => fs.unlinkSync(videoPath), messageID);
    });

    writer.on('error', (e) => {
      throw e;
    });

  } catch (error) {
    console.error(error);
    api.unsendMessage(waitMsg.messageID);
    api.sendMessage("❌ API ne response nahi diya. Ho sakta hai Miss Aliya ka server down ho.", threadID, messageID);
  }
};
