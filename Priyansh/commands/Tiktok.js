const axios = require("axios");

module.exports.config = {
name: "tiktok",
version: "1.0.3",
hasPermssion: 0,
credits: "Shaan Khan",
description: "Search and download TikTok videos",
commandCategory: "search",
usages: "tiktok <keyword>",
cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
const query = args.join(" ").trim();
const apiUrl = "https://uzairtikdown.dpdns.org/api/downloader";

const setReaction = (emoji) => {
api.setMessageReaction(
emoji,
event.messageID,
() => {},
true
);
};

if (!query) {
return api.sendMessage(
"❌ Please enter a keyword.\nExample: tiktok travel Pakistan",
event.threadID,
event.messageID
);
}

try {
setReaction("⏳");

// Search TikTok using POST; return up to 5 results
const searchResponse = await axios.post(
  apiUrl,
  {
    keywords: query,
    limit: 5
  },
  {
    headers: {
      "Content-Type": "application/json"
    },
    timeout: 30000
  }
);

const searchData = searchResponse.data;
const results = searchData?.search?.results || [];

if (!searchData?.success || results.length === 0) {
  setReaction("❌");

  return api.sendMessage(
    `❌ No TikTok results found for "${query}".`,
    event.threadID,
    event.messageID
  );
}

// Select the first result
const video = results[0];
const tiktokUrl = video.tiktokUrl;

if (!tiktokUrl) {
  throw new Error("TikTok URL missing from search result.");
}

// Request video download information using POST
const downloadResponse = await axios.post(
  apiUrl,
  {
    url: tiktokUrl
  },
  {
    headers: {
      "Content-Type": "application/json"
    },
    timeout: 30000
  }
);

const downloadData = downloadResponse.data;

const videoUrl =
  downloadData?.download?.downloadUrls?.video ||
  downloadData?.download?.media?.videoUrl;

if (!downloadData?.success || !videoUrl) {
  throw new Error("Video URL was not returned by the API.");
}

// Fetch the video as a stream
const videoResponse = await axios.get(videoUrl, {
  responseType: "stream",
  timeout: 60000,
  maxRedirects: 5
});

const title = video.description || "TikTok Video";
const username =
  video.username ||
  video.displayName ||
  "Unknown";

// Send the video to Messenger
api.sendMessage(
  {
    body:
      `🎵 TikTok Video\n\n` +
      `📝 ${title}\n` +
      `👤 ${username}\n` +
      `🔎 Keyword: ${query}\n` +
      `📊 Results found: ${results.length}`,
    attachment: videoResponse.data
  },
  event.threadID,
  (err) => {
    if (err) {
      console.error("Messenger send error:", err);
      setReaction("❌");
    } else {
      setReaction("✅");
    }
  },
  event.messageID
);

} catch (error) {
console.error(
"TikTok command error:",
error.response?.data || error.message
);

setReaction("❌");

return api.sendMessage(
  "❌ TikTok video fetch nahi ho saka.\n" +
    `Reason: ${error.message}`,
  event.threadID,
  event.messageID
);

}
};