const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// API Endpoints
const AUDIO_API = "https://uzair-rajput-new-music-api-all-in-one.onrender.com/download/dlmp3";
const YT_SEARCH = "https://uzair-rajput-new-music-api-all-in-one.onrender.com/api/search";

module.exports.config = {
  name: "song",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube song downloader",
  commandCategory: "utility",
  usages: "[Song Name/URL]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");
  let searchMsgID = null;

  if (!query) {
    return api.sendMessage("❌ Please provide a song name or YouTube link!", threadID, messageID);
  }

  // Cache folder location setting
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const filePath = path.join(cacheDir, `song_${Date.now()}.mp3`);

  try {
    // Step 1: Loading Message
    const infoMsg = await api.sendMessage("⏳ Finding your song, please wait...", threadID);
    searchMsgID = infoMsg.messageID;

    let videoURL = query;
    const isURL = /^(http(s)?:\/\/)?((w{3}\.)?youtu(be|.be)?(\.com)?)\/.+/;

    // Step 2: Search if not a URL
    if (!isURL.test(query)) {
      const searchRes = await axios.get(YT_SEARCH, {
        params: { query: query },
        timeout: 20000
      });

      const videos = searchRes.data?.result || searchRes.data?.items || searchRes.data;
      const video = Array.isArray(videos) ? videos[0] : videos;

      if (!video || (!video.url && !video.link)) {
        if (searchMsgID) api.unsendMessage(searchMsgID);
        return api.sendMessage("❌ No results found for your search.", threadID, messageID);
      }
      videoURL = video.url || video.link;
    }

    // Step 3: Get Download Link
    const downloadRes = await axios.get(AUDIO_API, {
      params: { url: videoURL },
      timeout: 60000
    });

    const songData = downloadRes.data?.result || downloadRes.data?.data || downloadRes.data;
    const downloadLink = songData?.downloadUrl || songData?.url || songData?.link;
    const title = songData?.title || "Song";

    if (!downloadLink) {
      if (searchMsgID) api.unsendMessage(searchMsgID);
      return api.sendMessage("⚠️ Could not generate a download link. Try another song.", threadID, messageID);
    }

    // Step 4: Stream audio straight to disk (Fixes utf-8 audio corruption)
    const streamRes = await axios({
      method: "GET",
      url: downloadLink,
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    streamRes.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (searchMsgID) api.unsendMessage(searchMsgID);

    // Step 5: Send message with file attachment
    return api.sendMessage(
      {
        body: `🎵 Title: ${title}\n\n━━━━━━━━━━━━━\n✨ Enjoy your music!`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      },
      messageID
    );

  } catch (error) {
    if (searchMsgID) api.unsendMessage(searchMsgID);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    console.error(`[SONG COMMAND ERROR]`, error);

    let errorMsg = "⚠️ Server is busy or API returned an error.";
    if (error.response?.status === 400) {
      errorMsg = "⚠️ API Error 400: The video might be too long or restricted.";
    }

    return api.sendMessage(`${errorMsg} (Details: ${error.message})`, threadID, messageID);
  }
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;

  if (body.toLowerCase().startsWith("song ")) {
    const query = body.slice(5).trim();
    if (!query) return;

    // Avoid triggering if prefix is present
    const prefix = global.config?.PREFIX || "!";
    if (body.startsWith(prefix)) return;

    return this.run({
      api,
      event,
      args: query.split(" ")
    });
  }
};
