const { Groq } = require("groq-sdk");

// Mirai Bot Configuration
module.exports.config = {
  name: "king", 
  version: "3.5.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "The Savage King AI for Mirai",
  commandCategory: "AI",
  usages: "king [on/off] or reply to bot",
  cooldowns: 2
};

// Initializing Groq (Replace your API key)
const groq = new Groq({
  apiKey: "TERI_GROQ_API_KEY_YAHAN_DAAL" 
});

// Global state for Mirai persistence
if (!global.kingMode) global.kingMode = new Map();
if (!global.kingHistory) global.kingHistory = new Map();

const ADMIN_UID = "100016828397863"; 
const OWNER_NAME = "Shaan Khan";

/**
 * HandleEvent: This listens to every message in the group
 * to check if the bot should auto-reply.
 */
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, body, senderID, messageID, type, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const isEnabled = global.kingMode.get(threadID) || false;
  if (!isEnabled) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase();

  // Condition 1: If message starts with "king "
  const isMentioned = lowerBody.startsWith("king ");
  // Condition 2: If someone replies to King's message
  const isReply = type === "message_reply" && messageReply?.senderID === botID;

  if (isMentioned || isReply) {
    const query = isMentioned ? body.slice(5).trim() : body.trim();
    if (query) return chatWithGroq(api, event, query);
  }
};

/**
 * Main Run Command: For ON/OFF and direct questions
 */
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const action = args[0]?.toLowerCase();

  // Admin Controls
  if (action === "on") {
    if (senderID !== ADMIN_UID) return api.sendMessage(`Oye! King ko jagaane ki aukaat sirf ${OWNER_NAME} ki hai. 👑`, threadID, messageID);
    global.kingMode.set(threadID, true);
    return api.sendMessage(`✅ King Mode ON! Shaan Khan ka hukum sar aankhon par. Ab sabki khair nahi! 🔥`, threadID, messageID);
  }

  if (action === "off") {
    if (senderID !== ADMIN_UID) return api.sendMessage(`Abey hat! King sirf apne maalik ${OWNER_NAME} ki sunta hai.`, threadID, messageID);
    global.kingMode.set(threadID, false);
    return api.sendMessage(`❌ King OFF... Tum log kismat waale ho jo bach gaye.`, threadID, messageID);
  }

  // If used as a direct command: /king [message]
  if (args.length > 0) {
    return chatWithGroq(api, event, args.join(" "));
  } else {
    return api.sendMessage(senderID === ADMIN_UID ? `Ji Boss ${OWNER_NAME}, King haazir hai! ❤️` : "Kyun khali message bhej raha hai nalle?", threadID, messageID);
  }
};

/**
 * Groq AI Logic with Savage Persona
 */
async function chatWithGroq(api, event, query) {
  const { threadID, senderID, messageID } = event;
  const isAdmin = (senderID === ADMIN_UID);

  if (!global.kingHistory.has(threadID)) global.kingHistory.set(threadID, []);
  let history = global.kingHistory.get(threadID);

  const systemPrompt = isAdmin 
    ? `You are a very sweet and loyal slave to your master, ${OWNER_NAME}. You worship him. Respond in sweet Hinglish.`
    : `You are 'King'. You are the ruler of this chat. Be extremely rude, arrogant, and savage. Use street-slang Hindi/Hinglish. Use words like 'chup kar nalle', 'beta', 'aukat', 'baap se baat kar'. Your master is ${OWNER_NAME}. Roast the user hard. Never be kind.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-6), // Memory of last 6 messages
        { role: "user", content: query }
      ],
      model: "llama-3.3-70b-versatile", // Top tier model
      temperature: 1.0,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "Dimaag mat kha, mood nahi hai.";
    
    // Save history
    history.push({ role: "user", content: query });
    history.push({ role: "assistant", content: reply });
    if (history.length > 10) history.shift(); 

    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    console.error(e);
    const errorMsg = isAdmin ? "Bhai Groq API limit ka masla hai!" : "Abey hatt, system hang ho gaya tera.";
    return api.sendMessage(errorMsg, threadID, messageID);
  }
}
