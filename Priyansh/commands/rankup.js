module.exports.config = {
    name: "rankup",
    version: "8.0.0",
    hasPermssion: 1,
    credits: "Shaan",
    description: "Rankup with persistent storage and balanced progression",
    commandCategory: "Edit-IMG",
    dependencies: {
        "fs-extra": "",
        "axios": "",
        "canvas": ""
    },
    cooldowns: 2,
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
    var { threadID, senderID } = event;
    if (senderID == api.getCurrentUserID()) return;

    const { createReadStream, writeFileSync, existsSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { loadImage, createCanvas } = require("canvas");
    const axios = global.nodemodule["axios"];

    // Rankup enable/disable check
    const thread = global.data.threadData.get(threadID) || {};
    if (typeof thread["rankup"] != "undefined" && thread["rankup"] == false) return;

    // Database se data lein
    let data = await Currencies.getData(senderID) || {};
    let exp = data.exp || 0;
    let money = data.money || 0;

    // Har message par 1 EXP barhaein (Database persistent)
    exp = exp + 1;
    await Currencies.setData(senderID, { exp });

    // Balanced Level Formula: 
    // Is formula se level 1 se 2 jane ke liye 20 messages chahiye honge.
    // Level jitna upar jayega, mehnat utni barhti jayegi.
    const curLevel = Math.floor(0.2 * Math.sqrt(exp));
    const nextLevel = Math.floor(0.2 * Math.sqrt(exp + 1));

    // Level Up Trigger
    if (nextLevel > curLevel && nextLevel > 0) {
        const name = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
        
        // Reward: Level ke hisab se paisay (Level 5 = 50 coins)
        const reward = nextLevel * 10;
        let newBalance = money + reward;
        await Currencies.setData(senderID, { money: newBalance });

        let msg = `╔═════════════════╗\n   🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 𝗡𝗢𝗧𝗜𝗖𝗘 🎊\n╚═════════════════╝\n\n  ✨ 𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀 ✨\n  👤 ${name}\n\n  🏆 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: ${nextLevel}\n  💰 𝗕𝗮𝗻𝗸 𝗥𝗲𝘄𝗮𝗿𝗱: +${reward} Coins\n  💳 𝗡𝗲𝘄 𝗕𝗮𝗹𝗮𝗻𝗰ε: ${newBalance} Coins\n\n───────────────────\nKeep chatting to reach next level!\n───────────────────`;

        try {
            let pathImg = __dirname + `/cache/rankup_${senderID}.png`;
            let pathAvt = __dirname + `/cache/avt_${senderID}.png`;

            // Background Image
            let bgUrl = "https://i.ibb.co/MkFZt3sH/594446bbfd2a.jpg";
            let avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

            let getAvt = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;
            let getBg = (await axios.get(bgUrl, { responseType: "arraybuffer" })).data;

            writeFileSync(pathAvt, Buffer.from(getAvt, "utf-8"));
            writeFileSync(pathImg, Buffer.from(getBg, "utf-8"));

            let baseImage = await loadImage(pathImg);
            let baseAvt = await loadImage(pathAvt);

            let canvas = createCanvas(baseImage.width, baseImage.height);
            let ctx = canvas.getContext("2d");

            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

            // Circular Avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2.5, 150, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(baseAvt, (canvas.width / 2) - 150, (canvas.height / 2.5) - 150, 300, 300);
            ctx.restore();

            const imageBuffer = canvas.toBuffer();
            writeFileSync(pathImg, imageBuffer);

            api.sendMessage({
                body: msg,
                mentions: [{ tag: name, id: senderID }],
                attachment: createReadStream(pathImg)
            }, threadID, () => {
                if (existsSync(pathImg)) unlinkSync(pathImg);
                if (existsSync(pathAvt)) unlinkSync(pathAvt);
            });
        } catch (e) {
            api.sendMessage(msg, threadID);
        }
    }
}

module.exports.run = async function({ api, event, Threads }) {
    const { threadID, messageID } = event;
    let data = (await Threads.getData(threadID)).data || {};

    if (typeof data["rankup"] == "undefined" || data["rankup"] == false) data["rankup"] = true;
    else data["rankup"] = false;

    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);
    return api.sendMessage(`Rankup notification is now ${(data["rankup"] == true) ? "ON" : "OFF"}`, threadID, messageID);
}
