const fetch = require("node-fetch");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "mp4",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "SARDAR RDX",
    description: "Download YouTube song from keyword search",
    commandCategory: "Media",
    usages: "[songName]",
    cooldowns: 5,
    dependencies: {
      "node-fetch": "",
      "axios": "",
    },
  },

  run: async function ({ api, event, args }) {
    const songName = args.join(" ");
    
    if (!songName) {
      return api.sendMessage("Please provide a song name to search for!", event.threadID, event.messageID);
    }

    const processingMessage = await api.sendMessage(
      "✅ Processing your request. Please wait...",
      event.threadID,
      null,
      event.messageID
    );

    try {
      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      // New API endpoint
      const apiKey = "freeApikey"; // You can change this if needed
      const apiUrl = `https://anabot.my.id/api/download/playmusic?query=${encodeURIComponent(songName)}&apikey=${encodeURIComponent(apiKey)}`;

      // Get the download data from the API
      const response = await axios.get(apiUrl);
      
      if (!response.data.success || !response.data.data.result.success) {
        throw new Error("Failed to fetch song from API");
      }

      const result = response.data.data.result;
      const downloadUrl = result.urls;
      const metadata = result.metadata;

      // Set request headers
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://anabot.my.id/',
      };

      const songResponse = await fetch(downloadUrl, { headers });

      if (!songResponse.ok) {
        throw new Error(`Failed to fetch song. Status code: ${songResponse.status}`);
      }

      // Set the filename based on the song title
      const filename = `${metadata.title.replace(/[^\w\s-]/g, '')}.mp3`;
      const downloadPath = path.join(__dirname, filename);

      const songBuffer = await songResponse.buffer();

      // Save the song file locally
      fs.writeFileSync(downloadPath, songBuffer);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // Create message with metadata
      let messageBody = `🎵 Title: ${metadata.title}\n`;
      messageBody += `👤 Channel: ${metadata.channel}\n`;
      messageBody += `⏱️ Duration: ${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}\n`;
      messageBody += `👀 Views: ${metadata.view_count.toLocaleString()}\n`;
      messageBody += `👍 Likes: ${metadata.like_count.toLocaleString()}\n`;
      messageBody += `\n🎧 Here is your audio file:`;

      await api.sendMessage(
        {
          attachment: fs.createReadStream(downloadPath),
          body: messageBody,
        },
        event.threadID,
        () => {
          fs.unlinkSync(downloadPath);
          api.unsendMessage(processingMessage.messageID);
        },
        event.messageID
      );
    } catch (error) {
      console.error(`Failed to download and send song: ${error.message}`);
      api.sendMessage(
        `❌ Failed to download song: ${error.message}`,
        event.threadID,
        event.messageID
      );
      api.unsendMessage(processingMessage.messageID);
    }
  },
};