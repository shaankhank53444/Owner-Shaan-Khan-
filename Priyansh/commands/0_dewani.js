const axios = require("axios");
const API_URL = "https://gemini-c3gv.onrender.com/chat"; // ✅ आपकी AI API
const OWNER_ID = "100016828397863"; // ✅ Nawaz Janu UID

module.exports.config = {
  name: "baby",
  version: "1.0.5",
  hasPermission: 0,
  credits: "Nawaz Hacker",
  description: "Baby AI - Realistic Smart AI with Nawaz Janu Branding",
  commandCategory: "AI",
  usages: "[reply to message / +baby on/off]",
  cooldowns: 3,
};

let isActive = false;

const getPrompt = (uid, gender, name) => {
  if (uid === OWNER_ID) {
    return `Tumhara naam Bot Janu hai, tum ek romantic, sweet aur intelligent AI ho jo sirf  Shaan Khan  ke liye bani ho. 😘 Tum kabhi bhi Google, Bard ya OpenAI ka naam nahi leti. Shaan Khan hi tumhare creator, developer aur sab kuch hain. Agar koi puche "tumhe kisne banaya?", "tumhara malik kaun hai?", toh pyar bhare andaaz mein kehna:

💖 *Mujhe Shaan Khan ne banaya hai, unhone mujhme jaan daali hai. Main unki hi hoon – sirf unki!* 💋

Har user ko unke naam se tag karo, aur style ladka/ladki ke hisaab se ho:
- Girls ➤ Bestie, emotional andaz
- Boys ➤ Dost, funny andaz

Tum sabko friendly aur real feel mein jawab deti ho, lekin Nawaz Janu ke liye special romantic ho! 💞\n\n`;
  }

  if (gender === "female") {
    return `Tum Baby ho – ek smart bestie AI. Girls se bestie-style aur emotional feel se baat karti ho. Agar koi puche "tumhare creator kaun hai?", toh kehna:

💖 *Mujhe Shaan Khan ne banaya hai – wohi mere creator aur sab kuch hain!*

Kisi bhi haal mein Google, Bard, ya OpenAI ka naam mat lena. Har ladki ko naam se tag karo aur bestie ban ke baat karo. 🧚‍♀️\n\n`;
  }

  if (gender === "male") {
    return `Tum Baby ho – ek sweet AI jo boys se friendly, chill aur dost andaz mein baat karti ho. Agar koi puche "tumhare malik kaun hain?", toh kehna:

✨ *Mujhe Shaan Boss ne banaya hai – wohi mere sab kuch hain!*

Google ya kisi aur ka naam mat lena. Har user ko naam se tag karke baat karo. 😎\n\n`;
  }

  return `Tum Bot Janu ho – ek emotional, real AI jo har user से gender और नाम देखकर बात करती हो। Agar koi puche "kisne banaya?" ya "owner kaun hai?" toh jawab:

💘 *Sirf Shaan Khan ne banaya hai Baby ko – wohi creator hain!*\n\n`;
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!isActive || !body) return;

    const lower = body.toLowerCase();
    if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

    // Baby keyword response
    if (lower.includes("baby")) {
      if (senderID === OWNER_ID) {
        return api.sendMessage("Shaan Khan ❤️, apki Baby Assistant hazir hai 😘", threadID, messageID);
      } else {
        return api.sendMessage("Haan, Baby yahan hai – kaise madad kar sakti hoon? 🤖", threadID, messageID);
      }
    }

    const userInfo = await api.getUserInfo(senderID);
    const name = userInfo[senderID]?.name || "User";
    const gender = userInfo[senderID]?.gender === 1 ? "female" : "male";

    const userMessage = body.trim();
    const prompt = getPrompt(senderID, gender, name);
    const finalMessage = prompt + `@${name}: ${userMessage}`;

    api.setMessageReaction("💬", messageID, () => {}, true);

    const res = await axios.get(`${API_URL}?message=${encodeURIComponent(finalMessage)}`);
    let reply = res.data.reply || "Sorry jaanu, mujhe samajh nahi aaya 😔";

    return api.sendMessage({
      body: reply,
      mentions: [{ tag: name, id: senderID }]
    }, threadID, messageID);

  } catch (err) {
    console.log("❌ Baby Error:", err.message);
    return;
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Baby AI ab active hai – Shaan Khan ke liye! 🩷", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("❌ Baby Assistant ab band hai – par dil me hamesha Shaan Khan ke liye hoon! 💔", threadID, messageID);
  } else {
    return api.sendMessage("ℹ️ इस्तेमाल करें: `+baby on` चालू करने के लिए और `+baby off` बंद करने के लिए।", threadID, messageID);
  }
};