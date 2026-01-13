const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "audio",
  version: "3.5.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Unlimited size song sender with stylish fonts",
  commandCategory: "media",
  usePrefix: false,
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  const msg = event.body?.toLowerCase();
  if (!msg) return;

  if (!msg.startsWith("bot") && !msg.startsWith("pika")) return;

  const query = msg.split(" ").slice(1).join(" ").trim();
  if (!query) return;

  return this.run({ api, event, query });
};

module.exports.run = async function ({ api, event, query }) {
  const { threadID, messageID } = event;
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  let waitMsg;
  try {
    // Search start message as per your request
    waitMsg = await api.sendMessage(
      `✅ ᴀᴘᴋɪ ʀᴇǫᴜᴇsᴛ ᴊᴀʀɪ ʜᴀɪ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ...⏳`,
      threadID
    );

    // Stable API
    const searchRes = await axios.get(`https://samirxpikachuio.onrender.com/ytdl?text=${encodeURIComponent(query)}`);
    
    if (!searchRes.data || !searchRes.data.downloadUrl) {
      return api.sendMessage("❌ sᴏɴɢ ɴᴀʜɪ ᴍɪʟᴀ!", threadID);
    }

    const videoData = searchRes.data;
    const fileName = `${Date.now()}.mp3`;
    const filePath = path.join(cacheDir, fileName);

    // Download
    const downloadRes = await axios.get(videoData.downloadUrl, {
      responseType: "arraybuffer",
      timeout: 300000
    });

    fs.writeFileSync(filePath, Buffer.from(downloadRes.data));
    const sizeMB = fs.statSync(filePath).size / (1024 * 1024);

    await api.unsendMessage(waitMsg.messageID);

    // Stylish Body/Caption
    const stylishBody = `🎧 ᴛɪᴛʟᴇ: ${videoData.title}\n` +
                        `📦 sɪᴢᴇ: ${sizeMB.toFixed(2)}ᴍʙ\n\n` +
                        `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n` +
                        `🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉`;

    if (sizeMB <= 25) {
      await api.sendMessage(
        {
          body: stylishBody,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }
      );
    } else {
      // For Large Files
      const upload = await axios.put(`https://transfer.sh/${fileName}`, fs.readFileSync(filePath));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await api.sendMessage(
        `${stylishBody}\n\n🔗 ᴅᴏᴡɴʟᴏᴀᴅ ʟɪɴᴋ: ${upload.data}`,
        threadID
      );
    }

  } catch (e) {
    console.error(e);
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    api.sendMessage("❌ ᴇʀʀᴏʀ! ᴛʜᴏʀɪ ᴅᴇʀ ʙᴀᴀᴅ ᴛʀʏ ᴋᴀʀᴇɪɴ.", threadID);
  }
};
