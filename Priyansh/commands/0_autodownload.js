/**
 * @credits Shaan Khan
 * @unlocked true
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { alldown } = require("arif-babu-downloader");

export const config = {
  name: "linkAutoDownload",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Automatically downloads videos from links (TikTok, FB, IG, etc.)",
  commandCategory: "Utilities",
  usages: "[link]",
  cooldowns: 5,
};

export const handleEvent = async ({ api, event }) => {
  const { threadID, messageID, body } = event;

  // Link validation
  if (!body || !body.startsWith("https://")) return;

  try {
    // Reaction processing
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // Fetching data from API
    const res = await alldown(body);

    if (!res || !res.data || !res.data.high) {
      // Quietly return if no downloadable link found
      return; 
    }

    const videoURL = res.data.high;
    const cachePath = path.join(__dirname, "cache", `auto_${threadID}_${messageID}.mp4`);

    // Ensure cache folder exists
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"));
    }

    // Download video
    const response = await axios.get(videoURL, { responseType: "arraybuffer" });
    fs.writeFileSync(cachePath, Buffer.from(response.data, "utf-8"));

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Sending the video file
    return api.sendMessage(
      {
        body: `✅ Downloaded Successfully!\n👤 Credits: ${config.credits}`,
        attachment: fs.createReadStream(cachePath),
      },
      threadID,
      () => {
        // Cleanup: Delete file after sending
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      },
      messageID
    );
  } catch (error) {
    console.error("Download Error:", error);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

export const run = async ({ api, event }) => {
  return api.sendMessage("This module works automatically when you paste a link.", event.threadID);
};
