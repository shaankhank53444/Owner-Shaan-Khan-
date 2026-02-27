const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "botdpchange",
    version: "1.0.0",
    hasPermssion: 2, // 2 ka matlab sirf Bot Admin chala sakta hai
    credits: "SARDAR RDX",
    description: "Bot ki profile picture badlein",
    commandCategory: "Admin",
    usages: "Photo par reply karke 'botdpchange' likhein",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    // 1. Check karein ki kya user ne kisi image par reply kiya hai
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
        return api.sendMessage("⚠️ Error: Please reply to an image to change bot's profile picture.", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];

    // 2. Check karein ki attachment photo hi hai ya nahi
    if (attachment.type !== 'photo') {
        return api.sendMessage("❌ Error: Sirf photo par reply karein!", threadID, messageID);
    }

    const imageUrl = attachment.url;
    const cachePath = path.join(__dirname, 'cache', `bot_pfp_${Date.now()}.jpg`);

    try {
        // Cache directory check karein
        if (!fs.existsSync(path.join(__dirname, 'cache'))) {
            fs.mkdirSync(path.join(__dirname, 'cache'));
        }

        api.sendMessage("⏳ Processing... Bot ki profile picture badli ja rahi hai.", threadID, messageID);

        // 3. Image download karein
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(cachePath, Buffer.from(response.data));

        // 4. API ke zariye Avatar change karein
        if (typeof api.changeAvatar !== "function") {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            return api.sendMessage("❌ Error: Aapka Facebook API 'changeAvatar' function support nahi karta.", threadID, messageID);
        }

        api.changeAvatar(fs.createReadStream(cachePath), (err) => {
            // Cleanup: Temp file delete karein
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

            if (err) {
                console.error(err);
                return api.sendMessage("❌ DP change nahi ho saki. Facebook ne shayad block kar diya hai.", threadID, messageID);
            } else {
                return api.sendMessage("✅ Success! Bot ki Profile Picture change ho gayi hai.", threadID, messageID);
            }
        });

    } catch (error) {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        console.error(error);
        return api.sendMessage(`❌ System Error: ${error.message}`, threadID, messageID);
    }
};
