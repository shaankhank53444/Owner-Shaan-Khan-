const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "dpvideo",
  version: "14.0.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "DP video with song selection",
  commandCategory: "Media",
  usages: "dpvideo - Reply to image",
  prefix: true,
  cooldowns: 20
};

// 🎵 Song List
const SONG_LIST = [
  { name: "🎵 Tera Ban Jaunga", url: "Tera Ban Jaunga" },
  { name: "🎵 Tum Hi Ho", url: "Tum Hi Ho" },
  { name: "🎵 Kesariya", url: "Kesariya" },
  { name: "🎵 Perfect", url: "Perfect Ed Sheeran" },
  { name: "🎵 Believer", url: "Believer Imagine Dragons" }
];

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply } = event;

  if (!messageReply) {
    return api.sendMessage("❌ Pehle kisi image ko reply karo!", threadID, messageID);
  }

  if (!messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Reply ki gayi message mein koi image nahi hai!", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Sirf image ko reply karo!", threadID, messageID);
  }

  const imageUrl = attachment.url;

  // Show song list logic as per your original file
  if (args.length === 0) {
    let songListMsg = "✨ *Konsa song chahiye?*\n\n";
    SONG_LIST.forEach((song, index) => {
      songListMsg += `${index + 1}. ${song.name}\n`;
    });
    songListMsg += "\n📌 *Ab inme se kisi bhi number ko reply karo!*";
    
    return api.sendMessage(songListMsg, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply = global.client.handleReply || [];
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        imageUrl: imageUrl,
        type: "selectSong"
      });
    }, messageID);
  }

  const songIndex = parseInt(args[0]) - 1;
  if (!isNaN(songIndex) && songIndex >= 0 && songIndex < SONG_LIST.length) {
    const selectedSong = SONG_LIST[songIndex];
    await processVideo(api, event, threadID, messageID, imageUrl, selectedSong);
  } else {
    return api.sendMessage("❌ Galat number! 1 se " + SONG_LIST.length + " ke beech mein choose karo.", threadID, messageID);
  }
};

// 📥 Handle Reply Logic (Logical flow preserved)
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { body, threadID, messageID, senderID } = event;
  if (senderID != handleReply.author) return;

  const index = parseInt(body) - 1;
  if (isNaN(index) || index < 0 || index >= SONG_LIST.length) {
    return api.sendMessage("❌ Galat number!", threadID, messageID);
  }

  const selectedSong = SONG_LIST[index];
  api.unsendMessage(handleReply.messageID);
  
  await processVideo(api, event, threadID, messageID, handleReply.imageUrl, selectedSong);
};

// 🎬 Video processing function (Fixed without yt-dlp/ffmpeg)
async function processVideo(api, event, threadID, messageID, imageUrl, selectedSong) {
  const processingMsg = await api.sendMessage(
    `🎬 Video bana rahi hu...\n🎵 Song: ${selectedSong.name}\n⏳ Please wait...`,
    threadID
  );

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `dp_${Date.now()}.mp4`);

    // Miss Aliya API endpoint logic
    const apiUrl = `https://api.ali-ya.repl.co/api/maker?url=${encodeURIComponent(imageUrl)}&song=${encodeURIComponent(selectedSong.url)}`;

    const response = await axios({
      method: 'GET',
      url: apiUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      api.unsendMessage(processingMsg.messageID);
      return api.sendMessage({
        body: `✅ Aapki video taiyar hai!`,
        attachment: fs.createReadStream(videoPath)
      }, threadID, () => fs.unlinkSync(videoPath), messageID);
    });

    writer.on('error', () => {
       api.sendMessage("❌ Video save karne mein error aaya.", threadID, messageID);
    });

  } catch (e) {
    console.log(e);
    api.sendMessage("❌ API response nahi de rahi, thodi der baad try karein.", threadID, messageID);
  }
}
