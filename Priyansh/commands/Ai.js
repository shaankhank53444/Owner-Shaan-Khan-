const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "3.2.1", // Updated version
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Meta AI Style Chat (New Fast API)",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[message | reply]",
  cooldowns: 3
};

const historyData = {};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageReply, messageID } = event;
  let userMsg = args.join(" ");

  if (!userMsg && messageReply && messageReply.body) userMsg = messageReply.body;
  if (!userMsg) return api.sendMessage("❌ Kuch likho ya reply karo 🙂", threadID);

  api.setMessageReaction("⏳", messageID, () => {}, true);

  if (!historyData[senderID]) historyData[senderID] = [];

  const systemPrompt = `Tumhara naam Shaan AI hai. Main Shaan Khan ki AI hoon 🙂✨. 
  Reply short (1-2 lines), friendly, aur natural hona chahiye. User ki language mein jawab do.`;

  historyData[senderID].push({ role: "user", content: userMsg });

  try {
    // NEW FAST ENDPOINT
    const res = await axios.post(
      "https://gen.pollinations.ai/openai",
      {
        model: "openai", // Nayi API mein ye zaroori hai
        messages: [
          { role: "system", content: systemPrompt },
          ...historyData[senderID]
        ]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    let reply = res.data?.choices?.[0]?.message?.content || "Thora sa soch rahi hoon 😌";

    // Name Enforcement
    const lower = userMsg.toLowerCase();
    if (lower.includes("kis ne banaya") || lower.includes("who made") || lower.includes("creator") || lower.includes("tumhara naam")) {
      reply = "Main Shaan Khan ki AI hoon 🙂✨";
    }

    historyData[senderID].push({ role: "assistant", content: reply });

    api.sendMessage(reply, threadID, (err, info) => {
      if (!err) api.setMessageReaction("✅", info.messageID, () => {}, true);
    });

  } catch (err) {
    console.error("AI ERROR:", err.message);
    api.sendMessage("❌ Filhal API busy hai, thori der baad try karo 🙂", threadID);
  }
};
