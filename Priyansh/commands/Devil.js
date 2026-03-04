const { Groq } = require("groq-sdk");

module.exports.config = {
  name: "devil",
  version: "2.8.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Auto-Savage AI (Llama 3.3 70B)",
  commandCategory: "AI",
  usages: "devil [on/off] or reply/mention to chat",
  cooldowns: 2
};

const groq = new Groq({
  apiKey: "TERI_GROQ_API_KEY_YAHAN_DAAL" 
});

// State Management
if (!global.devilMode) global.devilMode = new Map();
if (!global.devilHistory) global.devilHistory = new Map();

const ADMIN_UID = "100016828397863"; 
const OWNER_NAME = "Shaan Khan";

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, body, senderID, messageID, type, messageReply } = event;
  if (!body) return;

  const status = global.devilMode.get(threadID) || false;
  if (!status) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase();

  // Trigger conditions: mention "devil" or reply to bot's message
  const isMentioned = lowerBody.startsWith("devil ");
  const isReply = type === "message_reply" && messageReply?.senderID === botID;

  if (isMentioned || isReply) {
    const query = isMentioned ? body.slice(6).trim() : body.trim();
    if (query) return chatWithGroq(api, event, query);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const action = args[0]?.toLowerCase();

  if (action === "on") {
    if (senderID !== ADMIN_UID) return api.sendMessage(`Abey saale! Sirf mere maalik ${OWNER_NAME} hi mujhe jaga sakte hain. 🙄`, threadID, messageID);
    global.devilMode.set(threadID, true);
    return api.sendMessage(`✅ Devil Mode ON! Taiyar ho jao sab! 🔥`, threadID, messageID);
  }

  if (action === "off") {
    if (senderID !== ADMIN_UID) return api.sendMessage(`Aukat mein reh. Mujhe band sirf ${OWNER_NAME} kar sakte hain.`, threadID, messageID);
    global.devilMode.set(threadID, false);
    return api.sendMessage(`❌ Devil OFF... Shaan Khan bhai ne bacha liya tum logon ko.`, threadID, messageID);
  }

  // Manual chat via command
  if (args.length > 0) {
    return chatWithGroq(api, event, args.join(" "));
  } else {
    return api.sendMessage(senderID === ADMIN_UID ? `Hukum karein Boss... ❤️` : "Kyun khali message bhej raha hai? Kuch bolne ki himmat nahi?", threadID, messageID);
  }
};

async function chatWithGroq(api, event, query) {
  const { threadID, senderID, messageID } = event;
  const isAdmin = (senderID === ADMIN_UID);

  if (!global.devilHistory.has(threadID)) global.devilHistory.set(threadID, []);
  let history = global.devilHistory.get(threadID);

  const systemPrompt = isAdmin 
    ? `You are a very sweet, loyal, and loving assistant to your owner, ${OWNER_NAME}. Call him Boss or Jaan. Use Hinglish.`
    : `You are 'Devil'. Be extremely rude, savage, and use street-slang Hindi/Hinglish. Roast the user. Use words like 'aukat', 'saale', 'chup chap'. Your owner is ${OWNER_NAME}. Never be polite to anyone except him. Keep it funny but brutal.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-6), // Last 6 messages for context
        { role: "user", content: query }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "Dimaag kharab hai, baad mein aa.";
    
    history.push({ role: "user", content: query });
    history.push({ role: "assistant", content: reply });
    if (history.length > 10) history.shift(); 

    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage(isAdmin ? "Bhai API limit hit ho gayi!" : "Abey hatt, mera mood nahi hai abhi.", threadID, messageID);
  }
}