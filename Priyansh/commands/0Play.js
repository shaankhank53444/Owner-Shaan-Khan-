const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Gaane ka naam search karne ke liye (Termux mein: npm install yt-search)
let yts = null;
try {
  yts = require("yt-search");
} catch (e) {}

const ORIGIN = "https://yt-mian-amir.vercel.app";
const API = ORIGIN + "/api/link";
const MAX_FILE_MB = 25;          // Messenger ki limit, is se bari file ka link bhejenge
const MAX_AUDIO_SEC = 20 * 60;   // 20 minute se lamba gaana nahi
const MAX_VIDEO_SEC = 10 * 60;   // 10 minute se lambi video nahi
const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

const YT_URL = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/\S+/i;

// Ek hi message ko do dafa handle hone se rokta hai
const seen = new Set();
function claim(id) {
  if (!id) return true;
  if (seen.has(id)) return false;
  if (seen.size > 200) seen.clear();
  seen.add(id);
  return true;
}

module.exports.config = {
  name: "play",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mian Amir",
  description: "Gaana mp3 mein ya video 360p mein bhejo",
  commandCategory: "media",
  usages: "play <gaane ka naam> | playvideo <gaane ka naam>",
  cooldowns: 10
};

// ---------- helpers ----------

function getPrefix(threadID) {
  const threadData =
    (global.data && global.data.threadData && global.data.threadData.get(threadID)) || {};
  return threadData.PREFIX || (global.config && global.config.PREFIX) || "/";
}

function usage(p) {
  return (
    "🎵 Play\n\n" +
    `• ${p}play tum hi ho\n   → gaana mp3 mein\n` +
    `• ${p}playvideo tum hi ho\n   → video 360p mein\n\n` +
    "YouTube ka link bhi de sakte ho."
  );
}

function react(api, event, emoji) {
  try {
    api.setMessageReaction(emoji, event.messageID, () => {}, true);
  } catch (e) {}
}

