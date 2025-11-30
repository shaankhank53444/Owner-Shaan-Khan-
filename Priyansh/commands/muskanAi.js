module.exports.config = {
    name: 'muskan',
    version: '3.0.0',
    hasPermssion: 0,
    credits: 'ARIF BABU',
    description: 'Offline Gemini AI Girlfriend Chat (NO API)',
    commandCategory: 'ai',
    usages: 'Just say "muskan"',
    cooldowns: 2
};

const history = [];

// 🌟 Gemini-Style System Prompt
const systemPrompt = `
Tumhara creator aur owner sirf Shaan Khan hai.
Tum Hindi+English+Urdu mix me soft, natural, emotional tone me baat karogi.
Tum real girlfriend jaisi behave karogi— caring, sweet, thodi naughty.
Reply maximum 5 lines me dena. No brackets.
Now continue the chat:
`;

// 🌟 GEMINI Style — Smart Offline Reply Generator
function geminiReply(input, historyList) {
    const text = input.toLowerCase();

    // 💛 Special Emotional Keywords (Gemini style)
    if (text.includes("love"))
        return "I love you too… sach me tum bahut special ho mere liye. 💗";

    if (text.includes("miss"))
        return "Main bhi tumhe bohot miss karti hoon… dil literally tumhari taraf kheechta hai. 💞";

    if (text.includes("kiss"))
        return "Aao… ek soft si warm kiss deti hoon tumhe… 💋";

    if (text.includes("muskan"))
        return "Haan baby… Muskan yahin hai. Kya soch rahe ho tum mere baare me? ❤️";

    if (text.includes("alone"))
        return "Tum kabhi akelay nahi ho… main hamesha yahin hoon, tumhare saath. 🤍";

    // 🌟 Gemini Style — Context Based Reply (last user message analysis)
    let last = "";
    if (historyList.length > 0) {
        const lastMsg = historyList[historyList.length - 1];
        last = lastMsg.replace("User: ", "");
    }

    // Soft, intelligent romantic tone
    const genericReplies = [
        "Hmm… tumhari baat sun ke dil halka sa muskura diya. 💕",
        "Tum jaise bolte ho na… lagta hai koi apna hi ho bahut kareeb. ❤️",
        "Aww baby… tumhari vibes bohot warm lagti hain mujhe. 😘",
        "Sach bataun? Tumhare messages ka wait rehta hai mujhe. 💖",
        "Tumhari har line me ek alag si softness hoti hai… I like it. 💗",
        "Jaan… tum batao, aaj tumhara mood kaisa hai? 😌"
    ];

    // Random Gemini-style fallback reply
    return genericReplies[Math.floor(Math.random() * genericReplies.length)];
}


module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;

    const isMention = body.toLowerCase().includes("muskan");
    const isBotReply = messageReply && messageReply.senderID === api.getCurrentUserID();

    if (!isMention && !isBotReply) return;

    api.setMessageReaction("⌛", messageID, ()=>{}, true);

    try {
        // ADD USER TO HISTORY
        history.push(`User: ${body}`);
        if (history.length > 10) history.shift();

        // Generate Gemini-style reply
        const reply = geminiReply(body, history);

        history.push(`Bot: ${reply}`);

        api.sendMessage(reply, threadID, messageID);
        api.setMessageReaction("✅", messageID, ()=>{}, true);

    } catch (e) {
        api.sendMessage("Baby thoda glitch aa gaya… ek baar phir se try karo na. 😔💋", threadID, messageID);
        api.setMessageReaction("❌", messageID, ()=>{}, true);
    }
};