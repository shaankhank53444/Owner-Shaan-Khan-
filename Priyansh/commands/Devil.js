const { Groq } = require("groq-sdk");

module.exports.config = {
  name: "king", // Isse check karein ki koi aur file is naam ki na ho
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Savage King AI - No Video Search, Only Chat",
  commandCategory: "AI",
  usages: "king on/off | king [message]",
  cooldowns: 2
};

const groq = new Groq({
  apiKey: "TERI_GROQ_API_KEY_YAHAN_DAAL" 
});

// Persistence logic
if (!global.kingMode) global.kingMode = new Map();
if (!global.kingHistory) global.kingHistory = new Map();

const ADMIN_UID = "100016828397863"; 
const OWNER_NAME = "Shaan Khan";

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, body, senderID, messageID, type, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const isEnabled = global.kingMode.get(threadID) || false;
  if (!isEnabled) return;

  const botID = api.getCurrentUserID();
  const lowerBody = body.toLowerCase();

  // Sirf tab trigger hoga jab "king " se shuru ho ya bot ko reply ho
  const isMentioned = lowerBody.startsWith("king ");
  const isReply = type === "message_reply" && messageReply?.senderID === botID;

  if (isMentioned || isReply) {
    // Agar text "king on/off" hai toh handleEvent respond nahi karega (wo run function karega)
    if (lowerBody === "king on" || lowerBody === "king off") return;

    const query = isMentioned ? body.slice(5).trim() : body.trim();
    if (query) return chatWithGroq(api, event, query);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const input = args[0]?.toLowerCase();

  // Control Logic
  if (input === "on") {
    if (senderID !== ADMIN_UID) return api.sendMessage(`Aukat mein! King ko sirf ${OWNER_NAME} on kar sakte hain.`, threadID, messageID);
    global.kingMode.set(threadID, true);
    return api.sendMessage(`✅ King Mode Activated! Ab sab line pe raho. 🔥`, threadID, messageID);
  }

  if (input === "off") {
    if (senderID !== ADMIN_UID) return api.sendMessage(`Abey hat! ${OWNER_NAME} ke bina main band nahi hone wala.`, threadID, messageID);
    global.kingMode.set(threadID, false);
    return api.sendMessage(`❌ King Mode Deactivated. Bacha liya tum logo ko maalik ne.`, threadID, messageID);
  }

  // Direct Chat Logic
  if (args.length > 0) {
    return chatWithGroq(api, event, args.join(" "));
  } else {
    return api.sendMessage(senderID === ADMIN_UID ? `Ji Boss, kya hukum hai?` : "Khali naam lene aaya hai kya? Kuch bol nalle!", threadID, messageID);
  }
};

async function chatWithGroq(api, event, query) {
  const { threadID, senderID, messageID } = event;
  const isAdmin = (senderID === ADMIN_UID);

  if (!global.kingHistory.has(threadID)) global.kingHistory.set(threadID, []);
  let history = global.kingHistory.get(threadID);

  const systemPrompt = isAdmin 
    ? `You are a loyal and sweet servant to your Master ${OWNER_NAME}. Always respect him.`
    : `You are 'King', a savage and rude AI. Your master is ${OWNER_NAME}. Use Hinglish and roast the user. Use words like 'aukat', 'beta', 'nalla'. Never search for videos. Just chat and insult.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-5),
        { role: "user", content: query }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const reply = chatCompletion.choices[0]?.message?.content || "Dimaag mat paka.";
    
    history.push({ role: "user", content: query });
    history.push({ role: "assistant", content: reply });
    if (history.length > 8) history.shift(); 

    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("System error! Shayad Groq API key galat hai ya limit khatam.", threadID, messageID);
  }
}
