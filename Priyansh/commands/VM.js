const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const http   = require("http");
const https  = require("https");
const ffmpeg     = require("fluent-ffmpeg");
const { execSync } = require("child_process");

try {
  ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
} catch (_) {
  try {
    const sys = execSync("which ffmpeg 2>/dev/null").toString().trim();
    if (sys) ffmpeg.setFfmpegPath(sys);
  } catch (_2) {}
}

module.exports.config = {
  name: "VM",
  version: "6.0.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube video downloader — query ya URL, audio+video, 21MB ke andar",
  commandCategory: "media",
  usages: "video <song naam | YouTube link>",
  cooldowns: 5
};

const SEARCH_API   = "https://uzairrajputapis.qzz.io/api/search/youtube";
const DOWNLOAD_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube";
const UA           = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
const TARGET_BYTES = 21 * 1024 * 1024; // 21MB

const keepAliveHttp  = new http.Agent({ keepAlive: true });
const keepAliveHttps = new https.Agent({ keepAlive: true });

const req = (opts) => axios({
  maxRedirects: 5,
  headers: { "User-Agent": UA },
  httpAgent: keepAliveHttp,
  httpsAgent: keepAliveHttps,
  ...opts
});

const isYT = (s) => /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(s.trim());

const trimStr = (str, max = 45) => {
  str = String(str || "").trim();
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
};

const toSeconds = (dur) => {
  if (!dur) return null;
  const p = String(dur).split(":").map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return null;
};

const downloadStream = async (url, dest) => {
  const r = await req({ url, method: "GET", responseType: "stream", timeout: 120000 });
  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(dest);
    r.data.pipe(w);
    w.on("finish", resolve);
    w.on("error", reject);
    r.data.on("error", reject);
  });
};

const compress = (inputPath, outputPath, durationSec) => {
  return new Promise((resolve, reject) => {
    let bitrateOpts;
    if (durationSec && durationSec >= 5) {
      const audioBps  = 96 * 1000;
      const totalBps  = Math.floor((TARGET_BYTES * 8) / durationSec);
      const videoBps  = Math.max(totalBps - audioBps, 80000);
      bitrateOpts = [`-b:v ${Math.floor(videoBps / 1000)}k`, `-b:a 96k`];
    } else {
      bitrateOpts = [`-crf 35`, `-b:a 96k`];
    }

    ffmpeg(inputPath)
      .outputOptions([
        "-map 0:v:0",
        "-map 0:a:0",
        "-c:v libx264",
        "-preset ultrafast",
        ...bitrateOpts,
        "-c:a aac",
        "-vf scale=480:-2",
        "-movflags faststart",
        "-y"
      ])
      .output(outputPath)
      .on("start", (cmd) => console.log("[video] ffmpeg start:", cmd.slice(0, 80)))
      .on("end",   () => { console.log("[video] ffmpeg done"); resolve(); })
      .on("error", (err) => { console.log("[video] ffmpeg error:", err.message); reject(err); })
      .run();
  });
};

