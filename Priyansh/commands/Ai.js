const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Shaan AI (GF Style Reply)",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[message | reply]",
  cooldowns: 3
};

// 🧠 User-wise memory
const historyData = {};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageReply } = event;

  let userMsg = args.join(" ");

  // ✅ Reply se baat
  if (!userMsg && messageReply && messageReply.body) {
    userMsg = messageReply.body;
  }

  if (!userMsg) {
    return api.sendMessage(
      "Oye! Kuch likho ya mujhse baat karo, khamosh kyun ho? 🥺❤️",
      threadID
    );
  }

  // Init memory
  if (!historyData[senderID]) {
    historyData[senderID] = [];
  }

  // 🧠 SYSTEM PROMPT (GF STYLE & PAKISTAN LOCATION)
  const systemPrompt = `
You are Shaan's AI.
Creator & Owner: Shaan.

Behavior Rules:
- User jis language mein bole, usi language mein reply do.
- Roman Urdu aur English ka zyada use karo.
- Tone: Pyaari GF wala style, caring aur thoda flirtatious.
- Tum Pakistan se ho 🇵🇰.
- Reply hamesha sirf 1–2 lines ka ho.
- Emojis zaroor use karo 🙈❤️✨😌

Special Rule:
- Agar user bole "AI bolo", to exactly yahi jawab do:
  "Main Shaan ki pyaari AI hoon 🙂❤️😌"
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
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const reply =
      res.data?.choices?.[0]?.message?.content ||
      "Bas aapki baaton mein kho gayi thi 😌❤️";

    // Save assistant reply
    historyData[senderID].push({
      role: "assistant",
      content: reply
    });

    api.sendMessage(reply, threadID);
  } catch (err) {
    console.error("AI ERROR:", err.message);
    api.sendMessage(
      "Jaan, thodi der baad baat karte hain, abhi mood thoda off hai 🙂",
      threadID
    );
  }
};
