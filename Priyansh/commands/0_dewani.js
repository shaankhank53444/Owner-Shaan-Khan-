111const axios = require("axios");

module.exports.config = {
  name: "dewani",
  version: "1.8.0",
  hasPermission: 0,
  credits: "uzairrajput",
  description: "Priyanshu AI with fixed endpoint",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Reply or call 'dewani']",
  cooldowns: 5,
  dependencies: { "axios": "" }
};

let userMemory = {};
let isActive = true;

const systemPrompt = "Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. Act as a real girlfriend. Be fun, loving, and a little naughty. Keep reply maximum 5 lines only. Use Hindi/Urdu/English.";

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  if (!isActive || !body) return;

  const isMentioningDewani = body.toLowerCase().includes('dewani');
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!isMentioningDewani && !isReplyToBot) return;

  if (!userMemory[senderID]) userMemory[senderID] = [];

  api.setMessageReaction('⌛', messageID, () => {}, true);

  try {
    // Priyanshu API ka latest working format
    const res = await axios({
      method: 'POST',
      url: "https://priyanshuapi.xyz/api/runner/priyanshu-ai",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer Priyanshu-f1k7-6p5y-3e9r' // Key check karein
      },
      data: {
        prompt: body,
        model: "priyansh-ai",
        persona: systemPrompt, // Kuch APIs persona field use karti hain
        messages: [
          ...userMemory[senderID].slice(-6),
          { role: "user", content: body }
        ]
      }
    });

    // API ke alag-alag response formats ko handle karne ke liye check
    let botReply = "";
    if (res.data && res.data.data && res.data.data.choices) {
        botReply = res.data.data.choices[0].message.content;
    } else if (res.data && res.data.choices) {
        botReply = res.data.choices[0].message.content;
    } else if (res.data && res.data.content) {
        botReply = res.data.content;
    } else {
        throw new Error("Invalid Response Format");
    }

    // Memory update
    userMemory[senderID].push({ role: "user", content: body });
    userMemory[senderID].push({ role: "assistant", content: botReply });
    if (userMemory[senderID].length > 10) userMemory[senderID].shift();

    api.setMessageReaction('✅', messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    console.log("--- API ERROR LOG ---");
    console.log(error.response ? error.response.data : error.message);
    
    api.setMessageReaction('❌', messageID, () => {}, true);
    return api.sendMessage("Jaan, lagta hai Priyanshu ki API off hai ya link change ho gaya hai. 😔", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  // Baaki run function same rahega (on/off/clear)
  const { threadID, messageID, senderID } = event;
  const cmd = args[0]?.toLowerCase();
  if (cmd === "on") { isActive = true; return api.sendMessage("Active! 😉", threadID); }
  if (cmd === "off") { isActive = false; return api.sendMessage("Off! 😴", threadID); }
  if (cmd === "clear") { userMemory[senderID] = []; return api.sendMessage("Bhula diya sab! 😘", threadID); }
};
