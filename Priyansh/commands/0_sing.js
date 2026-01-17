const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

let nodeID3;
try {
    nodeID3 = require("node-id3"); // Agar install hai toh use hoga, nahi toh skip
} catch (e) {
    console.log("⚠️ node-id3 module nahi mila, metadata skip ho jayega.");
}

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports.config = {
  name: "sing",
  version: "0.1.1",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Music with optional metadata fix",
  commandCategory: "music",
  usages: "sing <song name>",
  cooldowns: 5
};

async function handleMusic(api, event, query) {
  const { threadID, messageID } = event;
  const waiting = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);
  const filePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);

  try {
    await fs.ensureDir(path.join(__dirname, "cache"));
    const configRes = await axios.get(nix);
    let baseApi = configRes.data.api;
    if (baseApi.endsWith("/")) baseApi = baseApi.slice(0, -1);

    const search = await yts(query);
    if (!search.videos.length) throw new Error("No results found.");
    const video = search.videos[0];

    const apiUrl = `${baseApi}/play?url=${encodeURIComponent(video.url)}`;
    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.downloadUrl || res.data.link;

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'arraybuffer'
    });

    let buffer = response.data;

    // Sirf tab apply hoga agar module install hai
    if (nodeID3) {
        const tags = { title: video.title, artist: "SHAAN KHAN", image: video.thumbnail };
        buffer = nodeID3.write(tags, buffer);
    }

    fs.writeFileSync(filePath, buffer);

    await api.sendMessage({
        body: `🖤Title: ${video.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`,
        attachment: fs.createReadStream(filePath)
    }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(waiting.messageID);
    }, messageID);

  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    api.unsendMessage(waiting.messageID);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
}

module.exports.run = async function({ api, event, args }) {
    return handleMusic(api, event, args.join(" "));
};
