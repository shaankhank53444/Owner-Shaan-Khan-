module.exports.config = {
    name: "pair8",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Tag se ya random pairing photo (FCA Fix)",
    commandCategory: "Picture",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "jimp": "",
        "path": ""
    }
};

module.exports.onLoad = async () => {
    const { resolve } = global.nodemodule["path"];
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { downloadFile } = global.nodemodule["utils"];
    const dir = __dirname + "/uzair/mtx/";
    const pathImg = resolve(__dirname, "uzair/mtx", "SHAAN.jpeg");

    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(pathImg)) await downloadFile("https://i.ibb.co/GDYZVM1/SHAAN.jpg", pathImg);
};

async function circle(imagePath) {
    const jimp = require("jimp");
    let img = await jimp.read(imagePath);
    img.circle();
    return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
    const fs = global.nodemodule["fs-extra"];
    const path = global.nodemodule["path"];
    const axios = global.nodemodule["axios"];
    const jimp = global.nodemodule["jimp"];
    const dir = path.resolve(__dirname, "uzair", "mtx");

    let baseImage = await jimp.read(dir + "/SHAAN.jpeg");
    let pathSave = dir + `/pairing_${one}_${two}.png`;
    let pathOne = dir + `/avt_${one}.png`;
    let pathTwo = dir + `/avt_${two}.png`;

    let avatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathOne, Buffer.from(avatarOne, "utf-8"));

    let avatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathTwo, Buffer.from(avatarTwo, "utf-8"));

    let circleOne = await jimp.read(await circle(pathOne));
    let circleTwo = await jimp.read(await circle(pathTwo));

    baseImage.composite(circleOne.resize(264, 264), 11, 240)
             .composite(circleTwo.resize(262, 262), 450, 240);

    let resultBuffer = await baseImage.getBufferAsync("image/png");
    fs.writeFileSync(pathSave, resultBuffer);
    fs.unlinkSync(pathOne);
    fs.unlinkSync(pathTwo);

    return pathSave;
}

module.exports.run = async function({ api, event, args, Users }) {
    const fs = require("fs-extra");
    const { threadID, messageID, senderID, mentions } = event;

    let targetID, targetName;

    // --- Mention Fix Logic ---
    if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace("@", "");
    } else if (args.length > 0) {
        const searchName = args.join(" ").replace("@", "").toLowerCase();
        const threadInfo = await api.getThreadInfo(threadID);
        const participantIDs = threadInfo.participantIDs;

        for (let id of participantIDs) {
            let name = await Users.getNameUser(id);
            if (name.toLowerCase().includes(searchName)) {
                targetID = id;
                targetName = name;
                break;
            }
        }
    }

    // Agar koi tag nahi kiya toh random member select karein
    if (!targetID) {
        const threadInfo = await api.getThreadInfo(threadID);
        const randomList = threadInfo.participantIDs.filter(id => id !== senderID);
        targetID = randomList[Math.floor(Math.random() * randomList.length)];
        targetName = await Users.getNameUser(targetID);
    }

    const senderName = await Users.getNameUser(senderID);
    const scoreList = ["83%", "67%", "19%", "76%", "21%", "96%", "100%", "62%", "37%", "52%", "87%", "99%", "0%", "48%"];
    const randomScore = scoreList[Math.floor(Math.random() * scoreList.length)];

    const targetInfo = await api.getUserInfo(targetID);
    const genderNum = targetInfo[targetID].gender;
    const genderText = genderNum == 2 ? "Male🧑" : genderNum == 1 ? "Female👩‍" : "Other🌈";

    const mentionData = [
        { id: senderID, tag: senderName },
        { id: targetID, tag: targetName }
    ];

    const imgPath = await makeImage({ one: senderID, two: targetID });

    const msgBody = `◈ ━━━━━━━━━━━━ 💚✨\n\n𝐂𝐫𝐞𝐝𝐢𝐭 ➻ 𝐎𝐖𝐍𝐄𝐑 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍\n\n𝐘𝐄𝐇 𝐉𝐎 𝐏𝐄𝐒𝐇𝐀𝐍𝐈 𝐏𝐄 𝐁𝐎𝐒𝐀 𝐃𝐈𝐘𝐀 𝐇𝐀𝐈 𝐓𝐔𝐍𝐄 𝐘𝐀𝐇𝐈 𝐓𝐎𝐇 𝐌𝐎𝐇𝐀𝐁𝐁𝐀𝐓 𝐊𝐈 𝐌𝐀𝐈𝐑𝐀𝐉 𝐇𝐔𝐈 𝐇𝐀𝐈🌹🕊️🦋\n\n◈ ━━━━━━━━━━━━ 💚✨\n\n➻ 〘 ${senderName} 〙 💞 is now paired with 💘 〘 ${targetName} 〙\n\n🧬 Gender: ${genderText}\n📊 Pairing Score: ${randomScore}\n\n◈ ━━━━━━━━━━━━ 💚✨`;

    return api.sendMessage({
        body: msgBody,
        mentions: mentionData,
        attachment: fs.createReadStream(imgPath)
    }, threadID, () => fs.unlinkSync(imgPath), messageID);
};
