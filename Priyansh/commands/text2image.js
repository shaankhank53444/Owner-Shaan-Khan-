const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "text2image",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Generate AI images or write text on replied image",
    commandCategory: "AI & IMAGE GENERATION",
    usages: "[prompt] or reply to an image with text",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, type, messageReply } = event;
    const input = args.join(" ");

    // Check if user replied to an image
    const isReplyImage = type === "message_reply" && 
                         messageReply.attachments && 
                         messageReply.attachments.length > 0 && 
                         messageReply.attachments[0].type === "photo";

    if (!input && !isReplyImage) {
        return api.sendMessage("╭─❍\n│ 𝖯𝗅𝖾𝖺𝗌𝖾 𝖾𝗇𝗍𝖾𝗋 𝖺 𝗉𝗋𝗈𝗆𝗉𝗍 𝗈𝗋 𝗋𝖾𝗉𝗅𝗒 𝗍𝗈 𝖺𝗇 𝗂𝗆𝖺𝗀𝖾!\n╰───────────⟡", threadID, messageID);
    }

    api.setMessageReaction("⏳", messageID, (err) => {}, true);
    const startTime = Date.now();

    const cacheDir = path.join(__dirname, 'cache');
    const cachePath = path.join(cacheDir, `t2i_${senderID}_${Date.now()}.png`);

    try {
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        let imageUrl = "";

        // CASE 1: User replied to an existing image -> Add Stylish Text on Image
        if (isReplyImage) {
            const targetImageUrl = messageReply.attachments[0].url;
            const textToDraw = input || "Mirai Bot"; // Default text if prompt empty
            
            // Text placement API (adds stylish text overlay on the image without creating a new random pic)
            imageUrl = `https://api.popcat.xyz/welcomecard?background=${encodeURIComponent(targetImageUrl)}&text1=${encodeURIComponent(textToDraw)}&text2=${encodeURIComponent("Created with Mirai")}&avatar=https://i.imgur.com/6E2S61v.png`;
        } 
        // CASE 2: No image reply -> Generate fresh AI image from prompt
        else {
            imageUrl = `https://xalman-apis.vercel.app/api/flux?prompt=${encodeURIComponent(input)}`;
        }

        // Fetch image as buffer
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer',
            timeout: 120000 
        });

        fs.writeFileSync(cachePath, Buffer.from(response.data, 'binary'));

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        api.setMessageReaction("✅", messageID, (err) => {}, true);

        const headerText = isReplyImage ? "❖ 𝖨𝖬𝖠𝖦𝖤 𝖳𝖤𝖷𝖳 𝖮𝖵𝖤𝖱𝖫𝖠𝖸 ❖" : "❖ 𝖳𝖤𝖷𝖳 𝖳𝖮 𝖨𝖬𝖠𝖦𝖤 ❖";
        const msgBody = `${headerText}\n━━━━━━━━━━━━━━━━━━\n✎ 𝖳𝖾𝗑𝗍/𝖯𝗋𝗈𝗆𝗉𝗍: ${input || 'N/A'}\n⏱️ 𝖲𝗉𝖾𝖾𝖽: ${timeTaken}𝗌\n━━━━━━━━━━━━━━━━━━\n𝗢𝘄𝗻𝗲𝗿 : 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻`;

        return api.sendMessage({
            body: msgBody,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (error) {
        console.error(error);
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        return api.sendMessage(`✕ 𝖯𝗋𝗈𝖼𝖾𝗌𝗌𝗂𝗇𝗀 𝖥𝖺𝗂𝗅𝖾𝖽!\n𝖤𝗋𝗋𝗈𝗋: ${error.message}`, threadID, messageID);
    }
};
