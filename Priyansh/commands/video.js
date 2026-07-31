const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
  name: "video",
  version: "4.4.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "YouTube se video download karne ke liye",
  usePrefix: false,
  commandCategory: "Media",
  cooldowns: 10
};

const triggerWords = ["pika", "bot", "shankar"];
const keywordMatchers = ["video", "dikhao", "play", "chalao", "lagao", "clip"];

module.exports.handleEvent = async function ({ api, event }) {
  let message = event.body?.toLowerCase();
  if (!message) return;

  const foundTrigger = triggerWords.find(trigger => message.startsWith(trigger));
  if (!foundTrigger) return;

  let content = message.slice(foundTrigger.length).trim();
  if (!content) return;

  const words = content.split(/\s+/);

  const keywordIndex = words.findIndex(word =>
    keywordMatchers.includes(word)
  );

  if (keywordIndex === -1 || keywordIndex === words.length - 1) return;

  let possibleVideoWords = words.slice(keywordIndex + 1);
  possibleVideoWords = possibleVideoWords.filter(
    word => !keywordMatchers.includes(word)
  );

  const videoName = possibleVideoWords.join(" ").trim();
  if (!videoName) return;

  module.exports.run({
    api,
    event,
    args: videoName.split(" ")
  });
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!args[0]) {
    return api.sendMessage(
      `❌ | Please video ka naam ya link likhen!`,
      threadID,
      messageID
    );
  }

  let searchingMsg;
  try {
    const query = args.join(" ");

    const isUrl =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(query);

    let youtubeUrl;
    let videoTitle = "Video";
    let videoDuration = "N/A";
    let videoAuthor = "N/A";
    let videoViews = "N/A";

    searchingMsg = await api.sendMessage(
      `⌛ Apki Request Jari Hai Please Wait...`,
      threadID,
      messageID
    );

    if (isUrl) {
      youtubeUrl = query.startsWith("http")
        ? query
        : `https://${query}`;
    } else {
      const searchResult = await ytSearch(query);

      if (!searchResult || !searchResult.videos.length) {
        try { api.unsendMessage(searchingMsg.messageID); } catch (_) {}
        return api.sendMessage(
          `❌ | "${query}" ke liye koi video nahi mili.`,
          threadID,
          messageID
        );
      }

      const video = searchResult.videos[0];
      youtubeUrl = video.url;
      videoTitle = video.title;
      videoDuration = video.timestamp || "N/A";
      videoAuthor = video.author?.name || "N/A";
      videoViews = video.views ? video.views.toLocaleString() : "N/A";
    }

    const apiKey = "apim_C1dSo30JMCz-kycDGSTZeNr1Hhiuwg6jJmknrJkh06s";
    const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download`;

    // Quality 360 se badha kar 720 kar di gayi hai
    const res = await axios.post(
      apiUrl,
      { link: youtubeUrl, format: "mp4", videoQuality: "720" },
      {
        headers: { "Authorization": `Bearer ${apiKey}` },
        timeout: 60000
      }
    );

    if (!res.data || !res.data.success) {
      try { api.unsendMessage(searchingMsg.messageID); } catch (_) {}
      return api.sendMessage(`❌ | API Error: Video link nikalne mein masla ho raha hai.`, threadID, messageID);
    }

    const downloadUrl = res.data.data.downloadUrl;
    if (res.data.data.title) {
      videoTitle = res.data.data.title;
    }
    if (res.data.data.duration) videoDuration = res.data.data.duration;
    if (res.data.data.author) videoAuthor = res.data.data.author;

    if (!downloadUrl) {
      try { api.unsendMessage(searchingMsg.messageID); } catch (_) {}
      return api.sendMessage(`❌ | Download URL nahi mila.`, threadID, messageID);
    }

    const cacheDir = path.resolve(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 180000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    fs.writeFileSync(filePath, Buffer.from(response.data, "utf-8"));

    const stat = fs.statSync(filePath);

    if (!stat.size || stat.size < 5000) {
      try { fs.unlinkSync(filePath); } catch (_) {}
      try { api.unsendMessage(searchingMsg.messageID); } catch (_) {}
      return api.sendMessage(`❌ | Download error. Dubara try karein.`, threadID, messageID);
    }

    const messageBody = `🖤𝗧𝗶𝘁𝗹𝗲: ${videoTitle}
⌛𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${videoDuration}
👤𝗔𝗿𝘁𝗶𝘀𝘁: ${videoAuthor}
👁️‍🗨️𝗩𝗶𝗲𝘄𝘀: ${videoViews}

»»𝑶𝑾𝑵𝑬𝑹««★™
»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀

✅ 𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 VIDEO`;

    api.sendMessage(
      {
        body: messageBody,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      (err, info) => {
        try { fs.unlinkSync(filePath); } catch (_) {}
        try { api.unsendMessage(searchingMsg.messageID); } catch (_) {}

        // Done reaction ✅
        if (info && info.messageID) {
          try {
            api.setMessageReaction("✅", info.messageID, (err) => {}, true);
          } catch (e) {}
        }

        if (err) {
          api.sendMessage(`⚠️ | Video send fail: ${err.message}`, threadID);
        }
      }
    );
  } catch (error) {
    console.error(error);
    if (searchingMsg) {
      try { api.unsendMessage(searchingMsg.messageID); } catch (_) {}
    }
    api.sendMessage(`❌ | Error: ${error.message}`, threadID, messageID);
  }
};
