const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_CONFIG_URL = "https://raw.githubusercontent.com/goatbotnx/xalmanx210/refs/heads/main/apis.json";
const API_KEY = "xalman-hub";
let apiBaseUrl = null;
let apiConfigRequest = null;

async function getApiBaseUrl() {
  if (apiBaseUrl) return apiBaseUrl;

  if (!apiConfigRequest) {
    apiConfigRequest = axios
      .get(API_CONFIG_URL, { timeout: 15000 })
      .then(({ data }) => {
        const baseUrl = data?.[API_KEY];

        if (typeof baseUrl !== "string" || !baseUrl.trim()) {
          throw new Error(`Missing API key in apis.json: ${API_KEY}`);
        }

        apiBaseUrl = baseUrl.replace(/\/+$/, "");
        return apiBaseUrl;
      })
      .finally(() => {
        apiConfigRequest = null;
      });
  }

  return apiConfigRequest;
}

module.exports.config = Object.freeze({
  name: "edit",
  version: "4.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Image Editor",
  commandCategory: "AI",
  usages: "[reply to image] [prompt]",
  cooldowns: 10
});

module.exports.run = async function ({ api, event, args }) {
  const { messageReply, type, messageID, threadID } = event;

  if (
    type !== "message_reply" ||
    !messageReply.attachments ||
    messageReply.attachments.length === 0 ||
    messageReply.attachments[0].type !== "photo"
  ) {
    return api.sendMessage("⚠️ | Please reply to an image to start editing.", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("📝 | Please provide a prompt for editing.\nExample: edit change background to space", threadID, messageID);
  }

  const imageUrl = encodeURIComponent(messageReply.attachments[0].url);
  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, `edited_image_${Date.now()}.png`);

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  api.setMessageReaction("🎨", messageID, (err) => {}, true);
  
  let processingMsg;
  try {
    processingMsg = await api.sendMessage("🚀 | Processing your image, please wait...", threadID);
  } catch (e) {
    processingMsg = null;
  }

  try {
    const baseUrl = await getApiBaseUrl();
    const API_URL = `${baseUrl}/api/edit?img=${imageUrl}&prompt=${encodeURIComponent(prompt)}`;

    const response = await axios({
      method: 'GET',
      url: API_URL,
      responseType: 'arraybuffer',
      timeout: 240000 
    });

    const buffer = Buffer.from(response.data);
    await fs.writeFile(filePath, buffer);

    api.setMessageReaction("✅", messageID, (err) => {}, true);
    if (processingMsg && processingMsg.messageID) {
      await api.unsendMessage(processingMsg.messageID);
    }

    const responseText = "✨ 𝗜𝗠𝗔𝗚𝗘 𝗘𝗗𝗜𝗧𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬 ✨\n" +
                         "━━━━━━━━━━━━━━━━━━━\n" +
                         "📝 Prompt: " + prompt + "\n" +
                         "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

    await api.sendMessage({
      body: responseText,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (err) {
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    if (processingMsg && processingMsg.messageID) {
      await api.unsendMessage(processingMsg.messageID);
    }
    
    const errorMsg = err.code === "ECONNABORTED" 
      ? "⏱️ | Request Timeout: Server took more than 2 minutes." 
      : "🚫 | API Error: Could not edit image.";

    api.sendMessage(errorMsg, threadID, messageID);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};
