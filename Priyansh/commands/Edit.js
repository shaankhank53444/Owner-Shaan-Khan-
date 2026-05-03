const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports.config = {
    name: "edit",
    version: "2.3.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Gemini Nano AI Editor",
    commandCategory: "Media",
    usages: "[prompt]",
    prefix: false,
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, messageReply, type } = event;

    // 1. Check if it's a reply to an image
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ Kisi photo ko reply kar ke prompt likhein!", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("❌ Prompt missing! Bataiye kya edit karna hai?", threadID, messageID);

    const waitMsg = await api.sendMessage("🎨 AI processing shuru kar raha hai...", threadID);

    try {
        // Initialize Gemini with your API Key
        const genAI = new GoogleGenerativeAI("AIzaSyBIkaNEcZLektmSx5a1ewKjpdnUE-PjK7w");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Get image from reply
        const imageUrl = messageReply.attachments[0].url;
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        
        const imageData = {
            inlineData: {
                data: Buffer.from(res.data).toString("base64"),
                mimeType: "image/jpeg"
            }
        };

        // Call Gemini
        const result = await model.generateContent([prompt, imageData]);
        const response = await result.response;
        const text = response.text();

        api.unsendMessage(waitMsg.messageID);

        return api.sendMessage(`✅ AI Response:\n\n${text}\n\n✨ Credits: Shaan Khan`, threadID, messageID);

    } catch (error) {
        console.error(error);
        if (waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
        return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
};
