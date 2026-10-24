const axios = require("axios");

module.exports.config = {
  name: "Tiktok",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search and download TikTok videos",
  commandCategory: "search",
  usages: "tiktok <keyword or TikTok URL>",
  cooldowns: 5,
};

const API_URL = "https://uzairtikdown.dpdns.org/api/downloader";
const API_BASE_URL = "https://uzairtikdown.dpdns.org";

module.exports.run = async function ({ api, event, args }) {
  const query = args.join(" ").trim();
  let stage = "TikTok request";

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
      "❌ Please enter a keyword or TikTok URL.\n\n" +
      "Examples:\n" +
      "tiktok funny videos\n" +
      "tiktok https://vt.tiktok.com/VIDEO_LINK/",
      event.threadID,
      event.messageID
    );
  }

  try {
    setReaction("⏳");

    // Check if input is a direct URL
    let inputUrl = null;
    try {
      const parsed = new URL(query);
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === "tiktok.com" ||
        hostname.endsWith(".tiktok.com")
      ) {
        inputUrl = parsed.href;
      }
    } catch (_) {}

    // If it's a keyword search, send the requested search message first
    if (!inputUrl) {
      api.sendMessage(
        `⏳ Apki TikTok Video Dhond Rahi Hoon Thora Wait Karo...`,
        event.threadID,
        event.messageID
      );
    }

    let video = {};
    let rawVideoUrl = null;
    let displayTitle = "TikTok Video";
    let displayUsername = "Unknown";

    if (inputUrl) {
      // Direct URL mode
      stage = "TikTok URL download";

      const response = await axios.post(
        API_URL,
        { url: inputUrl },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 45000,
        }
      );

      const data = response.data;
      const download = data?.download || data;

      if (!data?.success) {
        throw new Error(
          data?.message || "Direct URL download failed."
        );
      }

      // Check all possible keys for unwatermarked / official video stream URL
      rawVideoUrl =
        download?.downloadUrls?.noWatermark ||
        download?.downloadUrls?.video ||
        download?.media?.noWatermark ||
        download?.media?.videoUrl ||
        download?.videoUrl ||
        download?.video;

      displayTitle =
        download?.description ||
        download?.title ||
        "TikTok Video";

      displayUsername =
        download?.username ||
        download?.author?.username ||
        download?.author?.nickname ||
        "Unknown";

      if (!rawVideoUrl) {
        throw new Error(
          "API did not return a video URL for this TikTok link."
        );
      }
    } else {
      // Keyword search mode
      stage = "TikTok search";

      const searchResponse = await axios.post(
        API_URL,
        {
          keywords: query,
          limit: 5,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 45000,
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

      // Match the video closely based on the search query title/description
      const lowerQuery = query.toLowerCase();
      video = results.find(
        (item) =>
          typeof item.tiktokUrl === "string" &&
          item.tiktokUrl.trim() !== "" &&
          (item.description || "").toLowerCase().includes(lowerQuery)
      );

      // Fallback to the first available valid video if no direct text match found
      if (!video) {
        video = results.find(
          (item) =>
            typeof item.tiktokUrl === "string" &&
            item.tiktokUrl.trim() !== ""
        );
      }

      if (!video) {
        throw new Error(
          "No valid TikTok URL in search results."
        );
      }

      displayTitle =
        video.description || "TikTok Video";

      displayUsername =
        video.username ||
        video.displayName ||
        "Unknown";

      // Try grabbing noWatermark link directly from search result if available
      rawVideoUrl =
        video.downloadUrls?.noWatermark ||
        video.downloadUrls?.video;

      // If missing or pointing to watermarked/generic, fetch full details via tiktokUrl endpoint
      if (!rawVideoUrl || video.tiktokUrl) {
        stage = "Search result video resolve";

        const downloadResponse = await axios.post(
          API_URL,
          { url: video.tiktokUrl },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 45000,
          }
        );

        const downloadData = downloadResponse.data;
        const download =
          downloadData?.download || downloadData;

        if (downloadData?.success) {
          rawVideoUrl =
            download?.downloadUrls?.noWatermark ||
            download?.downloadUrls?.video ||
            download?.media?.noWatermark ||
            download?.media?.videoUrl ||
            download?.videoUrl ||
            download?.video;
        }
      }

      if (!rawVideoUrl) {
        throw new Error(
          "Video URL was not returned by the API."
        );
      }
    }

    const resolvedVideoUrl = new URL(
      rawVideoUrl,
      `${API_BASE_URL}/`
    );

    if (resolvedVideoUrl.protocol !== "https:") {
      throw new Error(
        "Unsupported video URL protocol."
      );
    }

    stage = "Video download";

    const videoResponse = await axios.get(
      resolvedVideoUrl.href,
      {
        responseType: "stream",
        timeout: 120000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const contentType =
      videoResponse.headers["content-type"] || "";

    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json")
    ) {
      videoResponse.data.destroy();

      throw new Error(
        "API returned a webpage instead of a video."
      );
    }

    stage = "Messenger send";

    return api.sendMessage(
      {
        body:
          `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 TIKTOK-VIDDEO\n\n` +
          `🎵 TikTok Video\n\n` +
          `📝 ${displayTitle}\n` +
          `👤 ${displayUsername}\n` +
          `🔎 ${inputUrl ? "URL" : "Keyword"}: ${query}`,
        attachment: videoResponse.data,
      },
      event.threadID,
      (err) => {
        if (err) {
          console.error(
            "Messenger send error:",
            err.message || err
          );

          setReaction("❌");
        } else {
          setReaction("✅");
        }
      },
      event.messageID
    );
  } catch (error) {
    console.error("TikTok command failed:", {
      stage,
      code: error.code || null,
      status: error.response?.status || null,
      message: error.message || "Unknown error",
    });

    setReaction("❌");

    let reason;

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.code === "EAI_AGAIN"
    ) {
      reason = "API host reachable nahi hai.";
    } else if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      reason = `${stage} request timeout ho gayi.`;
    } else if (error.response?.status) {
      reason =
        `${stage} par API ne HTTP ${error.response.status} return kiya.`;
    } else {
      reason =
        error.message ||
        `${stage} fail hui. API ya TikTok service check karein.`;
    }

    return api.sendMessage(
      `❌ TikTok video fetch nahi ho saka.\nReason: ${reason}`,
      event.threadID,
      event.messageID
    );
  }
};
