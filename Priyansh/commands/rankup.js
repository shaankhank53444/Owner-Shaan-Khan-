module.exports.config = {
    name: "rankup",
    version: "7.7.2",
    hasPermssion: 0,
    credits: "Shaan",
    description: "Rankup with Owner Shaan credit in message",
    commandCategory: "Rank",
    dependencies: {
        "fs-extra": "",
        "axios": "",
        "canvas": ""
    },
    cooldowns: 2,
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
    var { threadID, senderID } = event;
    const { createReadStream, writeFileSync, existsSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { loadImage, createCanvas } = require("canvas");
    const axios = global.nodemodule["axios"];

    const threadData = global.data.threadData.get(threadID) || {};
    if (threadData.rankup === false) return;

    let userData = await Currencies.getData(senderID);
    let currentExp = userData.exp || 0;
    let currentMoney = userData.money || 0;

    currentExp += 1;
    await Currencies.setData(senderID, { exp: currentExp });

    const div = 5; 
    const currentLevelCalculated = Math.floor((Math.sqrt(1 + (4 * (currentExp - 1) / div) + 1) / 2));
    const nextLevelCalculated = Math.floor((Math.sqrt(1 + (4 * currentExp / div) + 1) / 2));

    if (nextLevelCalculated > currentLevelCalculated && nextLevelCalculated !== 1) {
        
        let userName = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
        userName = String(userName).replace(/null/g, "User");

        const baseBonus = 200; 
        let newBalance = currentMoney + baseBonus;
        await Currencies.setData(senderID, { money: newBalance });

        const currentBankCapacity = nextLevelCalculated * 10000;

        // --- UPDATED MESSAGE WITH OWNER SHAAN ---
        let levelUpMessage = `‎🎉 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣! 🎉\n\nCongratulations ${userName}!\nYou have reached Level ${nextLevelCalculated}!\n\n💰 Bonus: +${baseBonus} coins\n🏦 Bank Capacity: ${currentBankCapacity.toLocaleString()}\n\n───────────────────\n👑 𝗢𝘄𝗻𝗲𝗿: 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻\n───────────────────`;

        try {
            const pathImg = __dirname + `/cache/rankup_${senderID}.png`;
            const pathAvt = __dirname + `/cache/avt_${senderID}.png`;

            const bgUrl = "https://i.ibb.co/MkFZt3sH/594446bbfd2a.jpg";
            const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

            const getAvtResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
            const getBgResponse = await axios.get(bgUrl, { responseType: "arraybuffer" });

            writeFileSync(pathAvt, Buffer.from(getAvtResponse.data, "utf-8"));
            writeFileSync(pathImg, Buffer.from(getBgResponse.data, "utf-8"));

            let canvasBase = await loadImage(pathImg);
            let avatarBase = await loadImage(pathAvt);

            let canvas = createCanvas(canvasBase.width, canvasBase.height);
            let ctx = canvas.getContext("2d");

            ctx.drawImage(canvasBase, 0, 0, canvas.width, canvas.height);

            const avatarX = canvas.width / 2;
            const avatarY = canvas.height / 2.5;
            const avatarRadius = 150;

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip(); 

            ctx.drawImage(avatarBase, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
            ctx.restore(); 

            const imageBuffer = canvas.toBuffer();
            writeFileSync(pathImg, imageBuffer);

            api.sendMessage({
                body: levelUpMessage,
                mentions: [{ tag: userName, id: senderID }],
                attachment: createReadStream(pathImg)
            }, threadID, () => {
                if (existsSync(pathImg)) unlinkSync(pathImg);
                if (existsSync(pathAvt)) unlinkSync(pathAvt);
            });
        } catch (error) {
            api.sendMessage(levelUpMessage, threadID);
        }
    }
}

module.exports.run = async function({ api, event, Threads }) {
    const { threadID, messageID } = event;
    let threadData = (await Threads.getData(threadID)).data || {};

    if (!threadData["rankup"] || threadData["rankup"] === false) {
        threadData["rankup"] = true;
    } else {
        threadData["rankup"] = false;
    }

    await Threads.setData(threadID, { data: threadData });
    global.data.threadData.set(threadID, threadData);
    
    const status = (threadData["rankup"] === true) ? "ON" : "OFF";
    return api.sendMessage(`Rankup notification is now ${status}`, threadID, messageID);
}
