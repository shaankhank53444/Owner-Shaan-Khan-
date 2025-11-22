const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "song",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Download YouTube video",
  commandCategory: "media",
  usages: "/video <song name or link>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args.length)
    return api.sendMessage("❌ Provide a song name or YouTube URL.", threadID, messageID);

  const query = args.join(" ");

  const waiting = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", threadID);

  try {
    let videoURL;

    if (query.startsWith("http")) {
      videoURL = query;
    } else {
      const s = await yts(query);
      if (!s.videos.length) throw new Error("No results.");
      videoURL = s.videos[0].url;
    }

    const apiURL = `http://65.109.80.126:20409/aryan/yx?url=${encodeURIComponent(videoURL)}&type=mp4`;
    const res = await axios.get(apiURL);

    if (!res.data.status || !res.data.download_url)
      throw new Error("API error");

    const dl = res.data.download_url;
    const file = path.join(__dirname, `video_${Date.now()}.mp4`);

    const stream = await axios({ url: dl, responseType: "stream" });
    const writer = fs.createWriteStream(file);
    stream.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await api.sendMessage(
      {
        body: " »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝑽𝑰𝑫𝑬𝑶",
        attachment: fs.createReadStream(file)
      },
      threadID,
      () => {
        fs.unlinkSync(file);
        api.unsendMessage(waiting.messageID);
      },
      messageID
    );

  } catch (err) {
    api.unsendMessage(waiting.messageID);
    api.sendMessage("❌ Failed: " + err.message, threadID, messageID);
  }
};