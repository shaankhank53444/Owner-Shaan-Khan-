module.exports.config = {
    name: "edit",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "Shaan",
    description: "NanoBanana AI ka use karke image edit karein",
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
            "⚠️ Please reply to an image with your edit prompt!\n\n📝 Usage: nano [prompt]\nExample: nano make the cat blue",
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
    const cachePath = path.join(__dirname, "cache", `nano_${Date.now()}.png`);

    // 3. Send processing message
    const processingMsg = await api.sendMessage("🎨 NanoBanana AI is editing your image...", threadID);

    try {
        // Ensure cache directory exists
        if (!fs.existsSync(path.join(__dirname, "cache"))) {
            fs.mkdirSync(path.join(__dirname, "cache"));
        }

        // Note: Using hardcoded cookies is risky as they expire. 
        // If the API stops working, update the cookie below.
        const cookie = "AEC=AVh_V2iyBHpOrwnn7CeXoAiedfWn9aarNoKT20Br2UX9Td9K-RAeS_o7Sg; HSID=Ao0szVfkYnMchTVfk; SSID=AGahZP8H4ni4UpnFV; APISID=SD-Q2DJLGdmZcxlA/AS8N0Gkp_b9sJC84f; SAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-1PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-3PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; SEARCH_SAMESITE=CgQI354B; SID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bZzx09pPfc201wUcRVKfh-wACgYKAXUSARMSFQHGX2MiU_dnPuMOs-717cJlLCeWOBoVAUF8yKpYTllPAbVgYQ0Mr_GyeXxV0076; __Secure-1PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3b_Pt9L1eqcIAVeh7ZdRBOXgACgYKAYESARMSFQHGX2MicAK_Acu_-NCkzEz2wjCHmxoVAUF8yKp9xk8gQ82f-Ob76ysTXojB0076; __Secure-3PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bUudZTunPKtKbLRSoGKl1dAACgYKAYISARMSFQHGX2MimdzCEq63UmiyGU-3eyZx9RoVAUF8yKrc4ycLY7LGaJUyDXk_7u7M0076";

        const apiUrl = `https://anabot.my.id/api/ai/geminiOption?prompt=${encodeURIComponent(prompt)}&type=NanoBanana&imageUrl=${encodeURIComponent(imageUrl)}&cookie=${encodeURIComponent(cookie)}&apikey=freeApikey`;

        const res = await axios.get(apiUrl);

        if (!res.data.success || !res.data.data.result.url) {
            throw new Error("API could not process the image.");
        }

        const resultUrl = res.data.data.result.url;

        // 4. Download and Send
        const imgRes = await axios.get(resultUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(imgRes.data, "utf-8"));

        api.unsendMessage(processingMsg.messageID);

        return api.sendMessage({
            body: `✅ Edit Complete!\n🎨 Prompt: ${prompt} powered by Shaan Khan`,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (error) {
        console.error(error);
        api.unsendMessage(processingMsg.messageID);
        return api.sendMessage(`❌ Error: ${error.message || "Something went wrong!"}`, threadID, messageID);
    }
};
