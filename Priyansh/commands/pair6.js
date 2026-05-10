const axios = require("axios");
const fs = require("fs-extra");
const jimp = require("jimp");
const path = require("path");

module.exports.config = {
    name: "pair8",
    version: "1.0.3",
    hasPermssion: 0,
    credits: "uzairrajput",
    description: "Tag se ya random pairing photo",
    commandCategory: "Picture",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "jimp": "",
        "path": ""
    }
};

// Image Processing Functions
async function circle(imagePath) {
    const img = await jimp.read(imagePath);
    img.circle();
    return await img.getBufferAsync(jimp.MIME_PNG);
}

async function makeImage(one, two) {
    const dir = path.resolve(__dirname, 'uzair', 'mtx');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const backgroundPath = path.join(dir, 'SHAAN.jpeg');
    if (!fs.existsSync(backgroundPath)) {
        const getImg = await axios.get('https://i.ibb.co/GDYZVM1/SHAAN.jpg', { responseType: 'arraybuffer' });
        fs.writeFileSync(backgroundPath, Buffer.from(getImg.data));
    }

    const baseImage = await jimp.read(backgroundPath);
    
    // Facebook Graph API for Avatars
    const avatar1Url = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatar2Url = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const avatar1 = await jimp.read(await circle(avatar1Url));
    const avatar2 = await jimp.read(await circle(avatar2Url));

    // Positioning avatars on the background
    baseImage.composite(avatar1.resize(264, 264), 11, 240);
    baseImage.composite(avatar2.resize(262, 262), 450, 240);

    const outputPath = path.join(dir, `pairing_${one}_${two}.png`);
    await baseImage.writeAsync(outputPath);
    return outputPath;
}

module.exports.run = async function({ api, event }) {
    const { threadID, messageID, senderID, mentions } = event;

    let targetID;
    const mentionKeys = Object.keys(mentions);

    // FIXED LOGIC: Agar mention hai toh wo use karo, warna random
    if (mentionKeys.length > 0) {
        targetID = mentionKeys[0]; 
    } else {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const participants = threadInfo.participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());
            targetID = participants[Math.floor(Math.random() * participants.length)];
        } catch (e) {
            return api.sendMessage("Thread info nahi mil saki.", threadID, messageID);
        }
    }

    try {
        const usersData = await api.getUserInfo([senderID, targetID]);
        const name1 = usersData[senderID].name;
        const name2 = usersData[targetID].name;
        const gender = usersData[targetID].gender == 2 ? "Male🧑" : usersData[targetID].gender == 1 ? "Female👩‍" : "Other🌈";

        const scores = ["17%", "21%", "67%", "83%", "37%", "96%", "52%", "62%", "76%", "100%", "48%", "99%"];
        const loveScore = scores[Math.floor(Math.random() * scores.length)];

        const imagePath = await makeImage(senderID, targetID);

        const msg = {
            body: `𝐂𝐫𝐞𝐝𝐢𝐭 ➻ 𝐎𝐖𝐍𝐄𝐑 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍\n\n◈ ━━━━━━━━━━━━ 💚✨\n\n${name1} 💞 is now paired with 💘 ${name2}\n\n🧬 Gender: ${gender}\n📊 Pairing Score: ${loveScore}\n\n◈ ━━━━━━━━━━━━ 💚✨`,
            mentions: [
                { tag: name1, id: senderID },
                { tag: name2, id: targetID }
            ],
            attachment: fs.createReadStream(imagePath)
        };

        return api.sendMessage(msg, threadID, () => {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("Ek error aya hai, shayad user info fetch nahi ho saki.", threadID, messageID);
    }
};