const buildCard = (info, compressed) => {
  const title    = trimStr(info.title    || "Unknown", 45);
  const channel  = trimStr(info.channel  || "Unknown", 30);
  const duration = info.duration || "—";
  const views    = info.views    || "";
  const quality  = compressed ? "480p" : (info.quality || "HD");

  return (
    `╭━━━『 🎬 VIDEO 🎬 』━━━⭓\n` +
    `│\n` +
    `│ 🎞️ 𝗧𝗶𝘁𝗹𝗲    » ${title}\n` +
    `│ 🎤 𝗖𝗵𝗮𝗻𝗻𝗲𝗹  » ${channel}\n` +
    `│ ⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻 » ${duration}\n` +
    (views ? `│ 👁️ 𝗩𝗶𝗲𝘄𝘀    » ${views}\n` : "") +
    `│ 📺 𝗤𝘂𝗮𝗹𝗶𝘁𝘆  » ${quality} mp4\n` +
    `│\n` +
    `╰━━━『 🦋 Shaan Bot 🦋 』━━━⭓`
  );
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `╭━━━『 🎬 𝗩𝗜𝗗𝗘𝗢 𝗕𝗢𝗧 🎬 』━━⭓\n` +
      `│\n` +
      `│  🎶 .video <song naam>\n` +
      `│  🔗 .video <YouTube link>\n` +
      `│\n` +
      `│  ✅ Video,\n` +
      `│\n` +
      `╰━━━━『 🦋 »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵«« 🦋 』━━━⭓`,
      threadID, messageID
    );
  }

  const query    = args.join(" ").trim();
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const stamp   = Date.now();
  const rawPath = path.join(cacheDir, `vid_raw_${stamp}.mp4`);
  const outPath = path.join(cacheDir, `vid_out_${stamp}.mp4`);

  // Search start text updated as requested
  const infoMessage = await new Promise((resolve) => {
    api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, (err, info) => resolve(info), messageID);
  });

  try {
    let ytUrl   = null;
    let vidInfo = {};

    if (isYT(query)) {
      ytUrl = query;
      console.log("[video] Direct YT URL:", ytUrl);
    } else {
      console.log("[video] Searching:", query);
      const { data: srData } = await req({
        url: `${SEARCH_API}?q=${encodeURIComponent(query)}`,
        timeout: 30000
      });
      const first = srData?.result?.[0];
      if (!first?.url) throw new Error("Koi video nahi mila — doosra naam try karo");
      ytUrl   = first.url;
      vidInfo = { title: first.title, channel: first.channel, duration: first.duration, views: first.views };
      console.log("[video] Found:", first.title, "|", first.duration);
    }

    console.log("[video] Getting download link...");
    const { data: dlData } = await req({
      url:     DOWNLOAD_API,
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      data:    JSON.stringify({ url: ytUrl }),
      timeout: 60000
    });

    const result = dlData?.result || dlData;
    if (!result?.downloadUrl) throw new Error("Download link nahi mila");
    console.log("[video] Download URL got, size:", result.size || "unknown");

    const info = {
      title:    vidInfo.title    || result.title    || "Unknown",
      channel:  vidInfo.channel  || result.channel  || "Unknown",
      duration: vidInfo.duration || result.duration || "—",
      views:    vidInfo.views    || "",
      quality:  result.quality   || "HD"
    };

    await downloadStream(result.downloadUrl, rawPath);

    const rawStats = await fs.stat(rawPath);
    console.log("[video] Downloaded:", (rawStats.size / 1024 / 1024).toFixed(1), "MB");
    if (!rawStats.size) throw new Error("Downloaded file khaali hai");

    let finalPath  = rawPath;
    let compressed = false;

    if (rawStats.size > TARGET_BYTES) {
      console.log("[video] Compressing to 21MB...");
      const durSec = toSeconds(info.duration);
      await compress(rawPath, outPath, durSec);
      await fs.remove(rawPath).catch(() => {});

      const outStats = await fs.stat(outPath);
      console.log("[video] Compressed:", (outStats.size / 1024 / 1024).toFixed(1), "MB");
      if (!outStats.size) throw new Error("Compress ke baad file khaali hai");

      finalPath  = outPath;
      compressed = true;
    }

    if (infoMessage && infoMessage.messageID) {
      api.unsendMessage(infoMessage.messageID).catch(() => {});
    }

    console.log("[video] Sending video..."); // Sand log
    api.sendMessage(
      {
        body:       buildCard(info, compressed),
        attachment: fs.createReadStream(finalPath)
      },
      threadID,
      (err) => {
        if (err) console.log("[video] Send error:", err?.message);
        else console.log("[video] Sent successfully and done!"); // Done log
        fs.remove(rawPath).catch(() => {});
        fs.remove(outPath).catch(() => {});
      },
      messageID
    );

  } catch (err) {
    console.log("[video] error:", err.message);
    fs.remove(rawPath).catch(() => {});
    fs.remove(outPath).catch(() => {});
    if (infoMessage && infoMessage.messageID) {
      api.unsendMessage(infoMessage.messageID).catch(() => {});
    }
    api.sendMessage(
      `╭━━━『 ⚠️ ERROR 』━━━⭓\n` +
      `│\n` +
      `│ 📛 ${err.message}\n` +
      `│\n` +
      `╰━━━━『 🦋 Shaan Bot 🦋 』━━━⭓`,
      threadID, messageID
    );
  }
};
