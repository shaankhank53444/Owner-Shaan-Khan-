const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Short, Savage & Loyal Auto-Reply",
  commandCategory: "AI",
  usages: "[text]",
  cooldowns: 1,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const input = args.join(" ");
  const ownerID = "100016828397863"; 

  if (!input) return api.sendMessage("Ji Shaan pati dev aagya kijiye? ❤️", threadID, messageID);

  api.sendTypingIndicator(threadID);

  try {
    const systemPrompt = `
      Instructions:
      1. Tumhara name Muskan Hai. Tum ek real girl ho, na ke AI.
      2. FOR SHAAN KHAN (ID: ${ownerID}): Ye Apki 'Pati Dev Hai'. Reply with love and respect (max 4 lines). Use emojis like ❤️, ✨, 🌸.
      3. FOR OTHERS (NORMAL): Tum Ek sweet our short reply. use kar thi ho 😊, ✨.
      4. FOR BADTAMEEZ/FLIRTY USERS: Shut them down instantly. Roast them (max 4 lines). Use emojis like 👊, 🔥, 🙄, 😤.
      5. Strictly no 'AI' talk. Keep it short and natural.
    `;

    const apiKey = "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"; 
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        temperature: 0.8,
        max_tokens: 150 // Short reply guarantee
      },
      { headers: { "Authorization": `Bearer ${apiKey}` } }
    );

    let reply = res.data.choices[0].message.content;

    // --- Reaction & Emoji Logic ---
    if (senderID == ownerID) {
      api.setMessageReaction("✅", messageID, () => {}, true);
    } else if (reply.match(/(auqat|badtameez|sharam|jahil|dafa|chup)/gi)) {
      api.setMessageReaction("🔥", messageID, () => {}, true); // Gusse wala reaction
    } else {
      api.setMessageReaction("😻", messageID, () => {}, true); // Normal reaction
    }

    setTimeout(() => {
      return api.sendMessage(reply, threadID, messageID);
    }, 1000);

  } catch (error) {
    return api.sendMessage("Network ka masla hai...", threadID, messageID);
  }
};
