const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Gaane ka naam search karne ke liye (Termux mein: npm install yt-search)
let yts = null;
try {
  yts = require("yt-search");
} catch (e) {}

const API = "https://yt-mian-amir.vercel.app/api/link";
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
  name: "mp3",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mian Amir",
  description: "Gaana mp3 mein ya video 360p mein bhejo",
  commandCategory: "media",
  usages: "mp3 <gaane ka naam> | mp3video <gaane ka naam>",
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
    "🎵 MP3 Player\n\n" +
    `• ${p}mp3 tum hi ho\n   → gaana mp3 mein\n` +
    `• ${p}mp3video tum hi ho\n   → video 360p mein\n\n` +
    "YouTube ka link bhi de sakte ho."
  );
}

function react(api, event, emoji) {
  try {
    api.setMessageReaction(emoji, event.messageID, () => {}, true);
  } catch (e) {}
}

// Message "<prefix><name> / <alias> ..." ho to uske baad ka text deta hai, warna null
function matchCmd(event, prefix, name) {
  const body = (event.body || "").trim();
  const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = body.match(new RegExp("^" + esc + name + "(?:\\s+([\\s\\S]*))?$", "i"));
  return m ? (m[1] || "").trim() : null;
}

// API agar JSON de to usme se file ka link dhoondta hai
function findUrl(obj) {
  if (!obj) return null;
  if (typeof obj === "string") return /^https?:\/\//i.test(obj) ? obj : null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === "object") {
    for (const key of ["result", "url", "download", "download_url", "link", "audio", "video", "data"]) {
      const found = findUrl(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

async function getBuffer(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 180000,
    maxContentLength: 60 * 1024 * 1024,
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return res;
}

// API se file lata hai (seedha file di to wahi, JSON mein link diya to link se)
async function fetchMedia(apiLink) {
  const res = await getBuffer(apiLink);
  const type = String(res.headers["content-type"] || "");

  if (/json|text/i.test(type)) {
    const text = Buffer.from(res.data).toString("utf8");
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {}
    const mediaUrl = findUrl(json);
    if (!mediaUrl) {
      console.log("[mp3] unexpected response:", type, text.slice(0, 300));
      throw new Error("API ne file nahi di");
    }
    const media = await getBuffer(mediaUrl);
    return Buffer.from(media.data);
  }

  return Buffer.from(res.data);
}

// ---------- main ----------

async function handle(api, event, query, isVideo) {
  const { threadID, messageID } = event;
  const prefix = getPrefix(threadID);

  if (!query) return api.sendMessage(usage(prefix), threadID, messageID);

  let file = null;
  let apiLink = null;
  try {
    react(api, event, "⏳");

    let videoUrl;
    let title = isVideo ? "YouTube Video" : "YouTube Audio";
    let info = "";

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
      info = `\n⏱️ ${v.timestamp}` + (v.author && v.author.name ? `\n👤 ${v.author.name}` : "");
    }

    const format = isVideo ? "360" : "mp3";
    apiLink = `${API}?url=${encodeURIComponent(videoUrl)}&format=${format}`;

    const buffer = await fetchMedia(apiLink);
    if (!buffer || buffer.length < 1024) throw new Error("File khali ya kharab aayi");

    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      react(api, event, "✅");
      return api.sendMessage(
        `${isVideo ? "🎬" : "🎵"} ${title}${info}\n\nFile bohat bari hai (${sizeMB.toFixed(1)} MB), yahan se download karo:\n${apiLink}`,
        threadID,
        messageID
      );
    }

    file = path.join(CACHE_DIR, `mp3_${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
    await fs.writeFile(file, buffer);

    react(api, event, "✅");
    return api.sendMessage(
      {
        body: `${isVideo ? "🎬" : "🎵"} ${title}${info}`,
        attachment: fs.createReadStream(file)
      },
      threadID,
      () => fs.remove(file).catch(() => {}),
      messageID
    );
  } catch (err) {
    if (file) fs.remove(file).catch(() => {});
    react(api, event, "❌");
    console.log("[mp3] error:", err.message);

    // File 60 MB se bari thi to link de do
    if (apiLink && /maxContentLength/i.test(err.message)) {
      return api.sendMessage(
        `❌ File bohat bari hai, yahan se download karo:\n${apiLink}`,
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

// ---------- /mp3video <naam> ----------

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  const prefix = getPrefix(event.threadID);
  const query = matchCmd(event, prefix, "mp3video");
  if (query === null) return;

  if (!claim(event.messageID)) return;
  return handle(api, event, query, true);
};

// ---------- /mp3 <naam> ----------

module.exports.run = async function ({ api, event, args }) {
  if (!claim(event.messageID)) return;

  const prefix = getPrefix(event.threadID);
  const isVideo = matchCmd(event, prefix, "mp3video") !== null;

  return handle(api, event, args.join(" ").trim(), isVideo);
};
