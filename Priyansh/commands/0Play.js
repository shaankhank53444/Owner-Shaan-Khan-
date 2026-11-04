const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

// ================== API SETUP (yt-mian-amir.vercel.app — apna proxy, Render API hata di) ==================
const ORIGIN = "https://yt-mian-amir.vercel.app";
const API = ORIGIN + "/api/link";
const MAX_FILE_MB = 48;                  // is se bari file par download link bhejte hain
const MAX_RESULTS = 6;                   // search list mein itne results
const SELECT_TIMEOUT_MS = 5 * 60 * 1000; // list par number reply ka time limit

const YT_URL = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/\S+/i;
const NUMS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

// Search list ka intezar: promptMsgID -> { threadID, results, isVideo, ts }
const pending = new Map();

// Ek hi message do dafa handle na ho
const seen = new Set();
function claim(id) {
  if (!id) return true;
  if (seen.has(id)) return false;
  if (seen.size > 300) seen.clear();
  seen.add(id);
  return true;
}

module.exports.config = {
  name: "play",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Gaana (mp3) ya video (360p) — search list se number reply karke chuno",
  commandCategory: "Media",
  usages: "[gaane ka naam] | [gaane ka naam] video",
  cooldowns: 5
};

// ================== helpers ==================

function getPrefix(threadID) {
  const threadData =
    (global.data && global.data.threadData && global.data.threadData.get(threadID)) || {};
  return threadData.PREFIX || (global.config && global.config.PREFIX) || "/";
}

function react(api, event, emoji) {
  try {
    api.setMessageReaction(emoji, event.messageID, () => {}, true);
  } catch (e) {}
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// "/api/file?..." jaisa relative link poora banana
function absolute(u) {
  if (/^https?:\/\//i.test(u)) return u;
  return ORIGIN + (u.startsWith("/") ? "" : "/") + u;
}

function cleanupPending() {
  const now = Date.now();
  for (const [k, p] of pending) {
    if (now - p.ts > SELECT_TIMEOUT_MS) pending.delete(k);
  }
}

// API se download link mangwana (naya video pehli dafa slow hota hai — 2 attempts)
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
      throw new Error("API ne download link nahi diya");
    } catch (e) {
      lastErr = e;
      if (attempt === 1) await sleep(3000);
    }
  }
  throw lastErr;
}

// File download: pehle apna proxy link, na chale to upstream wala
async function downloadTo(info, cachePath) {
  const sources = [info.download_url, info.upstream_url].filter(Boolean).map(absolute);
  let lastErr;
  for (const src of sources) {
    try {
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(cachePath);
        axios({
          url: src,
          method: "GET",
          responseType: "stream",
          timeout: 180000,
          headers: { "User-Agent": "Mozilla/5.0" }
        })
          .then(res => {
            const type = String(res.headers["content-type"] || "");
            if (/json|html|text/i.test(type)) {
              res.data.destroy();
              writer.destroy();
              return reject(new Error("File ki jagah text aaya (" + type + ")"));
            }
            res.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
            res.data.on("error", e => {
              writer.destroy();
              reject(e);
            });
          })
          .catch(e => {
            try { fs.unlinkSync(cachePath); } catch (e2) {}
            reject(e);
          });
      });
      if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 1024) return;
      throw new Error("File khali ya kharab aayi");
    } catch (e) {
      try { fs.unlinkSync(cachePath); } catch (e2) {}
      lastErr = e;
      console.log("[play] download failed:", src, e.message);
    }
  }
  throw lastErr || new Error("Download fail hua");
}

