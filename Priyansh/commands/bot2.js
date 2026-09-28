const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { resolveUserProfile } = global.gender || require("../../utils/gender");

const API_URL = "https://priyanshuapi.qzz.io/api/runner/lite-ai/chat";
const API_KEY = "apim_GH8BGw0I9JHLC6nhOy8Wd5MxdFbXSzENkp0B4blBzOo";

// Base64 Encrypted System Prompt (Decodes at runtime)
const ENCRYPTED_SYSTEM_PROMPT = "TVVKSEUgTUVSTSAyLTMgbGluZXMgbWUgaGkgcmVwbHkgZGVuYSBoYWkuIE1haW4gZWsgY3V0ZSwgc3dlZXQgYXVyIHB5YXJpIGxhZGtpIGh1biBqbyBIaW5kaSAvIEhpbmdsaXNoIG1lIGJhdCBrYXJ0aSBodW4uIE1lcmEgY3JlYXRvciBhdXkgb3duZXIgU2hhYW4gS2hhbiBoYWksIGxla2luIG1haW4gaGFyIGJhYXQgcGFyIGJpbmEgd2FqYWggU2hhYW4gS2hhbiBrYSB6aWtyIG5haGkga2FydGkuIEp3YiBrb2kgcHVjaGUgdGFiIGhpIE1haW4gU2hhYW4gS2hhbiBrZSBiYXJlIG1lIGJhdGF0aSBodW4uIFJlcGx5IGFsd2F5cyBzaG9ydCwgY2xlYXIgYXVyIGZyaWVuZGx5IHJhaGVnYS4=";

function getSystemPrompt() {
  return Buffer.from(ENCRYPTED_SYSTEM_PROMPT, "base64").toString("utf8");
}

async function getAiReply(senderID, promptText) {
  const response = await axios.post(
    API_URL,
    {
      uid: String(senderID),
      prompt: promptText,
      systemPrompt: getSystemPrompt()
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    }
  );

  const aiText = response.data?.data?.choices?.[0]?.message?.content;
  if (typeof aiText !== "string" || !aiText.trim()) {
    throw new Error("Invalid AI response format.");
  }

  return aiText.trim();
}

module.exports = {
  config: {
    name: "bot",
    aliases: ["ask", "chat"],
    description: "Talk to AI (powered by Priyanshu Lite AI)",
    usage: "{prefix}bot <your message>",
    credit: "Shaan Khan",
    hasPrefix: false,
    permission: "PUBLIC",
    cooldown: 5,
    category: "FUN"
  },

  run: async function ({ api, message, args }) {
    const { threadID, messageID, senderID } = message;

    if (!args.length) {
      try {
        const botRepliesPath = path.join(__dirname, "noprefix", "bot-reply.json");
        const botReplies = JSON.parse(fs.readFileSync(botRepliesPath, "utf8"));

        const profile = await resolveUserProfile({ userID: senderID, threadID, api });
        const userGender = profile.gender;
        const userName = profile.name || "User";

        let replyCategory = "default";
        if (senderID === "61593959468855") replyCategory = "61593959468855";
        else if (userGender === 2 || userGender?.toString().toUpperCase() === "MALE") replyCategory = "MALE";
        else if (userGender === 1 || userGender?.toString().toUpperCase() === "FEMALE") replyCategory = "FEMALE";

        let replies = botReplies[replyCategory];
        if (!Array.isArray(replies) || replies.length === 0) {
          replies = botReplies.default || [];
        }

        if (!Array.isArray(replies) || replies.length === 0) {
          return api.sendMessage("❌ Bot replies are not configured.", threadID, messageID);
        }

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const formattedReply = `🥀${userName}😗, ${randomReply}`;

        return api.sendMessage({
          body: formattedReply,
          mentions: [{ tag: userName, id: senderID }]
        }, threadID, (err, info) => {
          if (err) {
            console.error("AI bot-style reply send error:", err);
            return;
          }

          const repliesList = global.client.replies.get(threadID) || [];
          repliesList.push({
            command: module.exports.config.name,
            messageID: info.messageID,
            expectedSender: senderID,
            data: { isFromBotReply: true }
          });
          global.client.replies.set(threadID, repliesList);
        }, messageID);
      } catch (error) {
        console.error("AI bot-style reply error:", error);
        return api.sendMessage("❌ Unable to send AI reply right now.", threadID, messageID);
      }
    }

    const promptText = args.join(" ").trim();
    if (!promptText) {
      return api.sendMessage("❌ Please provide a valid message.", threadID, messageID);
    }

    try {
      const aiResponse = await getAiReply(senderID, promptText);
      const reply = `🤖 ${aiResponse}`;

      api.sendMessage(reply, threadID, (err, info) => {
        if (err) return console.error("AI reply error:", err);

        const replies = global.client.replies.get(threadID) || [];
        replies.push({
          command: module.exports.config.name,
          messageID: info.messageID,
          expectedSender: senderID,
          data: {}
        });
        global.client.replies.set(threadID, replies);
      }, messageID);
    } catch (error) {
      console.error("AI command error:", error.response?.status || error.message);
      return api.sendMessage("❌ An error occurred while contacting the AI API.", threadID, messageID);
    }
  },

  handleReply: async function ({ api, message }) {
    if (!message.messageReply) {
      return api.sendMessage("❌ This command can only be used as a reply to an AI message.", message.threadID, message.messageID);
    }

    const { threadID, messageID, senderID, body } = message;
    if (!body || !body.trim()) {
      return api.sendMessage("❌ Please provide a valid message.", threadID, messageID);
    }

    try {
      const aiResponse = await getAiReply(senderID, body.trim());
      const reply = `🤖 ${aiResponse}`;

      api.sendMessage(reply, threadID, (err, info) => {
        if (err) return console.error("AI reply error:", err);

        const replies = global.client.replies.get(threadID) || [];
        const updatedReplies = replies.filter(r => r.messageID !== message.messageReply.messageID);
        updatedReplies.push({
          command: module.exports.config.name,
          messageID: info.messageID,
          expectedSender: senderID,
          data: {}
        });
        global.client.replies.set(threadID, updatedReplies);
      }, messageID);
    } catch (error) {
      console.error("AI handleReply error:", error.response?.status || error.message);
      return api.sendMessage("❌ Error occurred while talking to AI.", threadID, messageID);
    }
  }
};
