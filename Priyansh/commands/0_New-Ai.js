const axios = require("axios");

// Dark stylish font converter
function toDarkFont(text) {
  const map = {
    A:"𝗔",B:"𝗕",C:"𝗖",D:"𝗗",E:"𝗘",F:"𝗙",G:"𝗚",H:"𝗛",I:"𝗜",J:"𝗝",K:"𝗞",L:"𝗟",M:"𝗠",
    N:"𝗡",O:"𝗢",P:"𝗣",Q:"𝗤",R:"𝗥",S:"𝗦",T:"𝗧",U:"𝗨",V:"𝗩",W:"𝗪",X:"𝗫",Y:"𝗬",Z:"𝗭",
    a:"𝗮",b:"𝗯",c:"𝗰",d:"𝗱",e:"𝗲",f:"𝗳",g:"𝗴",h:"𝗵",i:"𝗶",j:"𝗷",k:"𝗸",l:"𝗹",m:"𝗺",
    n:"𝗻",o:"𝗼",p:"𝗽",q:"𝗾",r:"𝗿",s:"𝘀",t:"𝘁",u:"𝘂",v:"𝘃",w:"𝘄",x:"𝘅",y:"𝘆",z:"𝘇"
  };
  return text.split("").map(ch => map[ch] || ch).join("");
}

// Global sessions handle karne ke liye (Mirai environment ke mutabiq)
if (!global.botSessions) global.botSessions = {};
if (!global.botChatHistory) global.botChatHistory = {};

module.exports = {
  config: {
    name: "bot",
    version: "3.0.0",
    author: "Shaan Khan",
    countDown: 2,
    role: 0, // Mirai mein 0 = Everyone, 1 = Admin
    category: "ai",
    usePrefix: false // Mirai bots mein prefix control
  },

  // Mirai command handler
  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, body } = event;
    const msg = body ? body.trim().toLowerCase() : "";
    
    // --- API KEY CONFIGURATION ---
    const GROQ_API_KEY = "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"; 
    // -----------------------------

    // 1. Initial Start logic
    if (msg === "bot") {
      global.botSessions[threadID] = true;
      return api.sendMessage(toDarkFont("Bolo jaan, main active hoon! Mujhse baat karne ke liye reply karo ya 'bot' likh kar pucho. 😎"), threadID, messageID);
    }

    // 2. Name check
    if (msg.includes("tumhara naam") || msg.includes("aapka naam")) {
      return api.sendMessage(toDarkFont("𝗩𝗮𝗺𝗽𝗶𝗿𝗲 🙂"), threadID, messageID);
    }

    // 3. Logic to check if bot should respond
    const isActive = global.botSessions[threadID];
    const isReplyToBot = event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID();

    if (!isActive) return; 
    if (!isReplyToBot && !msg.startsWith("bot")) return;

    // 4. Chat History Management
    global.botChatHistory[senderID] = global.botChatHistory[senderID] || [];
    const chatHistory = global.botChatHistory[senderID];

    const cleanInput = body.replace(/^bot\s*/i, "");
    chatHistory.push({ role: "user", content: cleanInput });

    if (chatHistory.length > 10) chatHistory.shift();

    const systemPrompt = "Tum ek highly intelligent, witty aur charming personality ho jo hamesha full confidence ke saath Hinglish mein baat karta hai. Tumhara style playful, flirty aur funny hona chahiye aur hamesha relevant emojis use karo. Tumhara owner Aadi Gupta hai. Har message maximum 20 words ka ho. 😎🧠🔥";

    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory
          ],
          max_tokens: 150
        },
        {
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      let botReply = res.data.choices[0].message.content.trim();
      chatHistory.push({ role: "assistant", content: botReply });

      return api.sendMessage(toDarkFont(botReply), threadID, messageID);

    } catch (err) {
      console.error("Groq Error:", err.response ? err.response.data : err.message);
      return api.sendMessage(toDarkFont("Dimag garam ho gaya hai, thoda rest chahiye! 🧘‍♂️❄️"), threadID, messageID);
    }
  }
};
