const axios = require("axios");
const yts = require("yt-search");

// 🔒 CREDIT LOCK SYSTEM
const CREDIT = "Shaan Khan";
if (module.exports?.config?.credits && module.exports.config.credits !== CREDIT) {
  throw new Error(
    "\n❌ CREDIT LOCK ACTIVATED!\nOnly Shaan Khan is allowed to edit this file.\n"
  );
}

// 🌐 API Loader
const baseApiUrl = async () => {
  try {
    const base = await axios.get(
      "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json"
    );
    return base.data.api;
  } catch (e) {
    return "https://dipto-api.onrender.com"; // Fallback URL
  }
};

(async () => {
  global.apis = {
    diptoApi: await baseApiUrl()
  };
})();

// 🎥 Stream helper
async function getStreamFromURL(url, pathName) {
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 60000
  });
  response.data.path = pathName;
  return response.data;
}

// 🎯 YouTube ID
function getVideoID(url) {
  const regex =
    /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/* ⚙ CONFIG */
module.exports.config = {
  name: "video",
  version: "2.6.0",
  credits: "Shaan Khan",
  hasPermssion: 0,
  cooldowns: 5,
  description: "YouTube video download with optimized connection",
  commandCategory: "media",
  usages: "video <name | link>"
};

/* ================= RUN ================= */
module.exports.run = async function ({ api, args, event }) {
  try {
    if (!args[0]) {
      return api.sendMessage(
        "❌ Video ka naam ya YouTube link do",
        event.threadID,
        event.messageID
      );
    }

    const input = args.join(" ");
    const loading = await api.sendMessage(
      "✅ Apki Request Process ho rahi hai, please wait...",
      event.threadID
    );

    let videoID;
    if (input.includes("youtu")) {
      videoID = getVideoID(input);
      if (!videoID) throw new Error("Invalid URL");
    } else {
      const res = await yts(input);
      if (!res.videos.length) throw new Error("No result");
      videoID = res.videos[0].videoId;
    }

    // Increased timeout for stability
    const { data } = await axios.get(
      `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp4&quality=360`,
      { timeout: 60000 }
    );

    if (!data.downloadLink) throw new Error("API failed to return link");

    const shortLink = (
      await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(data.downloadLink)}`
      )
    ).data;

    api.unsendMessage(loading.messageID);

    return api.sendMessage(
      {
        body: `🎬 Title: ${data.title}\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n📺 Quality: 360p\n📥 Link: ${shortLink}`,
        attachment: await getStreamFromURL(data.downloadLink, `${data.title}.mp4`)
      },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error("Video Command Error:", err);
    return api.sendMessage(
      "⚠️ Server busy hai ya API timeout ho gayi. Thodi der baad koshish karein.",
      event.threadID,
      event.messageID
    );
  }
};
