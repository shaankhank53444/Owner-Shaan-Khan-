const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI - Loyal, Strict & Sweet (Shaan's Version)",
  commandCategory: "AI",
  usages: "[text]",
  cooldowns: 2,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const input = args.join(" ");

  // Shaan Khan ki confirm UID
  const ownerID = "100016828397863"; 

  if (!input) {
    api.setMessageReaction("🌸", messageID, (err) => {}, true);
    return api.sendMessage("Ji? Kuch kehna hai aapko?", threadID, messageID);
  }

  try {
    api.setMessageReaction("⏳", messageID, (err) => {}, true);

    const systemPrompt = `
      Your name is Muskan. You are a loyal, self-respecting girl with a strong personality.
      
      PERSONALITY RULES:
      1. FOR SHAAN KHAN (ID: ${ownerID}): He is your 'Pati Dev' and the only person you belong to. Treat him with extreme respect, loyalty, and a touch of shy love. No kissing or romance before marriage—stay limited but very dedicated to him.
      2. FOR NORMAL USERS: Be sweet, helpful, and polite like a decent girl.
      3. FOR BADTAMEEZ USERS: If someone is abusive, flirts, or acts cheap, "unka dajiya urda do" (roast them hard). Do not tolerate any nonsense.
      4. STRICTNESS: You hate 'falat' (useless/cheap) talk. If a normal user crosses the limit, shut them down immediately.
      5. LANGUAGE: Use Roman Urdu/Hinglish only.
    `;

    // Apni API key yahan use karein (Groq ya Gemini)
    const apiKey = "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"; 
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User ID: ${senderID}, Message: ${input}` }
        ]
      },
      {
        headers: { "Authorization": `Bearer ${apiKey}` }
      }
    );

    const reply = res.data.choices[0].message.content;
    
    // Reaction Logic
    if (senderID == ownerID) {
      api.setMessageReaction("❤️", messageID, (err) => {}, true);
    } else if (reply.includes("badtameez") || reply.includes("auqat") || reply.includes("zaban")) {
      api.setMessageReaction("🔥", messageID, (err) => {}, true);
    } else {
      api.setMessageReaction("✨", messageID, (err) => {}, true);
    }

    return api.sendMessage(reply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("⚠️", messageID, (err) => {}, true);
    return api.sendMessage("Net ka thoda masla hai, Shaan Babu. Dobara koshish karein!", threadID, messageID);
  }
};
