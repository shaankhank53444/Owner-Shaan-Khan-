const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports.config = {
  name: "dpvideo",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Create DP video with song (Fixed Font & Paths)",
  commandCategory: "Media",
  usages: "[song name] - Reply to image",
  prefix: true,
  cooldowns: 20
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply } = event;

  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Kisi image ko reply karein!", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Sirf image par reply karein!", threadID, messageID);
  }

  const songName = args.join(" ") || "Tera Ban Jaunga";
  const imageUrl = attachment.url;

  const processingMsg = await api.sendMessage(
    `🎬 *DP Video bana rahi hu...*\n🎵 Song: ${songName}\n⏳ Wait 10-20 seconds...`,
    threadID
  );

  const cacheDir = path.join(__dirname, "cache", "dp");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const inputPath = path.join(cacheDir, `bg_${Date.now()}.jpg`);
  const outputPath = path.join(cacheDir, `dp_${Date.now()}.mp4`);
  const audioPath = path.join(cacheDir, `audio_${Date.now()}.m4a`);

  try {
    // 1. Download Image
    const response = await axios({ url: imageUrl, method: "GET", responseType: "stream" });
    const writer = fs.createWriteStream(inputPath);
    response.data.pipe(writer);
    await new Promise((resolve) => writer.on("finish", resolve));

    // 2. Download Song using yt-dlp
    try {
      await execPromise(`yt-dlp -f bestaudio -x --audio-format m4a -o "${audioPath}" "ytsearch1:${songName}"`);
    } catch (e) {
      console.log("Audio download skipped or failed");
    }

    // 3. Templates
    const templates = [
      { name: "Candy 🍬", text: "pink" },
      { name: "Neon 💡", text: "cyan" },
      { name: "Fire 🔥", text: "yellow" }
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // 4. FFmpeg Command (Font Path removed for compatibility)
    // Scale and add text overlay
    const ffmpegCmd = `ffmpeg -loop 1 -i "${inputPath}" -t 10 ` +
      `-vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,` +
      `drawtext=text='${songName}':fontcolor=${template.text}:fontsize=45:x=(w-text_w)/2:y=150,` +
      `drawtext=text='${template.name}':fontcolor=white:fontsize=25:x=(w-text_w)/2:y=220,` +
      `drawtext=text='💝 MISS ALIYA':fontcolor=white:fontsize=35:x=(w-text_w)/2:h-60" ` +
      `-c:v libx264 -preset ultrafast -pix_fmt yuv420p "${outputPath}" -y`;

    await execPromise(ffmpegCmd);

    // 5. Merge Audio
    let finalPath = outputPath;
    if (fs.existsSync(audioPath)) {
      finalPath = path.join(cacheDir, `final_${Date.now()}.mp4`);
      await execPromise(`ffmpeg -i "${outputPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y`);
    }

    // 6. Send Result
    api.unsendMessage(processingMsg.messageID);
    api.sendMessage({
      body: `✅ *DP Video Ready!*\n\n🎵 ${songName}\n🎨 ${template.name}`,
      attachment: fs.createReadStream(finalPath)
    }, threadID, () => {
      // Cleanup
      [inputPath, outputPath, audioPath, finalPath].forEach(f => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
    }, messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Error: FFmpeg not installed or Path issue. Please check console.", threadID, messageID);
  }
};
