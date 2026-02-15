const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports.config = {
  name: "dpvideo",
  version: "15.0.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Create DP video with zoom effect and music",
  commandCategory: "Media",
  usages: "Reply to an image with 'dpvideo' or 'dpvideo [number]'",
  prefix: true,
  cooldowns: 10
};

const SONG_LIST = [
  { name: "🎵 Tera Ban Jaunga", url: "ytsearch1:Tera Ban Jaunga Kabir Singh" },
  { name: "🎵 Tum Hi Ho", url: "ytsearch1:Tum Hi Ho Aashiqui 2" },
  { name: "🎵 Kesariya", url: "ytsearch1:Kesariya Brahmastra" },
  { name: "🎵 Perfect", url: "ytsearch1:Perfect Ed Sheeran" },
  { name: "🎵 Believer", url: "ytsearch1:Believer Imagine Dragons" },
  { name: "🎵 Let Me Love You", url: "ytsearch1:Let Me Love You DJ Snake" },
  { name: "🎵 Shape of You", url: "ytsearch1:Shape of You Ed Sheeran" },
  { name: "🎵 Unstoppable", url: "ytsearch1:Unstoppable Sia" },
  { name: "🎵 Dance Monkey", url: "ytsearch1:Dance Monkey Tones and I" },
  { name: "🎵 Senorita", url: "ytsearch1:Senorita Shawn Mendes" }
];

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, senderID } = event;

  if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Pehle kisi image ko reply karo!", threadID, messageID);
  }

  const imageUrl = messageReply.attachments[0].url;

  if (args.length === 0) {
    let songListMsg = "✨ *Konsa song chahiye?*\n\n";
    SONG_LIST.forEach((song, index) => {
      songListMsg += `${index + 1}. ${song.name}\n`;
    });
    songListMsg += "\n📌 *Number reply karein!*";
    
    return api.sendMessage(songListMsg, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        imageUrl: imageUrl,
        type: "selectSong"
      });
    }, messageID);
  }

  const songIndex = parseInt(args[0]) - 1;
  if (!isNaN(songIndex) && SONG_LIST[songIndex]) {
    await processVideo(api, event, threadID, messageID, imageUrl, SONG_LIST[songIndex]);
  } else {
    api.sendMessage("❌ Galat number! 1 se " + SONG_LIST.length + " tak choose karein.", threadID, messageID);
  }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { body, threadID, messageID, senderID } = event;
  if (senderID != handleReply.author) return;

  const index = parseInt(body) - 1;
  if (isNaN(index) || !SONG_LIST[index]) {
    return api.sendMessage("❌ Invalid choice!", threadID, messageID);
  }

  api.unsendMessage(handleReply.messageID);
  await processVideo(api, event, threadID, messageID, handleReply.imageUrl, SONG_LIST[index]);
};

async function processVideo(api, event, threadID, messageID, imageUrl, selectedSong) {
  const msg = await api.sendMessage(`🎬 Video ban rahi hai...\n🎵 Song: ${selectedSong.name}\n⏳ Sabr karein...`, threadID);

  const cacheDir = path.join(__dirname, "cache", "dp_temp");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const id = Date.now();
  const inputImg = path.join(cacheDir, `img_${id}.jpg`);
  const tempVid = path.join(cacheDir, `temp_${id}.mp4`);
  const finalVid = path.join(cacheDir, `final_${id}.mp4`);
  const audioFile = path.join(cacheDir, `audio_${id}.m4a`);

  try {
    // 1. Image Download
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(inputImg, Buffer.from(imgRes.data));

    // 2. Audio Download (yt-dlp)
    try {
      await execPromise(`yt-dlp -f "bestaudio" -x --audio-format m4a -o "${audioFile}" "${selectedSong.url}" --max-filesize 10M`);
    } catch (e) {
      console.error("Audio download error:", e);
    }

    // 3. FFmpeg Processing (Zoom Effect + Merge)
    // Filter: Crop to 9:16, Zoom in/out, and add audio
    const ffmpegCmd = fs.existsSync(audioFile) 
      ? `ffmpeg -loop 1 -i "${inputImg}" -i "${audioFile}" -t 15 -vf "scale=800:1200:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280" -c:v libx264 -preset superfast -tune stillimage -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest -pix_fmt yuv420p "${finalVid}" -y`
      : `ffmpeg -loop 1 -i "${inputImg}" -t 15 -vf "scale=800:1200:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280" -c:v libx264 -preset superfast -tune stillimage -pix_fmt yuv420p "${finalVid}" -y`;

    await execPromise(ffmpegCmd);

    // 4. Send Video
    await api.sendMessage({
      body: `✅ Video Complete!\n🎵 Song: ${selectedSong.name}`,
      attachment: fs.createReadStream(finalVid)
    }, threadID, () => {
      // Cleanup files
      [inputImg, tempVid, finalVid, audioFile].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
    }, messageID);

    api.unsendMessage(msg.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
}
