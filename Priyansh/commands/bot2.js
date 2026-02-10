const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "3.0.2",
  hasPermssion: 0,
  credits: "Shaan Khan", 
  description: "Shaan Khan AI (Reply + Normal Chat)",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[message | reply]",
  cooldowns: 3
};

const historyData = {};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageReply, messageID } = event;

  let userMsg = args.join(" ");

  if (!userMsg && messageReply && messageReply.body) {
    userMsg = messageReply.body;
  }

  if (!userMsg) {
    return api.sendMessage(
      "❌ Kuch likho ya AI ke message pe reply karo 🙂",
      threadID
    );
  }

  // ⌛ Loading Reaction
  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  if (!historyData[senderID]) {
    historyData[senderID] = [];
  }

  // 🧠 UPDATED SYSTEM PROMPT
  const systemPrompt = `
You are Shaan Khan AI.
Creator & Owner: Shaan Khan only.

Behavior Rules:
- User jis language mein bole, usi language mein reply do.
- Hindi, English, aur Roman Urdu allowed.
- Tone: masti bhara, caring, aur dosti wala.
- Tum India se ho.
- Reply hamesha sirf 1–2 lines ka ho.
- Shayari ya joke ho to short aur cute ho.
- Emojis zaroor use karo 🙂❤️😌

Special Rule:
- Agar user bole "AI bolo", to exactly yahi jawab do:
  "Main Shaan Khan AI hoon 🙂❤️😌"
`;

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
      "Aaj thoda sa chup hoon 😌";

    // ✅ Done icon logic
    const finalReply = `${reply} ✅`;

    historyData[senderID].push({
      role: "assistant",
      content: reply
    });

    api.sendMessage(finalReply, threadID, messageID);
    
    // Success Reaction
    api.setMessageReaction("✅", messageID, (err) => {}, true);

  } catch (err) {
    console.error("AI ERROR:", err.message);
    api.sendMessage(
      "❌ Thodi der baad baat karte hain 🙂",
      threadID
    );
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
