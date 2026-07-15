const axios = require("axios");
const fs = require("fs-extra");
const yts = require("yt-search");

module.exports.config = {
    name: "video",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download video from YouTube (720p)",
    commandCategory: "media",
    usages: "[link/text]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ");

    if (!input) return api.sendMessage("❌ Please enter a song name or URL.", threadID, messageID);

    const processingMsg = await api.sendMessage("⏳ Processing, please wait...", threadID, messageID);

    try {
        let videoUrl = input;
        let videoTitle = "Video";

        if (!input.startsWith("http")) {
            const search = await yts(input);
            if (!search.videos.length) return api.sendMessage("❌ Video not found.", threadID, messageID);
            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title;
        }

        const apiKey = "apim_3CsaiuPMabQOatjyJtysddLRWAPX5T2GC_wdeHZVMpE";
        // API URL confirm karein ki kya yehi format hai
        const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download`;

        // Yahan 'apikey' ko body mein dala hai, agar header requirement alag hui to 403 aayega.
        const res = await axios({
            method: 'post',
            url: apiUrl,
            data: { 
                link: videoUrl, 
                format: "mp4", 
                videoQuality: "720",
                apikey: apiKey 
            }
        });

        if (!res.data || !res.data.success) {
            return api.sendMessage("❌ API Error: " + (res.data.message || "Failed to fetch data"), threadID, messageID);
        }

        const pathFile = `${__dirname}/cache/${Date.now()}.mp4`;
        const response = await axios.get(res.data.data.downloadUrl, { responseType: "arraybuffer" });

        fs.writeFileSync(pathFile, Buffer.from(response.data, "binary"));

        api.sendMessage({
            body: `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n\n🥀 𝑳𝒐 𝒃𝒂𝒃𝒚, 𝒚𝒆 𝒓𝒂𝒉𝒂 𝒂𝒑𝒌𝒂 𝒗𝒊𝒅𝒆𝒐 (720p): ${videoTitle}`,
            attachment: fs.createReadStream(pathFile)
        }, threadID, () => {
            api.unsendMessage(processingMsg.messageID);
            fs.unlinkSync(pathFile);
        });

    } catch (e) {
        // Agar error 403 hi hai, to API provider ne shayad is specific URL/Key par restriction rakhi hai
        api.sendMessage("❌ Error: " + e.message, threadID, messageID);
    }
};
