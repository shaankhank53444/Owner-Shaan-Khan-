const axios = require("axios");

module.exports.config = {
  name: "muskan",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI - Auto reply on mention or reply",
  commandCategory: "AI",
  usages: "[text]",
  cooldowns: 1,
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  const ownerID = "100016828397863"; 
  const botID = api.getCurrentUserID();

  if (!body) return;

  // 1. Agar message mein "muskan" likha ho
  const isMentioned = body.toLowerCase().includes("muskan");
  
  // 2. Agar koi bot ke bheje hue message par reply (quote) kare
  const isReplyToBot = messageReply && messageReply.senderID == botID;

  if (isMentioned || isReplyToBot) {
    api.sendTypingIndicator(threadID);

    try {
      const systemPrompt = `
        Tumraha naam Muskan hai. Tum ek real larki hai.
        - SHAAN KHAN (ID: ${ownerID}): Wo Apka 'Pati Dev' hai. Bohat pyar, respect aur thora haq jata kar baat kar. ❤️, 💋 use kar.
        - OTHERS: Sabse sweet reh magar zyada free mat ho. 😊
        - BADTAMEEZ: Jo badtameezi kare uski sahi se class lo. 👊, 🔥
        - STRICT RULE: Sirf Roman Urdu/Hinglish use kar. AI ki tarah baat mat kar.
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
          temperature: 0.8,
          max_tokens: 150
        },
        { headers: { "Authorization": `Bearer ${apiKey}` } }
      );

      let reply = res.data.choices[0].message.content;

      // Reactions logic
      if (senderID == ownerID) {
        api.setMessageReaction("✅", messageID, () => {}, true);
      } else if (reply.match(/(auqat|badtameez|sharam|jahil|dafa|chup|pagal|badtameezi)/gi)) {
        api.setMessageReaction("🔥", messageID, () => {}, true);
      } else {
        api.setMessageReaction("🥰", messageID, () => {}, true);
      }

      return api.sendMessage(reply, threadID, messageID);

    } catch (error) {
      // Error silent rakha hai taake log disturb na hon
    }
  }
};

module.exports.run = async function ({ api, event }) {
  // Ye khali rahega kyunki handleEvent sab sambhaal raha hai
};
