const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_SEARCH = "https://api.nexray.eu.cc/search/pinterest";
const API_VIDEO = "https://api.nexray.eu.cc/downloader/pinterest";
const DEFAULT_COUNT = 6;
const MAX_COUNT = 10;
const MAX_VIDEO_MB = 25; // is se bari video ka link bhej denge
const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

const PIN_URL = /^https?:\/\/(?:[\w-]+\.)?(?:pinterest\.[a-z.]+|pin\.it)\/\S+/i;

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
  name: "pin",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Pinterest se dpz images search karo ya video download karo",
  commandCategory: "tools",
  usages: "pin <name> [- number] | pinvid <pinterest link>",
  cooldowns: 5
};

// ---------- helpers ----------

function getPrefix(threadID) {
  const threadData =
    (global.data && global.data.threadData && global.data.threadData.get(threadID)) || {};
  return threadData.PREFIX || (global.config && global.config.PREFIX) || "/";
}

function usage(p) {
  return (
    "📌 Pinterest\n\n" +
    `• ${p}pin mahi name fb dpz\n   → dpz images\n` +
    `• ${p}pin mahi name dpz - 8\n   → 8 images (max ${MAX_COUNT})\n` +
    `• ${p}pinvid <pinterest link>\n   → video download`
  );
}

function react(api, event, emoji) {
  try {
    api.setMessageReaction(emoji, event.messageID, () => {}, true);
  } catch (e) {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function download(url, filePath) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
    maxContentLength: 60 * 1024 * 1024,
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  await fs.writeFile(filePath, res.data);
}

function cleanup(files) {
  for (const f of files) fs.remove(f).catch(() => {});
}

// ---------- images ----------

async function sendImages(api, event, query, count) {
  const { threadID, messageID } = event;
  const files = [];
  try {
    react(api, event, "⏳");

    const { data } = await axios.get(API_SEARCH, {
      params: { q: query },
      timeout: 30000
    });

    const list = data && Array.isArray(data.result) ? data.result : [];
    const urls = [
      ...new Set(
        list
          .map(r => r && r.images_url)
          .filter(u => typeof u === "string" && /\.(jpe?g|png)$/i.test(u))
      )
    ];

    if (!urls.length) {
      react(api, event, "❌");
      return api.sendMessage(`❌ "${query}" ki koi dpz nahi mili.`, threadID, messageID);
    }

    const stamp = Date.now();
    await Promise.allSettled(
      shuffle(urls)
        .slice(0, count)
        .map(async (u, i) => {
          const file = path.join(CACHE_DIR, `pin_${stamp}_${i}${path.extname(u)}`);
          await download(u, file);
          files.push(file);
        })
    );

    if (!files.length) {
      react(api, event, "❌");
      return api.sendMessage("❌ Images download nahi ho saki, dobara try karo.", threadID, messageID);
    }

    react(api, event, "✅");
    return api.sendMessage(
      {
        body: `📌 ${query}\n🖼️ ${files.length} dpz`,
        attachment: files.map(f => fs.createReadStream(f))
      },
      threadID,
      () => cleanup(files),
      messageID
    );
  } catch (err) {
    cleanup(files);
    react(api, event, "❌");
    console.log("[pin] images error:", err.message);
    return api.sendMessage("❌ Pinterest se dpz lene mein masla aa gaya, thori dair baad try karo.", threadID, messageID);
  }
}

// ---------- video ----------

async function sendVideo(api, event, url) {
  const { threadID, messageID } = event;
  let file = null;
  try {
    react(api, event, "⏳");

    const { data } = await axios.get(API_VIDEO, {
      params: { url },
      timeout: 45000
    });

    const result = data && data.result;
    const videoUrl = result && result.video;
    if (!videoUrl) {
      react(api, event, "❌");
      return api.sendMessage("❌ Is link mein video nahi mili (shayad ye image pin hai).", threadID, messageID);
    }

    const title = result.title && result.title !== "-" ? result.title : "Pinterest Video";

    file = path.join(CACHE_DIR, `pinvid_${Date.now()}.mp4`);
    await download(videoUrl, file);

    const sizeMB = (await fs.stat(file)).size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_MB) {
      cleanup([file]);
      react(api, event, "✅");
      return api.sendMessage(
        `🎬 ${title}\n\nVideo bohat bari hai (${sizeMB.toFixed(1)} MB), direct link:\n${videoUrl}`,
        threadID,
        messageID
      );
    }

    react(api, event, "✅");
    return api.sendMessage(
      { body: `🎬 ${title}`, attachment: fs.createReadStream(file) },
      threadID,
      () => cleanup([file]),
      messageID
    );
  } catch (err) {
    if (file) cleanup([file]);
    react(api, event, "❌");
    console.log("[pin] video error:", err.message);
    return api.sendMessage("❌ Video download nahi ho saki. Link check karo aur dobara try karo.", threadID, messageID);
  }
}

// ---------- /pinvid <link> ----------

module.exports.handleEvent = async function ({ api, event }) {
  const body = event.body;
  if (!body) return;

  const prefix = getPrefix(event.threadID);
  const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = body.trim().match(new RegExp("^" + esc + "pinvid(?:\\s+([\\s\\S]*))?$", "i"));
  if (!m) return;

  if (!claim(event.messageID)) return;

  const url = (m[1] || "").trim().split(/\s+/)[0];
  if (!PIN_URL.test(url)) {
    return api.sendMessage(
      `❌ Pinterest ka link do.\nMisal: ${prefix}pinvid https://pin.it/xxxxxxx`,
      event.threadID,
      event.messageID
    );
  }
  return sendVideo(api, event, url);
};

// ---------- /pin <name> ----------

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!claim(messageID)) return;

  const prefix = getPrefix(threadID);
  const input = args.join(" ").trim();
  if (!input) return api.sendMessage(usage(prefix), threadID, messageID);

  // Agar kisi ne /pin ke saath link de diya to video bhej do
  if (PIN_URL.test(args[0])) return sendVideo(api, event, args[0]);

  let query = input;
  let count = DEFAULT_COUNT;
  const m = input.match(/^(.*?)\s*-\s*(\d+)$/);
  if (m) {
    query = m[1].trim();
    count = Math.min(Math.max(parseInt(m[2], 10), 1), MAX_COUNT);
  }
  if (!query) return api.sendMessage(usage(prefix), threadID, messageID);

  return sendImages(api, event, query, count);
};