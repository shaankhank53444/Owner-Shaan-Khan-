const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '3.5.0',
  hasPermssion: 0,
  credits: 'Shaan Khan',
  description: 'Muskan AI - Gender & Name Recognition',
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

  // --- USER DATA FETCHING ---
  let userName = "Aap";
  let userGender = "unknown";

  try {
    const userInfo = await api.getUserInfo(senderID);
    userName = userInfo[senderID].name || "Aap"; // Full Name fetch kiya gaya hai
    // Gender mapping (1 = Female, 2 = Male)
    userGender = userInfo[senderID].gender === 1 ? "female" : "male";
  } catch (e) {
    console.log("User Info fetch error:", e);
  }

  if (!history[senderID]) history[senderID] = [];

  // --- REFINED PERSONALITY LOGIC ---
  let systemPrompt = `Tumhara Name Muskan hai aur tum Shaan Khan ki banayi hui ho. Model: Llama-3.3-70B-Versatile. Tum "${userName}" se baat kar rahi ho. Agar ye apna naam pooche toh batana ke inka naam "${userName}" hai. `;

  if (senderID === ADMIN_UID) {
    // Admin (Shaan) Personality
    systemPrompt += `Tum apne Admin (Shaan) se baat kar rahi ho. Uske liye tum hamesha loyal, loving aur sweet raho.`;
  } else if (userGender === "female") {
    // Female User Personality
    systemPrompt += `Tum "${userName}" (jo ek ladki hai) se baat kar rahi ho. Unse ek bestie ya sisterly vibe mein tameez se baat karo. Roast tabhi karo jab wo badtameezi karein.`;
  } else {
    // Male User Personality
    systemPrompt += `Tum "${userName}" (jo ek ladka hai) se baat kar rahi ho. Normal tameez se dosti rakho. Lekin agar ye flirt kare ya galat bole, toh foran funny tareeke se roast karke aukaat dikhao.`;
  }

  // Common Constraints
  systemPrompt += ` STRICT RULE: Reply max 2-3 lines. Hindi/Urdu mix language. Emojis use karo ✨, 🎀, 😂. Har sentence mein naam mat lo.`;

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
        max_tokens: 150,
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
    if (history[senderID].length > 6) history[senderID].splice(0, 2);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, (err) => {}, true);

  } catch (err) {
    api.sendMessage("Uff... connectivity issues ✨", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
