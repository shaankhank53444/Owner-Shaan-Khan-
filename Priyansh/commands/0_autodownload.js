const axios = require("axios");
const fs = require("fs-extra");
const { alldown } = require("arif-babu-downloader");

export const config = {
  name: "linkAutoDownload",
  version: "1.5.1",
  hasPermssion: 0,
  credits: "Shaan Babu",
  description: "Downloads video and shows its original title.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 5,
};

export const onLoad = function () {
  const fs = require("fs");
  const path = __filename;
  const fileData = fs.readFileSync(path, "utf8");

  if (!fileData.includes('credits: "Shaan Babu"')) {
    console.log("\n❌ ERROR: Credits Badle Gaye Hain! File Disabled ❌\n");
    process.exit(1);
  }
};

export const run = async function () {};

export const handleEvent = async function ({ api, event }) {
  const body = (event.body || "").trim();
  if (!body.startsWith("https://")) return;

  // Sirf popular domains check karne ke liye (Optional but recommended)
  const supportedDomains = ["tiktok.com", "facebook.com", "instagram.com", "youtube.com", "youtu.be"];
  if (!supportedDomains.some(domain => body.includes(domain))) return;

  try {
    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

    const data = await alldown(body);

    if (!data || !data.data || !data.data.high) {
      // Agar link nahi mila toh reaction hata dena behtar hai
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return;
    }

    const videoTitle = data.data.title || "No Title Found";
    const videoURL = data.data.high;
    const filePath = __dirname + `/cache/auto_${Date.now()}.mp4`; // Date.now() takay multiple users ek saath use karein toh file mix na ho

    // Fix: Direct stream ka use karein ya buffer bina encoding ke save karein
    const response = await axios({
      method: 'get',
      url: videoURL,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      
      api.sendMessage({
        body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, event.messageID);
    });

    writer.on('error', (err) => {
      console.error("WriteStream Error:", err);
    });

  } catch (err) {
    console.error("Download Error:", err);
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
  }
};
