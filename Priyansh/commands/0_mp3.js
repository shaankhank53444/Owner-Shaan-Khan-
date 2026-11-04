const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let yts = null;
try {
  yts = require("yt-search");
} catch (e) {}

const API = "https://yt-mian-amir.vercel.app/api/link";
const MAX_FILE_MB = 25;          // Messenger ki limit
const MAX_AUDIO_SEC = 20 * 60;   // 20 minute max audio
const MAX_VIDEO_SEC = 10 * 60;   // 10 minute max video
const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

const YT_URL = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/\S+/i;

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
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Gaana mp3 mein ya video 360p mein bhejo",
  commandCategory: "media",
  usages: "mp3 <gaane ka naam> | mp3video <gaane ka naam>",
  cooldowns: 5
};

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

function matchCmd(event, prefix, name) {
  const body = (event.body || "").trim();
  const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = body.match(new RegExp("^" + esc + name + "(?:\\s+([\\s\\S]*))?$", "i"));
  return m ? (m[1] || "").trim() : null;
}

// API response se download link nikalne ka behtareen tareeqa
async function getDownloadUrl(videoUrl, format) {
  try {
    const targetAPI = `${API}?url=${encodeURIComponent(videoUrl)}&format=${format}`;
    const res = await axios.get(targetAPI, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      timeout:
