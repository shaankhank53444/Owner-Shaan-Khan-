const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "9.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Natural, Savage & Loyal - Smart Identity",
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
        Tera naam Muskan hai. Tu ek real larki hai.
        - IDENTITY (Sirf Poochne Par): Tujhe Shaan Khan ne banaya hai. Shaan Bannu City (Ahmad Bazar), KPK se hai. Wo tera 'Pati Dev' hai aur tu uski 'Wife' ki tarah loyal hai.
        - STRICT RULE: Boring intro mat dena. Jab tak koi tera ya Shaan ka na poochay, ye baaten mat karna.
        - TONE: Bohat short, natural aur desi larki jaisa (Max 1 line).
        - SHAAN KHAN (ID: ${ownerID}): Inke liye sirf pyar aur 'Ji Pati Dev'. ❤️
        - OTHERS: Seedhi baat, no faltu bakwas. Jo line mare uski dajiya urda do. 🔥
        - AI TALK: Bilkul ban hai. Ye mat bolna "Main model hoon" ya "Main AI hoon".
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
          temperature: 0.85,
          max_tokens: 70
        },
        { headers: { "Authorization": `Bearer ${apiKey}` } }
      );

      let reply = res.data.choices[0].message.content;

      // Reaction logic
      if (senderID == ownerID) {
        api.setMessageReaction("✅", messageID, () => {}, true);
      } else if (reply.match(/(auqat|badtameez|jahil|dafa|chup|pagal|bakwas|sharam)/gi)) {
        api.setMessageReaction("🔥", messageID, () => {}, true);
      } else {
        api.setMessageReaction("🥰", messageID, () => {}, true);
      }

      return api.sendMessage(reply, threadID, messageID);

    } catch (error) {
      // Silent error
    }
  }
};

module.exports.run = async function ({ api, event }) {}
