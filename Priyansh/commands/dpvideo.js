const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports.config = {
  name: "dpvideo",
  version: "13.0.0",
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
  { name: "🎵 Tera Ban Jaunga", url: "ytsearch1:Tera Ban Jaunga" },
  { name: "🎵 Tum Hi Ho", url: "ytsearch1:Tum Hi Ho" },
  { name: "🎵 Kesariya", url: "ytsearch1:Kesariya" },
  { name: "🎵 Perfect", url: "ytsearch1:Perfect Ed Sheeran" },
  { name: "🎵 Believer", url: "ytsearch1:Believer Imagine Dragons" },
  { name: "🎵 Let Me Love You", url: "ytsearch1:Let Me Love You DJ Snake" },
  { name: "🎵 Shape of You", url: "ytsearch1:Shape of You Ed Sheeran" },
  { name: "🎵 Unstoppable", url: "ytsearch1:Unstoppable Sia" },
  { name: "🎵 Dance Monkey", url: "ytsearch1:Dance Monkey Tones and I" },
  { name: "🎵 Senorita", url: "ytsearch1:Senorita Shawn Mendes" }
];

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply } = event;

  // 🔥 CHECK KARO KI USER NE KISIKO REPLY KIYA HAI?
  if (!messageReply) {
    return api.sendMessage("❌ Pehle kisi image ko reply karo!", threadID, messageID);
  }

  // 📸 ATTACHMENT CHECK
  if (!messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Reply ki gayi message mein koi image nahi hai!", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Sirf image ko reply karo!", threadID, messageID);
  }

  const imageUrl = attachment.url;

  // 🎯 CASE 1: USER NE DPVIDEO LIKHA AUR IMAGE REPLY KIYA
  if (args.length === 0) {
    // Song list bhejo
    let songListMsg = "✨ *Konsa song chahiye?*\n\n";
    SONG_LIST.forEach((song, index) => {
      songListMsg += `${index + 1}. ${song.name}\n`;
    });
    songListMsg += "\n📌 *Ab inme se kisi bhi number ko reply karo!*";
    
    return api.sendMessage(songListMsg, threadID, (err, info) => {
      // Store image info for later use
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        imageUrl: imageUrl,
        type: "selectSong"
      });
    }, messageID);
  }

  // 🎯 CASE 2: USER NE DIRECT NUMBER DIYA (dpvideo 1)
  const songIndex = parseInt(args[0]) - 1;
  
  if (!isNaN(songIndex) && songIndex >= 0 && songIndex < SONG_LIST.length) {
    const selectedSong = SONG_LIST[songIndex];
    await processVideo(api, event, threadID, messageID, imageUrl, selectedSong);
  } else {
    return api.sendMessage("❌ Galat number! 1 se " + SONG_LIST.length + " ke beech mein choose karo.", threadID, messageID);
  }
};

// 🎬 Video processing function
async function processVideo(api, event, threadID, messageID, imageUrl, selectedSong) {
  const processingMsg = await api.sendMessage(
    `🎬 Video bana rahi hu...\n` +
    `🎵 Song: ${selectedSong.name}\n` +
    `⏳ 20 seconds`,
    threadID
  );

  try {
    const cacheDir = path.join(__dirname, "cache", "dp");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // Download image
    const inputPath = path.join(cacheDir, `bg_${Date.now()}.jpg`);
    const outputPath = path.join(cacheDir, `dp_${Date.now()}.mp4`);
    const audioPath = path.join(cacheDir, `audio_${Date.now()}.m4a`);
    const videoPath = path.join(cacheDir, `temp_${Date.now()}.mp4`);

    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(inputPath);
    response.data.pipe(writer);
    await new Promise((resolve) => writer.on("finish", resolve));

    // Templates
    const templates = [
      { name: "✨ Cinematic", filter: "curves=preset=medium_contrast,eq=brightness=0.02:contrast=1.1" },
      { name: "🎞️ Vintage", filter: "curves=preset=vintage,colorbalance=rs=-0.1:gs=0.1:bs=0.2" },
      { name: "🌈 Vibrant", filter: "eq=saturation=1.5:contrast=1.2:brightness=0.01" },
      { name: "🌸 Soft Dream", filter: "boxblur=2:1,eq=brightness=0.03" },
      { name: "🎭 Dramatic", filter: "eq=contrast=1.4:saturation=1.1" },
      { name: "☀️ Warm", filter: "colorbalance=rs=0.2:gs=0.1:bs=-0.1" },
      { name: "❄️ Cool", filter: "colorbalance=rs=-0.1:gs=0.1:bs=0.2" }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];

    // Video with zoom
    await execPromise(
      `ffmpeg -loop 1 -i "${inputPath}" -t 15 -vf "scale=1920:1920:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='if(between(t,0,5),1+0.1*t,if(between(t,5,10),1.5-0.1*(t-5),1))':d=15*25:fps=25:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',${template.filter}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${videoPath}" -y`
    );

    // Download song
    await api.sendMessage("🎵 Song download kar rahi hu...", threadID, processingMsg.messageID);
    
    let hasAudio = false;
    try {
      await execPromise(
        `yt-dlp -f bestaudio -x --audio-format m4a --postprocessor-args "-ss 0 -t 15" -o "${audioPath}" "${selectedSong.url}" --quiet --no-warnings`
      );
      
      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 10000) {
        hasAudio = true;
      }
    } catch (e) {
      console.log("Song download failed");
    }

    // Add audio
    if (hasAudio) {
      await execPromise(
        `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y -loglevel error`
      );
    } else {
      fs.copyFileSync(videoPath, outputPath);
    }

    // Send video
    api.unsendMessage(processingMsg.messageID);
    
    const stats = fs.statSync(outputPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    const msg = {
      body: `✅ *DP Video Ready!*\n\n` +
            `🎵 ${selectedSong.name}\n` +
            `🎨 ${template.name}\n` +
            `⏱️ 15 sec\n` +
            `📁 ${fileSizeMB.toFixed(2)}MB\n` +
            `🎬 Zoom In/Out`,
      attachment: fs.createReadStream(outputPath)
    };

    api.sendMessage(msg, threadID, () => {
      // Cleanup
      try {
        [inputPath, outputPath, videoPath, audioPath].forEach(f => {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        });
      } catch (e) {}
    }, messageID);

  } catch (error) {
    console.error(error);
    api.unsendMessage(processingMsg.messageID);
    api.sendMessage("❌ Error: " + error.message, threadID, messageID);
  }
}

// 🔄 Handle replies
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;
  
  if (senderID !== handleReply.author) return;
  
  if (handleReply.type === "selectSong") {
    const songNumber = parseInt(body);
    
    if (isNaN(songNumber) || songNumber < 1 || songNumber > SONG_LIST.length) {
      return api.sendMessage("❌ Galat number! 1 se " + SONG_LIST.length + " ke beech mein likho.", threadID, messageID);
    }
    
    const selectedSong = SONG_LIST[songNumber - 1];
    
    // Process video
    await processVideo(api, event, threadID, messageID, handleReply.imageUrl, selectedSong);
  }
};