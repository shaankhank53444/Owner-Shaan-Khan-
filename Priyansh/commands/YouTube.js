/**
 * 👑 Owner: 𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍-𝐊
 * »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const SEARCH_URL = "https://azadx69x.is-a.dev/api/youtube-search";
const AUTODL_URL = "https://xsaim8x-xxx-api.onrender.com/api/auto";
const MAX_SIZE = 25 * 1024 * 1024; // Messenger attachment limit (25MB)
const HTTP = { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0" } };
const SIGNATURE = `👑 Owner: 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`;

module.exports.config = {
  name: "youtube",
  version: "2.3.0",
  hasPermssion: 0,
  credits: "𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍-𝐊",
  description: "Search YouTube and download audio/video with autodl engine",
  commandCategory: "media",
  usages: "<search query>",
  cooldowns: 3,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

const react = (api, event, emoji) => {
  try {
    if (api && typeof api.setMessageReaction === "function") {
      api.setMessageReaction(emoji, event.messageID, () => {}, true);
    }
  } catch (e) {}
};

const why = err => err?.response ? `HTTP ${err.response.status}` : (err?.code === "ECONNABORTED" ? "timeout" : (err?.code || err?.message || "unknown"));

module.exports.run = async function ({ api, event, args }) {
  try {
    const query = args.join(" ");
    if (!query) return api.sendMessage("⚠️ Please provide a search query! Example: `youtube Phonk`", event.threadID, event.messageID);

    react(api, event, "⌛️");

    const res = await axios.get(`${SEARCH_URL}?query=${encodeURIComponent(query)}&type=Bazil`, HTTP);
    const results = res?.data?.data?.results;

    if (!Array.isArray(results) || results.length === 0) {
      console.error("[youtube] no results:", JSON.stringify(res?.data)?.slice(0, 300));
      react(api, event, "❌️");
      return api.sendMessage("❌ No results found on YouTube!", event.threadID, event.messageID);
    }

    react(api, event, "✅️");

    let msg = `📺 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐒𝐄𝐀𝐑𝐂𝐇 𝐑𝐄𝐒𝐔𝐋𝐓𝐒 🌸\n` +
              `📌 𝐐𝐮𝐞𝐫𝐲: ${query}\n\n`;

    const listItems = [];
    results.forEach((item, index) => {
      listItems.push(item);
      msg += `[ ${index + 1} ] 🎬 ${item.title}\n` +
             `⏱️ Duration: ${item.duration} | 👁️ Views: ${item.views}\n` +
             `📌 Channel: ${item.channel}\n───────────────────\n`;
    });

    msg += `\n💬 Reply with format:\n👉 video <number> (e.g. video 1)\n👉 audio <number> (e.g. audio 1)\n\n${SIGNATURE}`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
      if (err || !info) return;
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        results: listItems
      });
    }, event.messageID);

  } catch (err) {
    console.error("[youtube] search failed:", why(err), err?.message);
    react(api, event, "❌️");
    return api.sendMessage(`❌ Error occurred while searching YouTube, please try again! (${why(err)})`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  let filePath;
  try {
    const data = handleReply;
    if (!data || !Array.isArray(data.results)) {
      return api.sendMessage("⚠️ Ei search result ta expire hoye geche, abar /youtube dao!", event.threadID, event.messageID);
    }
    const { author, results } = data;
    if (event.senderID !== author) return api.sendMessage("⚠️ You cannot use this search result!", event.threadID, event.messageID);

    const args = String(event.body || "").trim().split(/\s+/);
    const action = args[0]?.toLowerCase();
    const index = parseInt(args[1]) - 1;

    if (!["video", "audio"].includes(action) || isNaN(index) || !results[index]) {
      return api.sendMessage("⚠️ Invalid format! Use: `audio 1` or `video 1`", event.threadID, event.messageID);
    }

    const selectedItem = results[index];
    let downloadUrl = action === "video" ? selectedItem.download_video : selectedItem.download_audio;

    react(api, event, "⌛️");

    // Remove reply listener after selection
    const indexHandle = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID);
    if (indexHandle !== -1) global.client.handleReply.splice(indexHandle, 1);

    // Autodl API fallback if the primary download url is missing
    if (!downloadUrl && selectedItem.url) {
      try {
        const autoRes = await axios.get(`${AUTODL_URL}?url=${encodeURIComponent(selectedItem.url)}`, { ...HTTP, timeout: 60000 });
        if (autoRes.data) {
          downloadUrl = action === "video"
            ? (autoRes.data.high_quality || autoRes.data.low_quality)
            : (autoRes.data.audio || autoRes.data.high_quality);
        }
      } catch (e) {
        console.error("[youtube] autodl fallback failed:", why(e));
      }
    }

    if (!downloadUrl) {
      react(api, event, "❌️");
      return api.sendMessage("❌ Download link not found for this file!", event.threadID, event.messageID);
    }

    const buffer = (await axios.get(downloadUrl, {
      ...HTTP,
      timeout: 180000,
      responseType: "arraybuffer",
      maxContentLength: MAX_SIZE,
      maxBodyLength: MAX_SIZE
    })).data;

    const extension = action === "video" ? "mp4" : "mp3";
    filePath = path.join(__dirname, "cache", `youtube_${Date.now()}.${extension}`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, Buffer.from(buffer));

    react(api, event, "✅️");

    const caption = `📥 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐃 (${action.toUpperCase()}) 🌸\n` +
                    `📌 𝐓𝐢𝐭𝐥𝐞: ${selectedItem.title}\n\n${SIGNATURE}`;

    const file = filePath;
    return api.sendMessage({
      body: caption,
      attachment: fs.createReadStream(file)
    }, event.threadID, () => fs.remove(file).catch(() => {}), event.messageID);

  } catch (err) {
    console.error("[youtube] download failed:", why(err), err?.message);
    if (filePath) fs.remove(filePath).catch(() => {});
    react(api, event, "❌️");
    const tooBig = /maxContentLength|max content length/i.test(err?.message || "");
    return api.sendMessage(tooBig
      ? "❌ File ta onek boro (25MB er beshi). Audio ba chhoto video try koro!"
      : `❌ Failed to download and send the file! (${why(err)})`, event.threadID, event.messageID);
  }
};
