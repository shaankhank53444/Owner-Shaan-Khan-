const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API = "https://api-faa.my.id/faa/editfoto";
const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

module.exports.config = {
  name: "edit",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mian Amir",
  description: "AI se photo edit karo (photo par reply karke prompt likho)",
  commandCategory: "tools",
  usages: "editfoto <prompt>  (kisi photo par reply karke)",
  cooldowns: 10
};

// ---------- helpers ----------

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

function extFromType(type) {
  if (/jpe?g/i.test(type)) return ".jpg";
  if (/webp/i.test(type)) return ".webp";
  return ".png";
}

// API agar JSON de to usme se image ka link dhoondta hai
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
    for (const key of ["result", "url", "image", "image_url", "imageUrl", "output", "data", "link"]) {
      const found = findUrl(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

// ---------- command ----------

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;
  const prefix = getPrefix(threadID);
  const prompt = args.join(" ").trim();

  const photo =
    messageReply &&
    messageReply.attachments &&
    messageReply.attachments.find(a => a.type === "photo");

  if (!photo || !prompt) {
    return api.sendMessage(
      "🎨 AI Photo Edit\n\n" +
        "1. Pehle koi photo bhejo (ya kisi purani photo par reply karo)\n" +
        `2. Us photo par reply karke likho:\n   ${prefix}editfoto <kya badalna hai>\n\n` +
        `Misal: ${prefix}editfoto change background to beach\n` +
        "(English prompt se behtar result aata hai)",
      threadID,
      messageID
    );
  }

  let file = null;
  try {
    react(api, event, "⏳");

    const res = await axios.get(API, {
      params: { url: photo.url, prompt },
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: 50 * 1024 * 1024,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let buffer;
    let type = String(res.headers["content-type"] || "");

    if (type.startsWith("image/")) {
      // API ne seedha image di
      buffer = Buffer.from(res.data);
    } else {
      // API ne JSON diya, usme se image ka link nikalo
      const text = Buffer.from(res.data).toString("utf8");
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (e) {}

      const imgUrl = findUrl(json);
      if (!imgUrl) {
        console.log("[editfoto] unexpected response:", type, text.slice(0, 300));
        throw new Error("API ne image nahi di");
      }

      const img = await axios.get(imgUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      buffer = Buffer.from(img.data);
      type = String(img.headers["content-type"] || "");
    }

    if (!buffer || !buffer.length) throw new Error("Khali image mili");

    file = path.join(CACHE_DIR, `editfoto_${Date.now()}${extFromType(type)}`);
    await fs.writeFile(file, buffer);

    react(api, event, "✅");
    return api.sendMessage(
      {
        body: `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 IMAGE!\n📝 ${prompt}`,
        attachment: fs.createReadStream(file)
      },
      threadID,
      () => fs.remove(file).catch(() => {}),
      messageID
    );
  } catch (err) {
    if (file) fs.remove(file).catch(() => {});
    react(api, event, "❌");
    console.log("[editfoto] error:", err.message);
    return api.sendMessage(
      "❌ Photo edit nahi ho saki. Thori dair baad dobara try karo, ya prompt badal kar dekho.",
      threadID,
      messageID
    );
  }
};