const axios = require("axios");
const fs = require("fs-extra");
const { alldown } = require("arif-babu-downloader");

export const config = {
  name: "linkAutoDownload",
  version: "1.5.0",
  hasPermssion: 0,
  credits: "Shaan Babu",
  description: "Downloads video automatically from links.",
  commandCategory: "Utilities",
  usages: "Sirf link paste karein",
  cooldowns: 5,
};

export const onLoad = () => {
  const path = __filename;
  const fileData = fs.readFileSync(path, "utf8");

  if (!fileData.includes('credits: "Shaan Babu"')) {
    console.log("\n❌ ERROR: Credits Badle Gaye Hain! File Disabled ❌\n");
    process.exit(1);
  }
};

export const handleEvent = async ({ api, event }) => {
  const body = (event.body || "").trim();
  if (!body.startsWith("https://")) return;

  // Social media domains list taaki har text par trigger na ho
  const validDomains = ["facebook.com", "instagram.com", "tiktok.com", "youtube.com", "youtu.be", "fb.watch"];
  if (!validDomains.some(domain => body.includes(domain))) return;

  try {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const data = await alldown(body);

    if (!data || !data.data || !data.data.high) {
      return; // Khamoshi se return karein agar link valid nahi hai
    }

    const videoTitle = data.data.title || "No Title Found";
    const videoURL = data.data.high;
    const filePath = __dirname + `/cache/auto_${event.senderID}.mp4`;

    const response = await axios.get(videoURL, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    return api.sendMessage(
      {
        body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
        attachment: fs.createReadStream(filePath),
      },
      event.threadID,
      () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      },
      event.messageID
    );
  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

export const run = async ({ api, event, args }) => {
  // Ye khali rahega kyunki ye auto-download hai
  api.sendMessage("Link auto-downloader active hai. Bas link paste karein!", event.threadID);
};
