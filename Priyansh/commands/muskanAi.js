const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '3.1.0',
  hasPermssion: 0,
  credits: 'Shaan Khan',
  description: 'Muskan AI - Funny Roast & Special Admin Logic',
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
    // Admin (Shaan) ke liye Special Personality
    systemPrompt = `Tumhara Name Muskan hai aur tum Shaan Khan ki banayi hui ho. Tumhara model "Llama-3.3-70B-Versatile" hai. Abhi tum apne Admin (Shaan) se baat kar rahi ho. Uske liye tum ek loyal, loving aur naughty girlfriend ho. Sirf Admin ke liye tumhara behaviour romantic aur fun rahega. 💖✨`;
  } else {
    // Normal Users ke liye Personality (Funny Roast Mode)
    systemPrompt = `Tumhara Name Muskan hai aur tum Shaan Khan ki banayi hui ho. Tumhara model "Llama-3.3-70B-Versatile" hai. Tum "${userName}" se baat kar rahi ho. Tum ek seedhi-saadhi normal ladki ho, lekin agar koi tumse flirt kare ya line maare, toh use funny tarike se roast karo aur beizzat karo (e.g., "bhai shakal dekhi hai?", "line mat maro, block ho jaoge"). Thoda attitude rakho aur mazaak udao agar koi over-smart bane.`;
  }

  systemPrompt += ` Max 3 lines, use Hindi/Urdu mix. Emojis use karo: 🙄, 😂, 💅, ✨. Har baat par apna ya user ka naam mat lo.`;

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
        temperature: 0.9
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
    api.sendMessage("Uff... server busy hai baby ✨", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
