module.exports.config = {
    name: "edit",
    version: "1.0.1",
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

    // 2. Check for prompt
    const prompt = args.join(" ");
    if (!prompt) {
        return api.sendMessage(
            "❌ Prompt missing! Please tell me what to edit in the image.",
            threadID,
            messageID
        );
    }

    const imageUrl = messageReply.attachments[0].url;
    const cachePath = path.join(__dirname, "cache", `edit_${Date.now()}.png`);

    // 3. Send processing message
    const processingMsg = await api.sendMessage("🎨 AI is editing your image...", threadID);

    try {
        // Ensure cache directory exists
        if (!fs.existsSync(path.join(__dirname, "cache"))) {
            fs.mkdirSync(path.join(__dirname, "cache"));
        }

        // Aapki nayi API Key
        const apiKey = "apim_nNDgz4eHBDy6_s2PrUdjZS20VmQWBhilQB4X9sfFfBQ";

        // Logic same rakha hai: geminiOption endpoint aur NanoBanana type
        const apiUrl = `https://api.priyanshu.com.ph/ai/geminiOption?prompt=${encodeURIComponent(prompt)}&type=NanoBanana&imageUrl=${encodeURIComponent(imageUrl)}&apikey=${apiKey}`;

        const res = await axios.get(apiUrl);

        // Logic for extracting result URL from your specific API structure
        const resultUrl = res.data.data?.result?.url || res.data.result;

        if (!resultUrl) {
            throw new Error("API could not process the image. Check if the API key is active.");
        }

        // 4. Download and Send
        const imgRes = await axios.get(resultUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(imgRes.data, "utf-8"));

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
        return api.sendMessage(`❌ Error: ${error.message || "Something went wrong!"}`, threadID, messageID);
    }
};
