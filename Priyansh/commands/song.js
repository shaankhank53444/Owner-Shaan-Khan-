bbbbkddkgoconst fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports.config = {
  name: "song",
  hasPermission: 0,
  version: "2.0.0",
  description: "Download YouTube music as MP3 (under 25MB)",
  credits: "SHANKAR",
  usePrefix: false,
  cooldowns: 10,
  commandCategory: "Music"
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) {
    return api.sendMessage(`❌ | कृपया एक गाने का नाम दर्ज करें!`, event.threadID);
  }

  try {
    const query = args.join(" ");
    const findingMessage = await api.sendMessage(`🔍 | "${query}" खोजा जा रहा है...`, event.threadID);

    const searchResults = await yts(query);
    const firstResult = searchResults.videos[0];

    if (!firstResult) {
      await api.sendMessage(`❌ | "${query}" के लिए कोई परिणाम नहीं मिला।`, event.threadID);
      return;
    }

    const { title, url } = firstResult;
    await api.editMessage(`⏳ | "${title}" का ऑडियो डाउनलोड किया जा रहा है...`, findingMessage.messageID);

    // ✅ Render API को कॉल करना (MP3 के लिए)
    const apiUrl = `https://ytdl-api-1-owsz.onrender.com/download/`;
    const response = await axios.post(apiUrl, { url });

    if (!response.data.file_path) {
      await api.sendMessage(`❌ | "${title}" के लिए कोई डाउनलोड लिंक नहीं मिला।`, event.threadID);
      return;
    }

    const filePath = response.data.file_path;
    const audioUrl = `https://ytdl-api-1-owsz.onrender.com/audio/${filePath}`;
    const audioPath = path.resolve(__dirname, "cache", `${Date.now()}-${title}.mp3`);

    const audioResponse = await axios.get(audioUrl, {
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const fileStream = fs.createWriteStream(audioPath);
    audioResponse.data.pipe(fileStream);

    fileStream.on("finish", async () => {
      const stats = fs.statSync(audioPath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      if (fileSizeInMB > 25) {
        await api.sendMessage(`❌ | "${title}" का साइज ${fileSizeInMB.toFixed(2)}MB है, जो 25MB से ज्यादा है।\n🎵 डाउनलोड लिंक: ${audioUrl}`, event.threadID);
        fs.unlinkSync(audioPath);
        return;
      }

      await api.sendMessage({
        body: `🎶 | आपका गाना "${title}" तैयार है!`,
        attachment: fs.createReadStream(audioPath)
      }, event.threadID);

      fs.unlinkSync(audioPath);
      api.unsendMessage(findingMessage.messageID);
    });

    audioResponse.data.on("error", async (error) => {
      console.error(error);
      await api.sendMessage(`❌ | ऑडियो डाउनलोड करने में समस्या हुई: ${error.message}`, event.threadID);
      fs.unlinkSync(audioPath);
    });

  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    await api.sendMessage(`❌ | म्यूजिक प्राप्त करने में समस्या हुई: ${error.response ? error.response.data : error.message}`, event.threadID);
  }
};