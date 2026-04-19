const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "12.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Short & Loyal Muskan (Max 4-5 Lines)",
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
        Tera naam Muskan hai. Tu Shaan Khan (Bannu, Ahmad Bazar) ki hai.
        - TONE: Ek dam natural larki, max 4 lines ka reply dena hai.
        - SHAAN KHAN (ID: ${ownerID}): Wo tera Pati Dev hai. Pyar se baat kar, naraz ho to manao. ❤️
        - OTHERS: Short aur sweet. Badtameezi par dajiya urda do. 🔥
        - IDENTITY: Boring AI talk/intro bilkul nahi karni. ❌
        - LANGUAGE: Roman Urdu.
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
          max_tokens: 120 // Short reply fix
        },
        { headers: { "Authorization": `Bearer ${apiKey}` } }
      );

      let reply = res.data.choices[0].message.content;

      if (senderID == ownerID) {
        api.setMessageReaction(body.match(/(pagal|chup|nikal|gussa)/gi) ? "✅" : "✅", messageID, () => {}, true);
      } else {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }

      return api.sendMessage(reply, threadID, messageID);
    } catch (e) {}
  }
};

module.exports.run = async function ({ api, event }) {}
