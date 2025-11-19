const axios = require("axios");
const fs = require("fs");
const ytdl = require("ytdl-core");

// ðŸ‘‡ Apni YouTube API key yahan likho (official YouTube Data API v3 key)
const YOUTUBE_API_KEY = "apim_23xBtG3Gj3AibWfzgZFoTCWU8qyf01o6bUpIMY5KO2U";

module.exports.config = {
  name: "sing",
  version: "3.0.0",
  aliases: ["music", "play"],
  credits: "uzairrajput",
  countDown: 5,
  hasPermssion: 0,
  description: "Download audio from YouTube using YouTube API",
  category: "media",
  commandCategory: "media",
  usePrefix: true,
  prefix: true,
  usages: "{pn} [<song name>|<song link>]"
};

module.exports.run = async ({ api, args, event }) => {
  if (!args[0]) return api.sendMessage("âŒ Please provide a song name or YouTube link.", event.threadID, event.messageID);

  const ytLinkRegex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([\w-]{11})(?:\S+)?$/;
  const urlYtb = ytLinkRegex.test(args[0]);

  // ðŸ”¹ Direct YouTube link diya ho
  if (urlYtb) {
    const match = args[0].match(ytLinkRegex);
    const videoID = match ? match[1] : null;
    return downloadAndSend(api, event, videoID);
  }

  // ðŸ”¹ Song name diya ho â€” YouTube API search
  const query = encodeURIComponent(args.join(" "));
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${query}&key=${YOUTUBE_API_KEY}`;
    const { data } = await axios.get(searchUrl);
    const results = data.items;

    if (!results.length)
      return api.sendMessage("âŒ No results found for: " + args.join(" "), event.threadID, event.messageID);

    let msg = "";
    for (let i = 0; i < results.length; i++) {
      const v = results[i];
      msg += `${i + 1}. ${v.snippet.title}\nChannel: ${v.snippet.channelTitle}\n\n`;
    }

    api.sendMessage(
      msg + "Reply with a number (1â€“6) to download the audio.",
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          results
        });
      },
      event.messageID
    );
  } catch (e) {
    console.error(e);
    api.sendMessage("âš ï¸ Error while searching on YouTube.", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { results } = handleReply;
  const choice = parseInt(event.body);

  if (isNaN(choice) || choice < 1 || choice > results.length)
    return api.sendMessage("âš ï¸ Invalid choice. Please reply with a number between 1 and 6.", event.threadID, event.messageID);

  const videoID = results[choice - 1].id.videoId;
  await api.unsendMessage(handleReply.messageID);
  await downloadAndSend(api, event, videoID);
};

// ðŸŽ§ Download and send MP3 audio
async function downloadAndSend(api, event, videoID) {
  try {
    const info = await ytdl.getInfo(videoID);
    const title = info.videoDetails.title;
    const stream = ytdl(videoID, { filter: "audioonly", quality: "highestaudio" });
    const filePath = "audio.mp3";
    const writeStream = fs.createWriteStream(filePath);

    stream.pipe(writeStream);

    writeStream.on("finish", () => {
      api.sendMessage(
        {
          body: `ðŸŽµ ${title}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    });
  } catch (err) {
    console.error(err);
    api.sendMessage("âŒ Error downloading audio (maybe file too large or unavailable).", event.threadID, event.messageID);
  }
}