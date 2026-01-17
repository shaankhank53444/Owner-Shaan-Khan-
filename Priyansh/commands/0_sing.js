const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

let nodeID3;
try {
    nodeID3 = require("node-id3");
} catch (e) {
    console.log("⚠️ node-id3 missing, metadata skipped.");
}

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports.config = {
  name: "sing",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Supports Prefix & No-Prefix | Fixed Title for E2EE",
  commandCategory: "music",
  usages: "sing <song name>",
  cooldowns: 2
};

async function handleMusic(api, event, query) {
  const { threadID, messageID } = event;
  if (!query) return api.sendMessage("❌ Please provide a song name!", threadID, messageID);

  const waiting = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

  try {
    // 1. Get API URL
    const configRes = await axios.get(nix);
    let baseApi = configRes.data.api;
    if (baseApi.endsWith("/")) baseApi = baseApi.slice(0, -1);

    // 2. Search Song
    const search = await yts(query);
    if (!search.videos.length) throw new Error("No results found.");
    const video = search.videos[0];
    
    // Title clean karein (special characters remove karein taaki file system error na de)
    const cleanTitle = video.title.replace(/[^\w\s]/gi, '');
    const filePath = path.join(__dirname, "cache", `${cleanTitle}.mp3`);
    await fs.ensureDir(path.join(__dirname, "cache"));

    // 3. Get Download Link
    const apiUrl = `${baseApi}/play?url=${encodeURIComponent(video.url)}`;
    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.downloadUrl || res.data.link || res.data.data?.downloadUrl;

    if (!downloadUrl) throw new Error("Download link not found.");

    // 4. Download as Buffer for Metadata
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'arraybuffer'
    });

    let buffer = response.data;

    // 5. Apply ID3 Tags
    if (nodeID3) {
        const tags = {
            title: video.title,
            artist: "SHAAN KHAN",
            image: video.thumbnail
        };
        buffer = nodeID3.write(tags, buffer);
    }

    fs.writeFileSync(filePath, buffer);

    // 6. Send File
    await api.sendMessage({
        body: `🖤Title: ${video.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`,
        attachment: fs.createReadStream(filePath)
    }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(waiting.messageID);
    }, messageID);

  } catch (err) {
    console.error(err);
    if (waiting.messageID) api.unsendMessage(waiting.messageID);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
}

// --- PREFIX & NO-PREFIX SUPPORT ---

module.exports.handleEvent = async function ({ api, event }) {
  const { body, threadID, messageID } = event;
  if (!body) return;
  
  const args = body.split(/\s+/);
  const command = args.shift().toLowerCase();
  
  // Bina prefix ke 'sing' check karega
  if (command === "sing") {
    return handleMusic(api, event, args.join(" "));
  }
};

module.exports.run = async function ({ api, event, args }) {
  // Prefix ke sath (e.g. /sing)
  return handleMusic(api, event, args.join(" "));
};
