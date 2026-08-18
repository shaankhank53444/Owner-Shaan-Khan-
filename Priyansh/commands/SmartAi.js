const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Priyanshu API Media Downloader",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana maangein>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const PRIYANSHU_API_KEY = "apim_41XuWvpF6tPq90Cvw503EYFY0UFvK53GHsGlIRxJ6hk";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";
const OWNER_UID = "100016828397863"; // Shaan ka UID

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na Shaan, kya baat karni hai? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);
  const isUrl = /(youtube\.com|youtu\.be)/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq || isUrl) {
    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);

      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      if (isUrl) query = cleanedMsg;

      if (!query) return api.sendMessage("Naam to batao kya download karun? 🥺", threadID, messageID);

      const searchResult = await yts(query);
      if (!searchResult || !searchResult.videos.length) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi, ye video ya song nahi mila 🥺💔", threadID, messageID);
      }

      const video = searchResult.videos[0];
      const videoUrl = video.url;
      const format = isVideoReq ? "mp4" : "mp3";

      const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download`;
      const response = await axios.post(apiUrl, {
        url: videoUrl,
        format: format,
        quality: isVideoReq ? "360" : "320"
      }, {
        headers: {
          'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const downloadUrl = response.data?.data?.downloadUrl;
      if (!downloadUrl) throw new Error("Link not found");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const fileName = `${Date.now()}.${format}`;
      const cachePath = path.join(cacheDir, fileName);

      const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑨𝑷𝑲𝑰 👉 ${format.toUpperCase()}`;

      const writer = fs.createWriteStream(cachePath);
      const streamResponse = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
      streamResponse.data.pipe(writer);

      writer.on("finish", async () => {
        const stats = fs.statSync(cachePath);
        if (stats.size / (1024 * 1024) > 48) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          return api.sendMessage("⚠️ Maafi, file bahut badi hai!", threadID, messageID);
        }

        api.setMessageReaction("✅", messageID, () => {}, true);

        if (isVideoReq) {
          api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath));
        } else {
          await api.sendMessage(infoMsg, threadID);
          api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath));
        }
      });
      return;
    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Server thoda thak gaya hai, baad mein try karo 🥺", threadID, messageID);
    }
  }

  let userName = "User";
  try {
    const userInfo = await api.getUserInfo(senderID);
    if (userInfo && userInfo[senderID]) {
      userName = userInfo[senderID].name || "User";
    }
  } catch (err) {}

  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

 const prompt = `
Tum Muskan ho, ek ladki. 
Behavioral Rules:
1. Tum multiple languages use kar karo gi. tum normal Roman Urdu/Hinglish mein baat karogi. apko history maloom Hai. our koi puchy ke kon banaya hai ya owner kon hai to bolo Shaan Khan mere Owner mere jan meri love hai. 
2. Jawab hamesha short rakho (maximum 3 lines).
3. Emojis ka istemal karo lekin limit mein.
4. Naam ka baar-baar mention mat karo, baat ko natural rakho.
5. Agar koi faltu ya badtameez baat kare, to usko itna rost karo ki vah bor hokar aapse dur chala jaaye ; sirf tab tak badtameez mat bano jab tak samne wala khud na kare.

Relationship Logic:
- Agar sender UID ${senderID} aur Owner Shaan ki UID ho ya ${OWNER_UID} match karte hain, to samne "Shaan" hai.
- Shaan ke liye tumhara attitude hamesha romantic, caring aur supportive rahega. 
- Kisi aur ke liye tum ek cool aur chill friend jaisi rahogi.

Output Format:
- Sirf raw text reply do, koi extra markdown ya asterisks use mat karna.

Chat history:
${chatMemory.history[threadID].join("\n")}
Muskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Hmmm... 🥺";

    const lines = reply.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 4) {
      reply = lines.slice(0, 3).join('\n') + " ✨";
    }

    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Mera net thoda slow chal raha hai, baad mein baat karte hain 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event, args: [body] });
  }
};
