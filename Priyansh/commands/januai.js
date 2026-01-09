const axios = require("axios");

module.exports.config = {
  name: "janu",
  version: "1.0.1",
  hasPermission: 0,
  credits: "Shan",
  description: "JANU AI – Multi Language Smart Bot (Stable)",
  commandCategory: "ai",
  usages: "janu <message>",
  cooldowns: 2
};

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Agar ye key kaam na kare, toh OpenRouter se nayi 'Free' key generate karein
const API_KEY = "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";

let count = 0;

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const userMsg = args.join(" ");

  // 1. Khali message check
  if (!userMsg) {
    return api.sendMessage("🙂 Ji boliye, main sun rahi hoon. Kuch puchiye?", threadID, messageID);
  }

  try {
    // 2. Typing indicator (Bot "Typing..." dikhayega)
    api.sendTypingIndicator(threadID);

    // 3. API Request
    const response = await axios.post(
      API_URL,
      {
        model: "google/gemini-2.0-flash-exp:free", // Sabse fast aur free model
        messages: [
          { 
            role: "system", 
            content: "Tumhara naam JANU hai. Tum Shan ki banayi hui ek friendly AI ho. Hamesha short aur sweet jawab do." 
          },
          { role: "user", content: userMsg }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://facebook.com", // Ye line error se bachati hai
          "X-Title": "Janu Bot"
        },
        timeout: 15000 // Agar 15 seconds tak jawab na aaye toh cancel ho jaye
      }
    );

    // 4. Response check (Kya data sahi aaya?)
    if (response.data && response.data.choices && response.data.choices[0].message) {
      let reply = response.data.choices[0].message.content;
      
      count++;
      if (count % 3 === 0) {
        reply += "\n\n✨ Developed by Shan 💙";
      }

      return api.sendMessage(reply, threadID, messageID);
    } else {
      throw new Error("Invalid Response Format");
    }

  } catch (error) {
    // 5. Silent Error Handling (Terminal pe error dikhega, user ko sirf short message)
    console.error("JANU AI ERROR:", error.response ? error.response.data : error.message);
    
    return api.sendMessage(
      "😔 Maaf kijiye, abhi mera dhyan kahin aur tha. Kya aap dubara keh sakte hain?",
      threadID,
      messageID
    );
  }
};
