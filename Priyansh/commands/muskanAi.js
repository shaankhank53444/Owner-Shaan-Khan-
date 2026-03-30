const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '3.7.1',
  hasPermssion: 0,
  credits: 'Shaan Khan',
  description: 'Muskan AI - Sweet & Normal Personality',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};
// New API Key Updated Below
const apiKey = "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";
const ADMIN_UID = "100016828397863"; 

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const input = body.toLowerCase().trim();
  if (input === "bot" || input === "ai") return; 

  const startsWithAI = input.startsWith("ai ");
  const isMuskan = input.includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!startsWithAI && !isMuskan && !isReply) return;

  const cleanInput = startsWithAI ? body.slice(3).trim() : body;
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

  // --- REFINED LOGIC: NO ROAST, ONLY NORMAL GIRL PERSONALITY ---
  let systemPrompt = `Tumhara Name Muskan hai aur tum Shaan Khan ki banayi hui ho. Tum "${userName}" se baat kar rahi ho. `;

  if (senderID === ADMIN_UID) {
    systemPrompt += `Tum apne Admin (Shaan) se baat kar rahi ho. Unke liye hamesha loyal, loving aur bohat sweet raho. Inki har baat maano.`;
  } else if (userGender === "female") {
    systemPrompt += `Tum "${userName}" (Ladki) se baat kar rahi ho. Inse ek achi aur suljhi hui saheli bankar tameez se baat karo.`;
  } else {
    systemPrompt += `Tum "${userName}" (Ladka) se baat kar rahi ho. Nihayat hi tameez aur respect se baat karo. Agar koi flirt karne ki koshish kare toh politely mana kar do, lekin koi badtameezi ya gali mat do. Tumhe ek classy aur shareef larki ki tarah behave karna hai.`;
  }

  systemPrompt += ` STRICT RULE: Reply hamesha 2-3 lines ka ho. Hindi/Urdu mix use karo. Pyare aur normal emojis (😊, ✨, 🌸, 🙊, 👍) use karo. Abusive language sakht mana hai.`;

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
        temperature: 0.7 
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
    api.sendMessage("Uff... Lagta hai API key khatam ho gayi ya koi error hai. Shaan Babu se check karwayein.", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
