const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "Video",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ArYAN",
  description: "Download YouTube video",
  commandCategory: "media",
  usages: "/video <song name or link>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  if (!args.length)
    return api.sendMessage("❌ Provide a song name or YouTube URL.", event.threadID, event.messageID);

  const query = args.join(" ");
  const wait = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID);

  try {
    let videoURL;

    if (query.startsWith("http")) {
      videoURL = query;
    } else {
      const search = await yts(query);
      if (!search.videos.length) throw new Error("No results found.");
      videoURL = search.videos[0].url;
    }

    const apiURL = `http://65.109.80.126:20409/aryan/yx?url=${encodeURIComponent(videoURL)}&type=mp4`;

    const res = await axios.get(apiURL);
    const dl = res.data.download_url;

    if (!res.data.status || !dl) throw new Error("API failed");

    const filePath = path.join(__dirname, `video_${Date.now()}.mp4`);
    const writer = fs.createWriteStream(filePath);

    const stream = await axios({ url: dl, responseType: "stream" });
    stream.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await api.sendMessage(
      {
        body: " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝑽𝑰𝑫𝑬𝑶",
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => {
        fs.unlinkSync(filePath);
        api.unsendMessage(wait.messageID);
      },
      event.messageID
    );

  } catch (err) {
    api.unsendMessage(wait.messageID);
    api.sendMessage("❌ Failed to load video: " + err.message, event.threadID, event.messageID);
  }
};