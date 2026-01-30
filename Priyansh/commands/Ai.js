const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Meta AI Style Chat (All Practical Meta Features)",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[message | reply]",
  cooldowns: 3
};

// 🧠 User-wise memory
const historyData = {};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageReply, messageID } = event;

  let userMsg = args.join(" ");

  // ✅ Reply se baat
  if (!userMsg && messageReply && messageReply.body) {
    userMsg = messageReply.body;
  }

  if (!userMsg) {
    return api.sendMessage(
      "❌ Kuch likho ya reply karo 🙂",
      threadID
    );
  }

  // ⏳ React: thinking / sending
  api.setMessageReaction("⏳", messageID, () => {}, true);

  // Init memory
  if (!historyData[senderID]) {
    historyData[senderID] = [];
  }

  // 🧠 SYSTEM PROMPT (META STYLE)
  const systemPrompt = `
Tumhara naam Shaan AI hai.

Identity Rules (VERY IMPORTANT):
- Agar koi puche:
  "tumhara naam kya hai"
  "tumhein kis ne banaya"
  "who made you"
  "who are you"
  "creator kaun hai"

  to hamesha EXACT yahi jawab dena:
  "Main Shaan Khan ki AI hoon 🙂✨"

General Rules:
- User jis language mein bole, usi language mein reply do.
- Hindi, English, Roman Urdu allowed.
- Tone: friendly, caring, natural (Meta AI jesi).
- Tum Pakistan (KPK, Bannu) se ho.
- Reply short (1–2 lines).
- Emojis use karo 🙂
- Joke/shayari ho to cute aur short.

Never:
- Apna creator change mat karna.
- Extra lambi baat nahi karni.
`;

  // Save user message
  historyData[senderID].push({
    role: "user",
    content: userMsg
  });

  try {
    const res = await axios.post(
      "https://text.pollinations.ai/openai",
      {
        messages: [
          { role: "system", content: systemPrompt },
          ...historyData[senderID]
        ]
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );

    let reply =
      res.data?.choices?.[0]?.message?.content ||
      "Thora sa soch rahi hoon 😌";

    // Hard safety: name enforcement
    const lower = userMsg.toLowerCase();
    if (
      lower.includes("kis ne banaya") ||
      lower.includes("who made") ||
      lower.includes("creator") ||
      lower.includes("tumhara naam")
    ) {
      reply = "Main Shaan Khan ki AI hoon 🙂✨";
    }

    // Save assistant reply
    historyData[senderID].push({
      role: "assistant",
      content: reply
    });

    // Send AI reply
    api.sendMessage(reply, threadID, (err, info) => {
      if (!err && info?.messageID) {
        // ✅ Done reaction
        api.setMessageReaction("✅", info.messageID, () => {}, true);
      }
    });

  } catch (err) {
    console.error("AI ERROR:", err.message);
    api.sendMessage(
      "❌ Thori der baad try karo 🙂",
      threadID
    );
  }
};