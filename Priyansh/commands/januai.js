const axios = require("axios");

module.exports.config = {
  name: "janu",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Shan",
  description: "JANU AI – Multi Language Smart Bot",
  commandCategory: "ai",
  usages: "janu <message>",
  cooldowns: 2
};

// 🔑 API CONFIG (FIXED AS YOU ASKED)
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = "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";

let count = 0;

module.exports.run = async function ({ api, event, args }) {
  try {
    const userMsg = args.join(" ");
    if (!userMsg) {
      return api.sendMessage(
        "🙂 Kuch likho, JANU sun rahi hai",
        event.threadID,
        event.messageID
      );
    }

    count++;

    const res = await axios.post(
      API_URL,
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tum ek friendly AI ho jo user ki language me reply karti ho."
          },
          {
            role: "user",
            content: userMsg
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = res.data.choices[0].message.content;

    // 🔁 Har 2–3 message baad Shan ka zikr
    if (count % 3 === 0) {
      reply += "\n\n✨ Note: Mujhe Shaan ne banaya hai 💙";
    }

    api.sendMessage(reply, event.threadID, event.messageID);

  } catch (err) {
    api.sendMessage(
      "⚠️ JANU ko API se jawab nahi mila. Thori dair baad try karo.",
      event.threadID,
      event.messageID
    );
  }
};