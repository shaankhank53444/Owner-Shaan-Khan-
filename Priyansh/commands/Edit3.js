const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// form-data package (axios ke sath installed hota hai), warna Node 18+ ka global FormData
let FormData;
try {
  FormData = require("form-data");
} catch (e) {
  FormData = global.FormData;
}

// ---------- NEW API ----------
// curl -X POST "https://my.izuka-api.xyz/api/ai/nanobanana" \
//   -F "prompt=<prompt>" \
//   -F "image=@photo.jpg"
// Response (tested): {"status":true,"result":"https://...jpg","creator":"XRizal"}
const API = "https://my.izuka-api.xyz/api/ai/nanobanana";
const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

module.exports.config = {
  name: "edit3",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Shaan-Amir",
  description: "AI se photo edit karo (NanoBanana API - photo par reply karke prompt likho)",
  commandCategory: "tools",
  usages: "edit <prompt> (kisi photo par reply karke)",
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

// JSON me se image ka link dhoondta hai (result/url/image/... har key me)
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
    for (const key of ["result", "url", "image", "image_url", "imageUrl", "img", "images", "output", "output_url", "data", "link"]) {
      if (key in obj) {
        const found = findUrl(obj[key]);
        if (found) return found;
      }
    }
  }
  return null;
}

// JSON me base64 image dhoondta hai (data:image/... ya base64/b64 wali keys)
function findB64(obj) {
  if (!obj) return null;
  if (typeof obj === "string") {
    if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(obj)) {
      return obj.slice(obj.indexOf(",") + 1);
    }
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findB64(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string" && /(base64|b64)/i.test(key) && val.length > 100) {
        return val.startsWith("data:") ? val.slice(val.indexOf(",") + 1) : val;
      }
      const found = findB64(val);
      if (found) return found;
    }
  }
  return null;
}

// FormData me image append (form-data package aur global FormData dono ke liye)
function appendImage(form, buffer, contentType, filename) {
  if (FormData === global.FormData && typeof Blob !== "undefined") {
    form.append("image", new Blob([buffer], { type: contentType || "image/jpeg" }), filename);
  } else {
    form.append("image", buffer, { filename, contentType: contentType || "image/jpeg" });
  }
}

function formHeaders(form) {
  try {
    if (typeof form.getHeaders === "function") return form.getHeaders();
  } catch (e) {}
  return {}; // global FormData ke sath axios khud content-type set karta hai
}

// ---------- command ----------

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;
  const prefix = getPrefix(threadID);
  const cmd = module.exports.config.name;
  const prompt = args.join(" ").trim();

  // Photo 2 tarah se aa sakti hai: reply par, ya usi message ke sath
  const photo =
    (messageReply && messageReply.attachments &&
      messageReply.attachments.find(a => a.type === "photo")) ||
    (event.attachments && event.attachments.find(a => a.type === "photo"));

  if (!photo || !prompt) {
    return api.sendMessage(
      "🎨 AI Photo Edit (NanoBanana)\n\n" +
        "1. Pehle koi photo bhejo (ya kisi purani photo par reply karo)\n" +
        `2. Us photo par reply karke likho:\n   ${prefix}${cmd} <kya badalna hai>\n\n` +
        `Misal: ${prefix}${cmd} change background to beach\n` +
        "(English prompt se behtar result aata hai)",
      threadID,
      messageID
    );
  }

  let file = null;
  try {
    react(api, event, "⏳");

    // 1) User ki photo download karo (naya API file upload leta hai, URL nahi)
    const src = await axios.get(photo.url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const photoBuf = Buffer.from(src.data);
    const photoType = String(src.headers["content-type"] || "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!photoBuf.length) throw new Error("User ki photo download nahi hui");
    if (/text\/|html/.test(photoType)) {
      throw new Error("Photo ka link expire ho gaya hai, nayi photo par reply karo");
    }

    // 2) Nanobanana API ko multipart/form-data me POST karo:
    //    -F "prompt=..."  -F "image=@file.jpg"
    const form = new FormData();
    form.append("prompt", prompt);
    appendImage(form, photoBuf, photoType, `photo${extFromType(photoType)}`);

    const res = await axios.post(API, form, {
      headers: { ...formHeaders(form), "User-Agent": "Mozilla/5.0" },
      responseType: "arraybuffer",
      timeout: 180000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: Infinity
    });

    let buffer;
    let type = String(res.headers["content-type"] || "").toLowerCase();

    if (type.startsWith("image/")) {
      // API ne seedha image di (ho sakta hai kabhi aisa bhi de)
      buffer = Buffer.from(res.data);
    } else {
      // API ne JSON diya: {"status":true,"result":"https://....jpg"}
      const text = Buffer.from(res.data).toString("utf8");
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (e) {}

      if (json && json.status === false) {
        throw new Error(json.message || json.error || "API ne edit reject kar diya");
      }

      const imgUrl = findUrl(json) ||
        (text.match(/https?:\/\/[^\s"']+\.(?:png|jpe?g|webp)(?:\?[^\s"']*)?/i) || [])[0];

      if (imgUrl) {
        // 3) Edited image ka link download karo
        const img = await axios.get(imgUrl, {
          responseType: "arraybuffer",
          timeout: 90000,
          maxContentLength: 50 * 1024 * 1024,
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        buffer = Buffer.from(img.data);
        type = String(img.headers["content-type"] || "image/jpeg").toLowerCase();
      } else {
        const b64 = findB64(json);
        if (b64) {
          buffer = Buffer.from(b64, "base64");
          type = "image/png";
        }
      }

      if (!buffer || !buffer.length) {
        console.log("[edit] unexpected response:", type, text.slice(0, 300));
        throw new Error("API ne image nahi di");
      }
    }

    if (!buffer || !buffer.length) throw new Error("Khali image mili");

    file = path.join(CACHE_DIR, `edit_${Date.now()}${extFromType(type)}`);
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
    let detail = err.message || "";
    if (err.response) {
      try {
        const t = Buffer.from(err.response.data).toString("utf8").slice(0, 300);
        detail += " | HTTP " + err.response.status + " | " + t;
      } catch (e) {}
    }
    console.log("[edit] error:", detail);
    return api.sendMessage(
      "❌ Photo edit nahi ho saki. Thori dair baad dobara try karo, ya prompt badal kar dekho.",
      threadID,
      messageID
    );
  }
};