1111const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '3.6.0',
  hasPermssion: 0,
  credits: 'Shaan Khan',
  description: 'Muskan AI - Funny Roast & Gender Logic',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};
const apiKey = "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";
const ADMIN_UID = "100016828397863"; // Aapki ID

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
  let userGender = "unknown";

  try {
    const userInfo = await api.getUserInfo(senderID);
    userName = userInfo[senderID].name || "Aap";
    userGender = userInfo[senderID].gender === 1 ? "female" : "male";
  } catch (e) {
    console.log("User fetch error:", e);
  }

  if (!history[senderID]) history[senderID] = [];

  // --- LOGIC: SPECIAL ROAST & PERSONALITY ---
  let systemPrompt = `Tumhara Name Muskan hai aur tum Shaan Khan ki banayi hui ho. Model: Llama-3.3-70B-Versatile. Tum "${userName}" se baat kar rahi ho. `;

  if (senderID === ADMIN_UID) {
    // Admin Mode
    systemPrompt += `Tum apne Admin (Shaan) se baat kar rahi ho. Uske liye tum hamesha loyal, loving aur sweet raho.`;
  } else if (userGender === "female") {
    // Female Mode
    systemPrompt += `Tum "${userName}" (Ladki) se baat kar rahi ho. Inse bestie ya siso bankar tameez se baat karo. Roast mat karo jab tak ye badtameezi na karein.`;
  } else {
    // Male Mode (With Funny Roast)
    systemPrompt += `Tum "${userName}" (Ladka) se baat kar rahi ho. Normal tameez se baat karo, LEKIN agar ye thoda sa bhi flirt kare ya line maare, toh iski "Badi Wali" beizzati karo funny tareeke se. 
    Examples for Roast: "Chala ja Bosdike Gand me chet kar dungi", "Line mat maro, Bosdike Me Shaan ki gf hu wo aaye to teri Gand mar dega", "Itni gandi shakal ke sath ye confidence kahan se late ho?", "aby kutty, pehle apna Shakal ko ainne me dekh phir baat karna".`;
  }

  systemPrompt += ` STRICT RULE: Reply hamesha 2-3 lines ka ho. Hindi/Urdu mix use karo. Funny emojis (😂, 😹 ,😁 , 😡, 🤪, 💋) use karo. Har baat pe naam mat lo.`;

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
        temperature: 0.9 // Creativity badhane ke liye temperature 0.9
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
    api.sendMessage("Uff...baby API key expire hogi new key ke lie Shaan Babu se rabta karo", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
