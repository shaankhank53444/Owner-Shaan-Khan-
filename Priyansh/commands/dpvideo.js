const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports.config = {
  name: "dpvideo",
  version: "14.1.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Image ko video mein badle song ke saath",
  commandCategory: "Media",
  usages: "dpvideo (reply to image)",
  cooldowns: 10
};

const SONG_LIST = [
  { name: "🎵 Tera Ban Jaunga", query: "ytsearch1:Tera Ban Jaunga lyrical" },
  { name: "🎵 Tum Hi Ho", query: "ytsearch1:Tum Hi Ho Aashiqui 2" },
  { name: "🎵 Kesariya", query: "ytsearch1:Kesariya Brahmastra" },
  { name: "🎵 Perfect", query: "ytsearch1:Perfect Ed Sheeran" },
  { name: "🎵 Believer", query: "ytsearch1:Believer Imagine Dragons" }
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
    return api.sendMessage("❌ Galat number! Sahi option chunein.", threadID, messageID);
  }

  api.unsendMessage(handleReply.messageID);
  const selectedSong = SONG_LIST[index];
  
  // Call processing function
  await processVideo(api, threadID, messageID, handleReply.imageUrl, selectedSong);
};

async function processVideo(api, threadID, messageID, imageUrl, selectedSong) {
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const imgPath = path.join(cacheDir, `img_${Date.now()}.jpg`);
  const audioPath = path.join(cacheDir, `aud_${Date.now()}.m4a`);
  const outPath = path.join(cacheDir, `vid_${Date.now()}.mp4`);

  const waitMsg = await api.sendMessage(`🎬 Video ban rahi hai...\n🎵 Song: ${selectedSong.name}`, threadID);

  try {
    // 1. Download Image
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(imgPath, Buffer.from(imgRes.data));

    // 2. Download Audio using yt-dlp
    // Note: Make sure yt-dlp is installed on your RDP/Server
    await execPromise(`yt-dlp -f bestaudio[ext=m4a] --output "${audioPath}" "${selectedSong.query}"`);

    // 3. FFmpeg Processing (Simple Zoom + Audio Overlay)
    const ffmpegCmd = `ffmpeg -loop 1 -i "${imgPath}" -i "${audioPath}" -c:v libx264 -t 15 -pix_fmt yuv420p -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.5)':d=375:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280" -c:a copy -shortest "${outPath}" -y`;
    
    await execPromise(ffmpegCmd);

    // 4. Send Video
    await api.sendMessage({
      body: "✅ Aapki DP Video taiyar hai!",
      attachment: fs.createReadStream(outPath)
    }, threadID, () => {
      // Cleanup files
      [imgPath, audioPath, outPath].forEach(p => fs.unlinkSync(p));
    }, messageID);

    api.unsendMessage(waitMsg.messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
}
