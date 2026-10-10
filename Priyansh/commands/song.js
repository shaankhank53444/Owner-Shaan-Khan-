const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
  config: {
    name: "sg",
    aliases: ["music", "sing"],
    version: "1.0.3",
    description: "Download music with song DP and high quality audio",
    usage: "{prefix}song [music name or YouTube URL]",
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    hasPrefix: true,
    permission: "PUBLIC",
    cooldown: 5,
    category: "MEDIA"
  },

  run: async function ({ api, message, args }) {
    const query = (args || []).join(" ").trim();

    if (!query) {
      return api.sendMessage(
        "❌ Please enter a music name or YouTube URL.\n\nExample: !song Believer",
        message.threadID,
        message.messageID
      );
    }

    return this.handleDownload(api, message, query);
  },

  handleEvent: async function ({ api, message }) {
    const { body, messageID, senderID } = message;

    if (!body || !messageID) return;
    if (senderID == api.getCurrentUserID()) return;

    const input = body.trim();
    const prefix = global.config?.prefix || "";

    // Prefix commands are handled ONLY by run()
    if (prefix && input.startsWith(prefix)) return;

    const match = input.match(/^(music|song|sing)\s+(.+)$/i);
    if (!match) return;

    const query = match[2].trim();
    if (!query) return;

    // Prevent duplicate handling of the same message
    if (!global.songProcessedMessages) {
      global.songProcessedMessages = new Set();
    }

    if (global.songProcessedMessages.has(messageID)) return;
    global.songProcessedMessages.add(messageID);

    if (global.songProcessedMessages.size > 500) {
      const oldest = global.songProcessedMessages.values().next().value;
      global.songProcessedMessages.delete(oldest);
    }

    return this.handleDownload(api, message, query);
  },

  handleDownload: async function (api, message, query) {
    const { threadID, messageID } = message;

    // Configure your valid API key here
    const API_KEY = "apim_QTknJB_z";

    const frames = [
      "🌸 ⟢ 𝟭𝟬% ──○──────── ⟣",
      "💜 ⟢ 𝟮𝟬% ────○────── ⟣",
      "💙 ⟢ 𝟰𝟬% ───────○──── ⟣",
      "💚 ⟢ 𝟲𝟬% ─────────○── ⟣",
      "❤️ ⟢ 𝟭𝟬𝟬% ─────────● ⟣"
    ];

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const mp3Path = path.join(cacheDir, `music_${uniqueId}.mp3`);
    const dpPath = path.join(cacheDir, `music_${uniqueId}.jpg`);

    let processingMsgID = null;
    let loadingInterval = null;

    try {
      if (!API_KEY || API_KEY === "YOUR_API_KEY") {
        throw new Error("Please configure your API key.");
      }

      // Set reaction if supported
      if (typeof api.setMessageReaction === "function") {
        api.setMessageReaction("⌛", message
