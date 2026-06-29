const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "tiktok",
  credits: "Shaan Khan",
  hasPermission: 0,
  description: "TikTok video search aur download karein",
  usages: "[title ya keyword]",
  commandCategory: "media",
  cooldowns: 5
};

const PRIYANSHU_API_KEY = "apim_41XuWvpF6tPq90Cvw503EYFY0UFvK53GHsGlIRxJ6hk";

module.exports.run = async ({ event, args, api }) => {
  const { threadID, messageID } = event;
  let query = args.join(" ");

  if (!query) return api.sendMessage("Bolo na, kya search karun? 🥺", threadID, messageID);

  api.sendMessage(`⏳ '${query}' dhoondh raha hoon, zara ruko...`, threadID, messageID);

  try {
    // Priyanshu API ka search endpoint (Ye endpoint check kar lena)
    let searchUrl = `https://priyanshuapi.qzz.io/api/tiktok/search?query=${encodeURIComponent(query)}`;
    
    const searchRes = await axios.get(searchUrl, {
      headers: { 'Authorization': `Bearer ${PRIYANSHU_API_KEY}` }
    });

    // Man liya response mein pehli video ka data 'data.videos[0]' mein hai
    let videoData = searchRes.data?.data?.videos?.[0]; 

    if (!videoData) {
      return api.sendMessage("❌ Mujhe ye video nahi mili, sorry! 🥺", threadID, messageID);
    }

    let videoURL = videoData.play;
    let filePath = `./tiktok_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(filePath);

    const streamResponse = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream"
    });

    streamResponse.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `✅ Ye lo aapki video: ${videoData.title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ API error ya server down hai, baad mein try karo Shaan.", threadID, messageID);
  }
};
