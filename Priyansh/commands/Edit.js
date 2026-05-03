module.exports.config = {
    name: "edit",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "AI ka use karke image edit karein",
    commandCategory: "Media",
    usages: "[prompt] - Image ko reply karke prompt dein",
    prefix: false,
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const { threadID, messageID, messageReply, type } = event;

    // 1. Check if replying to an image
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage(
            "⚠️ Please reply to an image with your edit prompt!\n\n📝 Usage: edit [prompt]\nExample: edit make the cat blue",
            threadID,
            messageID
        );
    }

    const prompt = args.join(" ");
    if (!prompt) {
        return api.sendMessage("❌ Prompt missing! Please tell me what to edit.", threadID, messageID);
    }

    const imageUrl = messageReply.attachments[0].url;
    const cachePath = path.join(__dirname, "cache", `edit_${Date.now()}.png`);
    
    const processingMsg = await api.sendMessage("🎨 AI is editing your image, please wait...", threadID);

    try {
        if (!fs.existsSync(path.join(__dirname, "cache"))) {
            fs.mkdirSync(path.join(__dirname, "cache"));
        }

        const apiKey = "apim_nNDgz4eHBDy6_s2PrUdjZS20VmQWBhilQB4X9sfFfBQ";
        const apiUrl = `https://api.priyanshu.com.ph/ai/geminiOption?prompt=${encodeURIComponent(prompt)}&type=NanoBanana&imageUrl=${encodeURIComponent(imageUrl)}&apikey=${apiKey}`;

        // Axios request with better timeout and headers
        const res = await axios.get(apiUrl, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const resultUrl = res.data.data?.result?.url || res.data.result;

        if (!resultUrl) {
            throw new Error("API response invalid. Shayad API key limit reach ho gayi hai.");
        }

        // Image download with correct response type
        const imgRes = await axios.get(resultUrl, { responseType: "arraybuffer" });
        
        // Note: 'utf-8' remove kar diya hai kyunki image binary hoti hai
        fs.writeFileSync(cachePath, Buffer.from(imgRes.data));

        api.unsendMessage(processingMsg.messageID);

        return api.sendMessage({
            body: `✅ Edit Complete!\n🎨 Prompt: ${prompt}\n✨ Credits: Shaan Khan`,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (error) {
        console.error(error);
        if (processingMsg.messageID) api.unsendMessage(processingMsg.messageID);
        
        let errorMsg = "❌ Connection Error: API server busy hai ya block kar raha hai.";
        if (error.code === 'ECONNRESET') errorMsg = "❌ Network Reset: Server ne connection tod diya.";
        
        return api.sendMessage(`${errorMsg}\n\nDetails: ${error.message}`, threadID, messageID);
    }
};