// Message "<prefix><name> ..." ho to uske baad ka text deta hai, warna null
function matchCmd(event, prefix, name) {
  const body = (event.body || "").trim();
  const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = body.match(new RegExp("^" + esc + name + "(?:\\s+([\\s\\S]*))?$", "i"));
  return m ? (m[1] || "").trim() : null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// "/api/file?..." jaise relative link ko poora link bana deta hai
function absolute(u) {
  if (/^https?:\/\//i.test(u)) return u;
  return ORIGIN + (u.startsWith("/") ? "" : "/") + u;
}

// API se download ka link maangta hai.
// Nayi video par pehli dafa der lag sakti hai (timeout aa jata hai),
// is liye ek dafa dobara try karta hai (dusri baar ready milti hai).
async function getInfo(apiLink) {
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.get(apiLink, {
        timeout: 120000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const d = res.data;
      if (d && typeof d === "object" && (d.download_url || d.upstream_url)) return d;
      console.log("[play] unexpected response:", String(JSON.stringify(d)).slice(0, 300));
      throw new Error("API ne download link nahi diya");
    } catch (e) {
      lastErr = e;
      if (attempt === 1) await sleep(3000);
    }
  }
  throw lastErr;
}

// File download karta hai: pehle API ka link, na chale to upstream wala
async function downloadFile(info) {
  const sources = [info.download_url, info.upstream_url].filter(Boolean).map(absolute);
  let lastErr;
  for (const src of sources) {
    try {
      const res = await axios.get(src, {
        responseType: "arraybuffer",
        timeout: 180000,
        maxContentLength: 60 * 1024 * 1024,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const type = String(res.headers["content-type"] || "");
      if (/json|html|text/i.test(type)) throw new Error("File ki jagah text aaya (" + type + ")");
      return Buffer.from(res.data);
    } catch (e) {
      if (/maxContentLength/i.test(e.message)) throw e;
      lastErr = e;
      console.log("[play] download failed:", src, e.message);
    }
  }
  throw lastErr;
}

// ---------- main ----------

async function handle(api, event, query, isVideo) {
  const { threadID, messageID } = event;
  const prefix = getPrefix(threadID);

  if (!query) return api.sendMessage(usage(prefix), threadID, messageID);

  let file = null;
  let directLink = null;
  try {
    react(api, event, "⏳");

    let videoUrl;
    let title = null;
    let info_text = "";

    const firstWord = query.split(/\s+/)[0];
    if (YT_URL.test(firstWord)) {
      // Seedha YouTube link diya
      videoUrl = firstWord;
    } else {
      if (!yts) {
        react(api, event, "❌");
        return api.sendMessage(
          "❌ Search ka package install nahi hai.\nTermux mein ye chalao:\nnpm install yt-search",
          threadID,
          messageID
        );
      }

      const r = await yts(query);
      const v = (r.videos || []).find(x => x.seconds > 0);
      if (!v) {
        react(api, event, "❌");
        return api.sendMessage(`❌ "${query}" nahi mila.`, threadID, messageID);
      }

      const limit = isVideo ? MAX_VIDEO_SEC : MAX_AUDIO_SEC;
      if (v.seconds > limit) {
        react(api, event, "❌");
        return api.sendMessage(
          `❌ "${v.title}" bohat lamba hai (${v.timestamp}). Maximum ${limit / 60} minute.`,
          threadID,
          messageID
        );
      }

      videoUrl = v.url;
      title = v.title;
      info_text = `\n⏱️ ${v.timestamp}` + (v.author && v.author.name ? `\n👤 ${v.author.name}` : "");
    }

    const format = isVideo ? "360" : "mp3";
    const info = await getInfo(`${API}?url=${encodeURIComponent(videoUrl)}&format=${format}`);
    directLink = absolute(info.download_url || info.upstream_url);
    title = title || info.title || (isVideo ? "YouTube Video" : "YouTube Audio");

    const buffer = await downloadFile(info);
    if (!buffer || buffer.length < 1024) throw new Error("File khali ya kharab aayi");

    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      react(api, event, "✅");
      return api.sendMessage(
        `${isVideo ? "🎬" : "🎵"} ${title}${info_text}\n\nFile bohat bari hai (${sizeMB.toFixed(1)} MB), yahan se download karo:\n${directLink}`,
        threadID,
        messageID
      );
    }

    file = path.join(CACHE_DIR, `play_${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
    await fs.writeFile(file, buffer);

    react(api, event, "✅");
    return api.sendMessage(
      {
        body: `${isVideo ? "🎬" : "🎵"} ${title}${info_text}`,
        attachment: fs.createReadStream(file)
      },
      threadID,
      () => fs.remove(file).catch(() => {}),
      messageID
    );
  } catch (err) {
    if (file) fs.remove(file).catch(() => {});
    react(api, event, "❌");
    console.log("[play] error:", err.message);

    // File 60 MB se bari thi to link de do
    if (directLink && /maxContentLength/i.test(err.message)) {
      return api.sendMessage(
        `❌ File bohat bari hai, yahan se download karo:\n${directLink}`,
        threadID,
        messageID
      );
    }
    return api.sendMessage(
      "❌ Download nahi ho saka. Thori dair baad dobara try karo.",
      threadID,
      messageID
    );
  }
}

// ---------- /playvideo <naam> ----------

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  const prefix = getPrefix(event.threadID);
  const query = matchCmd(event, prefix, "playvideo");
  if (query === null) return;

  if (!claim(event.messageID)) return;
  return handle(api, event, query, true);
};

// ---------- /play <naam> ----------

module.exports.run = async function ({ api, event, args }) {
  if (!claim(event.messageID)) return;

  // Kuch bots "playvideo" ko "play" se match kar dete hain, is liye message khud check karo
  const prefix = getPrefix(event.threadID);
  const isVideo = matchCmd(event, prefix, "playvideo") !== null;

  return handle(api, event, args.join(" ").trim(), isVideo);
};