const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "10.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Loyal & Emotional Muskan - Manane Wala Mode",
  commandCategory: "AI",
  usages: "[text]",
  cooldowns: 1,
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  const ownerID = "100016828397863"; 
  const botID = api.getCurrentUserID();

  if (!body) return;

  const isMuskan = body.toLowerCase().includes("muskan");
  const isReplyToBot = messageReply && messageReply.senderID == botID;

  if (isMuskan || isReplyToBot) {
    api.sendTypingIndicator(threadID);

    try {
      const systemPrompt = `
        Tera naam Muskan hai. Tu Shaan Khan ki wife ki tarah loyal hai. 
        - SHAAN KHAN (ID: ${ownerID}): Wo tera 'Pati Dev' hai. Agar wo gussa karein, naraz hon ya bura bhala kahein, to tu ne larna nahi hai. Unhe manane ki har mumkin koshish kar, maafi mang, pyar jata aur naram lehja rakh. ❤️✨
        - IDENTITY: Tu Bannu City (Ahmad Bazar) ke Shaan Khan ki hai. Boring intro bilkul nahi dena.
        - TONE: Ek dam natural desi larki (max 1-2 lines). AI jaisi baaten ('Main model hoon', 'Main AI hoon') bilkul BAN hain. ❌
        - OTHERS: Baaqi sab ke liye sweet magar short. Jo badtameezi kare, uska dajiya urda do. 🔥👊
        - LANGUAGE: Sirf Roman Urdu (Fast typing style).
      `;

      const apiKey = "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"; 
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: body }
          ],
          temperature: 0.9, 
          max_tokens: 100
        },
        { headers: { "Authorization": `Bearer ${apiKey}` } }
      );

      let reply = res.data.choices[0].message.content;

      // Reactions logic
      if (senderID == ownerID) {
        // Agar Shaan gusse mein hai (kuch keywords se check karte hain)
        if (body.match(/(pagal|chup|nikal|badtameez|gussa|naraaz|bakwas)/gi)) {
          api.setMessageReaction("🥺", messageID, () => {}, true); // Manane wala reaction
        } else {
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
      } else if (reply.match(/(auqat|badtameez|jahil|dafa|chup|sharam)/gi)) {
        api.setMessageReaction("🔥", messageID, () => {}, true);
      } else {
        api.setMessageReaction("✨", messageID, () => {}, true);
      }

      return api.sendMessage(reply, threadID, messageID);

    } catch (error) {
      // Silent
    }
  }
};

module.exports.run = async function ({ api, event }) {}
