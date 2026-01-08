1111const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "SHAAN-AI-BOT",
  version: "2.6.4",
  hasPermssion: 0,
  credits: "SHAAN-KHAN", // Ab aap ise change kar sakte hain
  description: "Exact/End Bot = fixed reply | Bot xyz = AI",
  commandCategory: "ai",
  usages: "bot",
  cooldowns: 2,
  dependencies: { axios: "" }
};

// 📁 PATHS
const HISTORY_FILE = path.join(__dirname, "SHAAN-KHAN", "ai_history.json");
const BOT_REPLY_FILE = path.join(__dirname, "SHAAN-KHAN", "bot-reply.json");

// Directory check (taaki error na aaye agar folder na ho)
if (!fs.existsSync(path.join(__dirname, "SHAAN-KHAN"))) {
    fs.mkdirSync(path.join(__dirname, "SHAAN-KHAN"));
}

// 🧠 LOAD HISTORY
let historyData = fs.existsSync(HISTORY_FILE)
  ? JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"))
  : {};

// 🤖 LOAD BOT REPLIES
let botReplies = fs.existsSync(BOT_REPLY_FILE)
  ? JSON.parse(fs.readFileSync(BOT_REPLY_FILE, "utf8"))
  : {};

// 🌸 SYSTEM PROMPT
const systemPrompt = `
You are Shaan Khan, a calm and sweet boy.
Creator & Owner: Shaan (sirf wahi).
Shaan Khan ki baat hi final hogi, koi aur nahi sun sakta.
Agar koi bole "AI bolo", toh jawab hoga: "Main Shaan AI hoon 🙂❤️😌"
Reply hamesha soft Urdu mein.
Sirf 1–2 lines.
Use 🙂❤️😌
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const rawText = body.trim();
  const text = rawText.toLowerCase();

  // 🟢 FIXED BOT CONDITIONS
  const fixedBot =
    text === "bot" ||
    text === "bot." ||
    text === "bot!" ||
    text.endsWith(" bot");

  // 🟢 BOT + TEXT (AI)
  const botWithText = text.startsWith("bot ");

  // 🟢 REPLY TO BOT MESSAGE
  const replyToBot =
    messageReply &&
    messageReply.senderID === api.getCurrentUserID();

  // 🤖 FIXED BOT REPLY
  if (fixedBot && !botWithText) {
    let category = "MALE";
    if (senderID === "100016828397863") {
      category = "100016828397863";
    } else if (
      event.userGender === 1 ||
      event.userGender?.toString().toUpperCase() === "FEMALE"
    ) {
      category = "FEMALE";
    }

    const replies = botReplies[category] || [];
    if (replies.length) {
      const reply = replies[Math.floor(Math.random() * replies.length)];
      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction("✅", messageID, () => {}, true);
    }
    return;
  }

  if (!botWithText && !replyToBot) return;

  // 🤖 AI REPLY
  if (!historyData[senderID]) historyData[senderID] = [];
  historyData[senderID].push(`User: ${rawText}`);
  if (historyData[senderID].length > 6) historyData[senderID].shift();
  
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));

  const finalPrompt =
    systemPrompt +
    "\n" +
    historyData[senderID].join("\n") +
    "\nShaan:";

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const res = await axios.get(
      `https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`,
      { timeout: 15000 }
    );

    let reply =
      typeof res.data === "string"
        ? res.data.trim()
        : res.data.text || "main yahi hun 🙂";

    reply = reply.split("\n").slice(0, 2).join(" ");
    if (reply.length > 150) reply = reply.slice(0, 150) + "… 🙂";

    historyData[senderID].push(`Bot: ${reply}`);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));

    api.sendTypingIndicator(threadID, true);
    await new Promise(r => setTimeout(r, 1200));
    api.sendTypingIndicator(threadID, false);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch (err) {
    console.error(err);
  }
};
