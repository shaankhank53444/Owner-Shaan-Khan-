const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const API_BASE = "https://marix.esite.top".replace(/\/+$/, "");
const API_KEY = "mimg_30278f88f4e1fd103e4414e4bd5db7fcb931cf0e";
const MARIX_TOKEN = "";

const CACHE_DIR = path.join(__dirname, "cache");
const MAX_BYTES = 15 * 1024 * 1024;

const SMALL_CAPS = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ",
  k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ",
  u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
};

function B(str) {
  return String(str).replace(/[a-z]/g, (c) => SMALL_CAPS[c]);
}

const TG_LINE = `📩 ${B("Telegram")} : @miraxAi_bot`;

module.exports = {
  config: {
    name: "undress",
    aliases: ["marix", "img"],
    version: "1.4.1",
    author: "Shaan Khan",
    countDown: 15,
    role: 0, // Mirai standard role (0 for everyone, change if needed)
    shortDescription: {
      en: "AI image-to-image: restyle a photo using a marix template"
    },
    longDescription: {
      en: "AI image-to-image tool with facial and body consistency enforcement."
    },
    category: "image",
    guide: {
      en:
        "{pn} <template name> (reply to / attach a photo)\n" +
        "Example: {pn} anime\n" +
        "{pn} -t → show template list\n" +
        "{pn} -c → show credits left + refresh time"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const prefix = global.data.threadSetting[threadID]?.PREFIX || global.config.PREFIX;

    const text = (args || []).join(" ").trim();
    const urlMatch = text.match(/^https?:\/\/\S+/i);
    const urlInArgs = urlMatch ? urlMatch[0] : null;
    let template = urlInArgs ? text.replace(urlInArgs, "").trim() : text;

    const flag = template.toLowerCase();

    // Check if the user is attempting restricted body modifications (like undress)
    const restrictedKeywords = ["undress", "nude", "naked", "strip"];
    if (restrictedKeywords.some(keyword => flag.includes(keyword))) {
      // Force keeping original body structure constraint by appending a safety context modifier if supported, 
      // or routing it strictly through facial/body consistency parameters.
      template = template.replace(/undress|nude|naked|strip/gi, "").trim();
      if (!template) template = "realistic"; // fallback template to maintain body integrity
    }

    if (flag === "-c") {
      try {
        const quota = await getQuota();
        const lines = quotaLines(quota, true);
        return api.sendMessage(`🎟️ ${B("Marix Credits")}\n\n${lines.join("\n")}`, threadID, messageID);
      } catch (err) {
        return api.sendMessage(limitMessage(err) || `❌ Could not load credits: ${readError(err)}`, threadID, messageID);
      }
    }

    if (flag === "-t") {
      try {
        const templates = await listTemplates();
        const lines = templates.map((t, i) => `${i + 1}. ${t.name}`);
        return api.sendMessage(`🖼️ marix templates (${templates.length})\n\n${lines.join("\n")}`, threadID, messageID);
      } catch (err) {
        return api.sendMessage(`❌ Could not load templates: ${readError(err)}`, threadID, messageID);
      }
    }

    if (!template) {
      return api.sendMessage(
        `🎀 𝗠𝗶𝗿𝗮𝗫 𝗔𝗶\n\n` +
          `${prefix}mirax -t → ${B("template list")}\n` +
          `${prefix}mirax -c → ${B("credits")}`,
        threadID,
        messageID
      );
    }

    let attachment = pickAttachment(event);
    attachment = await resolveAttachment(api, attachment);
    const imageUrl = getUrl(attachment) || urlInArgs;

    if (!imageUrl) {
      return api.sendMessage(
        `📷 Reply to a photo (or attach one / pass an image URL) and name a template.\n` +
          `Usage: ${prefix}mirax <template name>`,
        threadID,
        messageID
      );
    }

    await setReact(api, "⏳", messageID);

    let tmpFile = null;
    let stream = null;
    try {
      const image = await download(imageUrl);
      if (!image.buffer.length) throw new Error("the photo is empty");
      if (image.buffer.length > MAX_BYTES)
        throw new Error(`photo is too large (${image.buffer.length} bytes)`);

      const result = await generate(image, template);
      if (!result || !result.resultUrl) throw new Error("no image returned by API");

      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
      tmpFile = path.join(
        CACHE_DIR,
        `marix-${result.actionId || Date.now()}${extFromUrl(result.resultUrl)}`
      );

      const imgRes = await axios.get(result.resultUrl, {
        responseType: "arraybuffer",
        timeout: 90000
      });
      fs.writeFileSync(tmpFile, Buffer.from(imgRes.data));

      stream = fs.createReadStream(tmpFile);
      stream.on("error", () => {});

      await api.sendMessage({
        body:
          `✅ ${result.template || template}\n` +
          `🖼️ Template: ${result.templateId || "—"}\n` +
          `⏱️ ${result.costTime != null ? result.costTime + "s" : "—"}`,
        attachment: stream
      }, threadID, messageID);

      await setReact(api, "✅", messageID);
    } catch (err) {
      Promise.resolve(api.sendMessage(limitMessage(err) || `❌ Failed: ${readError(err)}`, threadID, messageID)).catch(() => {});
      await setReact(api, "❌", messageID);
    } finally {
      if (stream) stream.destroy();
      if (tmpFile) setTimeout(() => fs.unlink(tmpFile, () => {}), 5000);
    }
  }
};

function fmtDuration(sec) {
  const s = Math.max(1, Math.round(Number(sec) || 0));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}

function refreshText(daily) {
  return fmtDuration(daily.resetsInSec);
}

function quotaLines(q, verbose = false, styled = true) {
  if (!q) return verbose ? [`${B("No limits on this key.")}`] : [];
  const lines = [];

  if (!styled) {
    if (q.revoked) {
      lines.push(`🚫 Key revoked${q.revokedReason ? ` (${q.revokedReason})` : ""}`);
    }
    if (q.credits) {
      const c = q.credits;
      lines.push(`🎟️ Credits: ${c.remaining}/${c.limit} left${c.oneTime ? " (one-time)" : ""}`);
    }
    if (q.daily) {
      const d = q.daily;
      lines.push(`📅 Daily: ${d.remaining}/${d.limit} left`);
      lines.push(`🔄 Refreshes in ${refreshText(d)}`);
    }
    if (q.daysLeft != null) {
      lines.push(`⏳ Key expires in ${Math.max(0, q.daysLeft)}d`);
    }
    return lines;
  }

  if (q.revoked) {
    lines.push(`🚫 ${B(`Key revoked${q.revokedReason ? ` (${q.revokedReason})` : ""}`)}`);
  }

  if (q.daysLeft != null) {
    lines.push(`⏳ ${B(`Key expires in ${Math.max(0, q.daysLeft)}d`)}`);
  } else if (verbose) {
    lines.push(`⏳ ${B("Key never expires")}`);
  }

  if (q.credits) {
    const c = q.credits;
    lines.push(
      `🎟️ ${B(`Credits: ${c.remaining}/${c.limit} left${c.oneTime ? " (one-time)" : ""}`)}`
    );
    if (c.remaining <= 0) lines.push(TG_LINE);
  } else if (verbose) {
    lines.push(`🎟️ ${B("Credits: unlimited")}`);
  }

  if (q.daily) {
    const d = q.daily;
    lines.push(`📅 ${B(`Daily: ${d.remaining}/${d.limit} left`)}`);
    lines.push(`🔄 ${B(`Refreshes in ${refreshText(d)}`)}`);
  } else if (verbose) {
    lines.push(`📅 ${B("Daily: no limit")}`);
  }

  return lines;
}

function limitMessage(err) {
  const body = err && err.response && err.response.data;
  if (!body || typeof body !== "object" || Buffer.isBuffer(body)) return null;
  const q = body.quota || null;

  if (body.code === "daily_limit" && q && q.daily) {
    const out = [
      `⏳ ${B(`Daily limit reached (${q.daily.used}/${q.daily.limit})`)}`,
      `🔄 ${B(`Refreshes in ${refreshText(q.daily)}`)}`
    ];
    if (q.credits) out.push(`🎟️ ${B(`Credits: ${q.credits.remaining}/${q.credits.limit} left`)}`);
    return out.join("\n");
  }
  if (body.code === "key_revoked") {
    const reason =
      q && q.credits && q.revokedReason === "credits used up"
        ? `all ${q.credits.limit} credits are used up`
        : (q && q.revokedReason) || "no longer valid";
    return `🚫 ${B(`This key has been revoked — ${reason}.`)}\n\n${TG_LINE}`;
  }
  if (body.code === "limit_reached") {
    const c = q && q.credits;
    return (
      (c
        ? `🎟️ ${B(`No credits left (${c.remaining}/${c.limit}).`)}`
        : `🎟️ ${B("No credits left.")}`) + `\n\n${TG_LINE}`
    );
  }
  return null;
}

function authHeaders() {
  return API_KEY ? { "x-api-key": API_KEY } : {};
}

function setReact(api, emoji, messageID) {
  return new Promise((resolve) => {
    if (!messageID || typeof api.setMessageReaction !== "function") return resolve();
    try {
      api.setMessageReaction(emoji, messageID, () => resolve(), true);
    } catch (e) {
      resolve();
    }
  });
}

function pickAttachment(event) {
  const rep = (event.messageReply && event.messageReply.attachments) || [];
  if (rep.length && rep[0] && rep[0].url) return rep[0];
  const own = Array.isArray(event.attachments) ? event.attachments : [];
  if (own.length && own[0] && own[0].url) return own[0];
  return rep[0] || own[0] || null;
}

function getUrl(attachment) {
  if (!attachment) return null;
  const candidates = [
    attachment.url,
    attachment.largePreviewUrl,
    attachment.previewUrl,
    attachment.thumbnailUrl,
    attachment.uri,
    attachment.src
  ];
  for (const u of candidates) {
    if (typeof u === "string" && /^https?:\/\//i.test(u)) return u;
  }
  if (
    attachment.payload &&
    typeof attachment.payload.url === "string" &&
    /^https?:\/\//i.test(attachment.payload.url)
  ) {
    return attachment.payload.url;
  }
  return null;
}

async function resolveAttachment(api, attachment) {
  if (!attachment) return null;
  if (
    attachment.isE2EE &&
    !(attachment.url && /^https?:\/\//.test(attachment.url)) &&
    typeof api.resolveE2EEAttachment === "function"
  ) {
    try {
      attachment = await api.resolveE2EEAttachment(attachment);
    } catch (e) {}
  }
  return attachment;
}

function extFromUrl(url) {
  try {
    const raw = path.extname(new URL(url).pathname || "");
    if (raw && raw.length <= 5) return raw;
  } catch (e) {}
  return ".jpg";
}

async function download(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 90000,
    maxContentLength: MAX_BYTES,
    maxBodyLength: MAX_BYTES,
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return { buffer: Buffer.from(res.data), filename: `marix-src${extFromUrl(url)}` };
}

async function listTemplates() {
  const { data } = await axios.get(`${API_BASE}/templates`, {
    timeout: 30000,
    headers: authHeaders()
  });
  if (!data || !data.success) throw new Error((data && data.error) || "could not load templates");
  return data.templates || [];
}

async function getQuota() {
  const { data } = await axios.get(`${API_BASE}/api/quota`, {
    timeout: 30000,
    headers: authHeaders()
  });
  if (!data || !data.success) throw new Error((data && data.error) || "could not load credits");
  return data.quota || null;
}

async function generate(image, template) {
  const form = new FormData();
  form.append("image", image.buffer, { filename: image.filename });
  form.append("template", template);
  if (MARIX_TOKEN) form.append("token", MARIX_TOKEN);

  const { data } = await axios.post(`${API_BASE}/api/myimg`, form, {
    timeout: 300000,
    maxBodyLength: MAX_BYTES * 2,
    headers: { ...form.getHeaders(), ...authHeaders() }
  });

  if (!data || !data.success) throw new Error((data && data.error) => "generation failed");
  return { ...data.result, quota: data.quota || null };
}

function readError(err) {
  const body = err && err.response && err.response.data;
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    if (typeof body.error === "string") return body.error;
    if (body.detail) return typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
  }
  if (Buffer.isBuffer(body)) {
    try {
      const j = JSON.parse(body.toString());
      if (j.error) return j.error;
    } catch (e) {}
  }
  return (err && err.message) || "unknown error";
}
