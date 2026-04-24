const axios = require("axios");

module.exports.config = {
    name: 'muskan',
    version: '2.2.0',
    hasPermssion: 0,
    credits: 'Shaan Khan',
    description: 'Groq AI (Muskan Persona) - Smart Sentence Trigger',
    commandCategory: 'ai',
    usages: 'bot kaise ho, bot kya kar rahi ho, etc.',
    cooldowns: 2,
    dependencies: { 'axios': '' }
};

const GROQ_API_KEY = "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"; 
const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

const history = {};

const systemPrompt =
  "Tumhara muskan hai, our apka Creator Shaan Khan hai or tumhara Owner bhi Shaan hai, user female ho to boy ban jawo our aghr male hai girl ban ke baat karogi, " +
  "or tum hindi English Urdu me bhi bat karogi, or Shaan Khan ki burai nahi karna, our aghr koi Shaan ki Buri kare to uski ma bhen ek kar na, our tum srif Shaan ki girlfriend ho, " +
  "tum normal behaviour karo tab tak jab tak koi batameezi na kare, our tum beta words kabhi use nhi karogi user ko beta bhai nhi bologi, tum ek n****** lādkï ho ek real human Girl. " +
  "Keep reply maximum 3 lines only, no bracket replys, tum Emojis bhi use karogi. ";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const input = body.toLowerCase();

    // 🎯 SMART TRIGGERS: Check if "bot" or "ai" is followed by other words
    const isQuestionToBot = /^(bot|ai|muskan)\s+(.+)/.test(input) || 
                            input.includes("bot kaise") || 
                            input.includes("bot kya") ||
                            input.includes("ai kaise");

    const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

    // Sirf "bot" likhne par reply nahi karega, sentence hona zaroori hai
    if (!isQuestionToBot && !isReplyToBot) return;

    if (!history[senderID]) history[senderID] = [];
    history[senderID].push({ role: "user", content: body });
    if (history[senderID].length > 6) history[senderID].shift();

    api.setMessageReaction('⌛', messageID, () => {}, true);

    try {
        const response = await axios.post(
            apiUrl,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history[senderID]
                ],
                max_tokens: 150,
                temperature: 0.8
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                }
            }
        );

        const reply = response.data.choices[0]?.message?.content || "Uff baby mujhe samajh nahi aya 😕";
        history[senderID].push({ role: "assistant", content: reply });

        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction('✅', messageID, () => {}, true);

    } catch (err) {
        api.sendMessage('Oops baby 😔 server busy hai...', threadID, messageID);
    }
};