function infoMsgFor(video, info, isVideo) {
  const title = String(video.title || info.title || "YouTube").slice(0, 90);
  const author = (video.author && video.author.name) || "YouTube";
  return (
    `🖤 𝗧𝗶𝘁𝗹𝗲: ${title}\n\n` +
    `👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${author}\n\n` +
    `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
    `🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉 ${isVideo ? "VIDEO" : "SONG"}`
  );
}

// Search results ki list — isi message par reply karke number dena hai
function buildList(query, vids, isVideo) {
  const head = isVideo
    ? `🎬 "${query}" — VIDEO results\nReply mein number bhejo, video 360p aayegi:\n\n`
    : `🎵 "${query}" — SONG results\nReply mein number bhejo, gaana mp3 mein aayega:\n\n`;
  const lines = vids.map((v, i) => {
    const t = String(v.title || "YouTube").slice(0, 70);
    const a = v.author && v.author.name ? ` 👤 ${v.author.name}` : "";
    const d = v.timestamp ? ` ⏱ ${v.timestamp}` : "";
    return `${NUMS[i]} ${t}\n     ${a}${d}`.trimEnd();
  });
  return head + lines.join("\n\n");
}

// Search + download + bhejna — direct link aur reply-selection dono isi ko use karte hain
async function deliver(api, event, video, isVideo) {
  const { threadID } = event;
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cachePath = path.join(cacheDir, `${Date.now()}.${isVideo ? "mp4" : "mp3"}`);

  let processingMsg;
  try {
    react(api, event, "⌛");
    processingMsg = await api.sendMessage(
      `⏬ Download ho raha hai: ${String(video.title || "YouTube").slice(0, 60)}...`,
      threadID
    );

    const format = isVideo ? "360" : "mp3";
    const info = await getInfo(`${API}?url=${encodeURIComponent(video.url)}&format=${format}`);
    const directLink = absolute(info.download_url || info.upstream_url);
    const msgBody = infoMsgFor(video, info, isVideo);

    await downloadTo(info, cachePath);
    const fileSizeInMB = fs.statSync(cachePath).size / (1024 * 1024);

    if (fileSizeInMB > MAX_FILE_MB) {
      react(api, event, "✅");
      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      try { fs.unlinkSync(cachePath); } catch (e) {}
      return api.sendMessage(
        `⚠️ File size (${fileSizeInMB.toFixed(2)}MB) bohat bari hai.\nYahan se download karo:\n${directLink}`,
        threadID
      );
    }

    if (isVideo) {
      api.sendMessage(
        { body: msgBody, attachment: fs.createReadStream(cachePath) },
        threadID,
        err => {
          if (!err) react(api, event, "✅");
          else api.sendMessage("❌ Send fail hua, dobara try karo.", threadID);
          try { fs.unlinkSync(cachePath); } catch (e) {}
          if (processingMsg) api.unsendMessage(processingMsg.messageID);
        }
      );
    } else {
      await api.sendMessage(msgBody, threadID);
      api.sendMessage(
        { attachment: fs.createReadStream(cachePath) },
        threadID,
        err => {
          if (!err) react(api, event, "✅");
          else api.sendMessage("❌ Send fail hua, dobara try karo.", threadID);
          try { fs.unlinkSync(cachePath); } catch (e) {}
          if (processingMsg) api.unsendMessage(processingMsg.messageID);
        }
      );
    }
  } catch (err) {
    console.log("[play] error:", err.message);
    react(api, event, "❌");
    try { fs.existsSync(cachePath) && fs.unlinkSync(cachePath); } catch (e) {}
    if (processingMsg) api.unsendMessage(processingMsg.messageID);
    return api.sendMessage(`❌ Failed: ${err.message}`, threadID);
  }
}

// ================== .play <naam> [video] ==================

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args.length) {
    const p = getPrefix(threadID);
    return api.sendMessage(
      "🎵 Play\n\n" +
        `• ${p}play gaane ka naam\n    → results aayenge, reply mein number do — gaana mp3 aayega\n` +
        `• ${p}play gaane ka naam video\n    → results aayenge, reply mein number do — video 360p aayegi\n` +
        "• YouTube ka link seedha bhi chalega",
      threadID,
      messageID
    );
  }

  let input = args.join(" ").trim();
  let isVideo = false;
  if (input.toLowerCase().endsWith(" video")) {
    isVideo = true;
    input = input.slice(0, -6).trim();
  }
  if (!input) input = "mix";

  // Seedha YouTube link diya — search ke baghair
  if (YT_URL.test(input)) {
    return deliver(api, event, { url: input, title: null, author: null }, isVideo);
  }

  let processingMsg;
  try {
    react(api, event, "⌛");
    processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

    const r = await ytSearch(input);
    const vids = ((r && r.videos) || []).filter(v => v && v.seconds > 0).slice(0, MAX_RESULTS);
    if (!vids.length) {
      react(api, event, "❌");
      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      return api.sendMessage(`❌ "${input}" nahi mila.`, threadID, messageID);
    }

    if (processingMsg) api.unsendMessage(processingMsg.messageID);
    api.sendMessage(buildList(input, vids, isVideo), threadID, (err, info) => {
      if (!err && info && info.messageID) {
        pending.set(info.messageID, { threadID, results: vids, isVideo, ts: Date.now() });
        cleanupPending();
      } else {
        api.sendMessage("❌ List bhej nahi saka, dobara try karo.", threadID, messageID);
      }
    });
  } catch (error) {
    console.log("[play] search error:", error.message);
    react(api, event, "❌");
    if (processingMsg) api.unsendMessage(processingMsg.messageID);
    return api.sendMessage(`❌ Failed: ${error.message}`, threadID);
  }
};

// ================== reply par number -> wo song/video ==================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event || !event.body || event.type !== "message_reply" || !event.messageReply) return;
    if (!claim(event.messageID)) return;

    const p = pending.get(event.messageReply.messageID);
    if (!p || event.threadID !== p.threadID) return;

    const body = String(event.body).trim();
    if (!/^\d{1,2}$/.test(body)) return; // number nahi hai — ignore

    if (Date.now() - p.ts > SELECT_TIMEOUT_MS) {
      pending.delete(event.messageReply.messageID);
      return api.sendMessage("⌛ Time out ho gaya — dobara search karo.", event.threadID, event.messageID);
    }

    const num = parseInt(body, 10);
    if (num < 1 || num > p.results.length) {
      return api.sendMessage(
        `❌ 1 se ${p.results.length} tak number bhejo.`,
        event.threadID,
        event.messageID
      );
    }

    pending.delete(event.messageReply.messageID); // ek selection ek dafa
    const v = p.results[num - 1];
    await deliver(api, event, v, p.isVideo);
  } catch (e) {
    console.log("[play] handleEvent error:", e.message);
  }
};