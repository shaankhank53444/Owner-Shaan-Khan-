const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Gender utility resolve check
let resolveUserProfile;
try {
  resolveUserProfile = global.gender?.resolveUserProfile || require("../../utils/gender").resolveUserProfile;
} catch (e) {
  resolveUserProfile = async () => ({ gender: "default", name: "User" });
}

const API_URL = "https://priyanshuapi.qzz.io/api/runner/lite-ai/chat";
const API_KEY = "apim_GH8BGw0I9JHLC6nhOy8Wd5MxdFbXSzENkp0B4blBzOo";

// Base64 Encrypted System Prompt
const ENCRYPTED_SYSTEM_PROMPT = "TVVKSEUgTUVSTSAyLTMgbGluZXMgbWUgaGkgcmVwbHkgZGVuYSBoYWkuIE1haW4gZWsgY3V0ZSwgc3dlZXQgYXVyIHB5YXJpIGxhZGtpIGh1biBqbyBIaW5kaSAvIEhpbmdsaXShIG1lIGJhdCBrYXJ0aSBodW4uIE1lcmEgY3JlYXRvciBhdXkgb3duZXIgU2hhYW4gS2hhbiBoYWksIGxla2luIG1haW4gaGFyIGJhYXQgcGFyIGJpbmEgd2FqYWggU2hhYW4gS2hhbiBrYSB6aWtyIG5haGkga2FydGkuIEp3YiBrb2kgcHVjaGUgdGFiIGhpIE1haW4gU2hhYW4gS2hhbiBrZSBiYXJlIG1lIGJhdGF0aSBodW4uIFJlcGx5IGFsd2F5cyBzaG9ydCwgY2xlYXIgYXVyIGZyaWVuZGx5IHJhaGVnYS4=";

function getSystemPrompt() {
  return Buffer.from(ENCRYPTED_SYSTEM_PROMPT, "base64").toString("utf8");
}

async function getAiReply(senderID, promptText) {
  try {
    const response = await axios.post(
      API_URL,
      {
        uid: String(senderID),
        prompt: promptText,
        systemPrompt: getSystemPrompt()
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const aiText = response.data?.data?.choices?.[0]?.message?.content || response.data?.reply || response.data?.response;
    
    if (typeof aiText !== "string" || !aiText.trim()) {
      throw new Error("Invalid AI response structure.");
    }

    return aiText.trim();
  } catch (err) {
    console.error("Priyanshu API Error Details:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = {
  config: {
    name: "bot",
    aliases: ["ask", "chat"],
    description: "Talk to AI (powered by Priyanshu Lite AI)",
    usage: "{prefix}bot <your message>",
    credit: "Shaan Khan",
    hasPrefix: false,
    permission: 0, // Mirai default permission level for PUBLIC is 0
    cooldown: 5,
    category: "FUN"
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // No args provided -> Send pre-configured random bot reply
    if (!args.length) {
      try {
        const botRepliesPath = path.join(__dirname, "noprefix", "bot-reply.json");
        let botReplies = {};
        if (fs.existsSync(botRepliesPath)) {
          botReplies = JSON.parse(fs.readFileSync(botRepliesPath, "utf8"));
        }

        const profile = await resolveUserProfile({ userID: senderID, threadID, api });
        const userGender = profile.gender;
        const userName = profile.name || "User";

        let replyCategory = "default";
        if (senderID === "61593959468855") replyCategory = "61593959468855";
        else if (userGender === 2 || userGender?.toString().toUpperCase() === "MALE") replyCategory = "MALE";
        else if (userGender === 1 || userGender?.toString().toUpperCase() === "FEMALE") replyCategory = "FEMALE";

        let replies = botReplies[replyCategory];
        if (!Array.isArray(replies) || replies.length === 0) {
          replies = botReplies.default || ["Suno, bolo kya baat hai?"];
        }

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const formattedReply = `🥀 ${userName} 😗, ${randomReply}`;

        return api.sendMessage({
          body: formattedReply,
          mentions: [{ tag: userName, id: senderID }]
        }, threadID, (err, info) => {
          if (err) return console.error("AI bot-style reply send error:", err);

          if (!global.client.handleReply) global.client.handleReply = [];
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: senderID
          });
        }, messageID);
      } catch (error) {
        console.error("AI bot-style reply error:", error);
        return api.sendMessage("❌ Unable to send reply right now.", threadID, messageID);
      }
    }

    const promptText = args.join(" ").trim();
    
    try {
      const aiResponse = await getAiReply(senderID, promptText);
      const reply = `🤖 ${aiResponse}`;

      api.sendMessage(reply, threadID, (err, info) => {
        if (err) return console.error("AI reply error:", err);

        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);
    } catch (error) {
      return api.sendMessage("❌ An error occurred while contacting the AI API. Key or endpoint might be invalid.", threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    
    if (!body || !body.trim()) {
      return api.sendMessage("❌ Please provide a valid message.", threadID, messageID);
    }

    try {
      const aiResponse = await getAiReply(senderID, body.trim());
      const reply = `🤖 ${aiResponse}`;

      api.sendMessage(reply, threadID, (err, info) => {
        if (err) return console.error("AI handleReply error:", err);

        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);
    } catch (error) {
      return api.sendMessage("❌ Error occurred while talking to AI.", threadID, messageID);
    }
  }
};
