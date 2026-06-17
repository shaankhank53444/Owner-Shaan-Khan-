const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Mixed API Media Downloader",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana/video maangein>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

async function getDiptoApi() {
  const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  return base.data.api;
}

async function getStreamFromURL(url, pathName) {
  const response = await axios.get(url, { responseType: "stream", timeout: 60000 });
  return response.data;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na, kya baat karni hai? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq) {
    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      let query = cleanedMsg.replace(/video|vdo|mp4|film|movie|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      const searchResult = await yts(query);
      if (!searchResult.videos.length) throw new Error("No result");
      const video = searchResult.videos[0];

      if (isVideoReq) {
        const diptoApi = await getDiptoApi();
        const { data } = await axios.get(`${diptoApi}/ytDl3?link=${video.videoId}&format=mp4&quality=360`);
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${data.title}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 VIDEO`;
        await api.sendMessage(infoMsg, threadID);
        return api.sendMessage({ attachment: await getStreamFromURL(data.downloadLink, `${data.title}.mp4`) }, threadID);
      } else {
        const { data } = await axios.post(AUDIO_API, { url: video.url });
        const downloadUrl = data?.result?.download_url || data?.result?.url || data?.result?.video;
        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 MP3`;
        await api.sendMessage(infoMsg, threadID);
        const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);
        const writer = fs.createWriteStream(cachePath);
        (await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' })).data.pipe(writer);
        writer.on("finish", () => {
            api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath));
        });
      }
      api.setMessageReaction("✅", messageID, () => {}, true);
      return;
    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Server thoda busy hai, baad mein try karo 🥺", threadID, messageID);
    }
  }

  // --- AI Chat Logic (Waisa hi jaise tumne pehle rakha tha) ---
  let userName = "User";
  try { const userInfo = await api.getUserInfo(senderID); if (userInfo && userInfo[senderID]) userName = userInfo[senderID].name || "User"; } catch (err) {}
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `System Command: Tum Muskan ho, ek real aur cute larki. Sirf Roman Urdu mein baat karo. Owner UID: 100016828397863.
Context:
${chatMemory.history[threadID].join("\n")}
Muskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Hmmm... 🥺";
    const lines = reply.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 4) reply = lines.slice(0, 3).join('\n') + " ✨";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Mera net slow hai 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event, args: [body] });
  }
};
