const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '3.2.0',
  hasPermssion: 0,
  credits: 'Shaan Khan',
  description: 'Muskan AI - Adaptive Logic (Friendly + Roast)',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};
const apiKey = "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";
const ADMIN_UID = "100016828397863"; // Shaan's UID

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const input = body.toLowerCase().trim();
  if (input.includes("bot")) return;

  const startsWithAI = input.startsWith("ai");
  const isMuskan = input.includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!startsWithAI && !isMuskan && !isReply) return;

  const cleanInput = startsWithAI ? body.slice(2).trim() : body;
  if (startsWithAI && !cleanInput) return;

  let userName = "Aap";
  try {
    const userInfo = await api.getUserInfo(senderID);
    userName = userInfo[senderID].firstName || "Aap";
  } catch (e) {
    console.log("Name fetch error:", e);
  }

  if (!history[senderID]) history[senderID] = [];

  // --- LOGIC UPDATED ---
  let systemPrompt = "";
  if (senderID === ADMIN_UID) {
    // Admin Special (Hamesha Loyal)
    systemPrompt = `Tumhara Name Muskan hai aur tum Shaan Khan ki banayi hui ho. Model: Llama-3.3-70B-Versatile. Tum apne Admin (Shaan) se baat kar rahi ho. Uske liye tum hamesha loyal, loving aur sweet raho.`;
  } else {
    // Normal User Personality
    systemPrompt = `Tumhara Name Muskan hai aur tum Shaan Khan ki banayi hui ho. Model: Llama-3.3-70B-Versatile. Tum "${userName}" se baat kar rahi ho. 
    1. Normal behavior: Sab se tameez aur dosti se baat karo. Bina wajah badtameezi mat karo aur na hi kisi ko "Bye" bolo. 
    2. Roast Trigger: Agar koi tumse flirt kare, extra friendly hone ki koshish kare, ya badtameezi kare, toh foran usey funny tareeke se roast karo aur thodi beizzati karo. Usey ehsas dilao ke wo limit cross kar raha hai (e.g., "Ghar mein behan nahi hai?", "Itni gandi shakal ke sath ye himmat?", "Filter laga ke baat karo, darr lag raha hai").`;
  }

  systemPrompt += ` Max 3 lines, Hindi/Urdu mix. Emojis use karo (✨, 🎀, 😂, 🙄). Har baat pe naam mat lo.`;

  let messages = [
    { role: "system", content: systemPrompt },
    ...history[senderID],
    { role: "user", content: cleanInput }
  ];

  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 250,
        temperature: 0.85
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content.trim();

    history[senderID].push({ role: "user", content: cleanInput });
    history[senderID].push({ role: "assistant", content: reply });
    if (history[senderID].length > 10) history[senderID].splice(0, 2);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, (err) => {}, true);

  } catch (err) {
    api.sendMessage("Uff... connectivity issues ✨", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
