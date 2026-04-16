module.exports.config = {
    name: "rankup",
    version: "8.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Rankup system with static, level-specific images (No Canvas)",
    commandCategory: "Rank",
    dependencies: {
        "fs-extra": "",
        "axios": ""
    },
    cooldowns: 2,
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
    var { threadID, senderID } = event;
    const { createReadStream, writeFileSync, existsSync, unlinkSync, mkdirSync } = global.nodemodule["fs-extra"];
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

        const baseBonus = nextLevelCalculated * 100; 
        let newBalance = currentMoney + baseBonus;
        await Currencies.setData(senderID, { money: newBalance });

        const currentBankCapacity = nextLevelCalculated * 10000;

        // --- LEVEL-SPECIFIC IMAGE SYSTEM ---
        // Bhai, yahan aap har level ke liye alag image link daal sakte hain.
        // Agar level map mein nahi milega, toh 'default' image jayegi.
        const levelImages = {
            "2": "https://i.ibb.co/4P254X5/level2.jpg",
            "3": "https://i.ibb.co/m0f27V6/level3.jpg",
            "4": "https://i.ibb.co/8Yh4F8p/level4.jpg",
            "5": "https://i.ibb.co/C0605X5/level5.jpg",
            "10": "https://i.ibb.co/xyz123/level10.jpg", // Example
            "default": "https://i.ibb.co/MkFZt3sH/594446bbfd2a.jpg" // Agar level define na ho
        };

        // Current level ki image nikalna
        const imageUrl = levelImages[nextLevelCalculated.toString()] || levelImages["default"];

        // --- UPDATED MESSAGE WITH OWNER CREDIT ---
        let levelUpMessage = `‎🎉 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣! 🎉\n\nCongratulations ${userName}!\nYou have reached Level ${nextLevelCalculated}!\n\n💰 Bonus: +${baseBonus} coins\n🏦 Bank Capacity: ${currentBankCapacity.toLocaleString()}\n\n───────────────────\n👑 𝗢𝘄𝗻𝗲𝗿: 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻\n───────────────────`;

        try {
            const cachePath = __dirname + '/cache/';
            if (!existsSync(cachePath)) mkdirSync(cachePath, { recursive: true });
            
            const pathImg = cachePath + `rankup_static_${senderID}_${nextLevelCalculated}.png`;

            // Image download karna
            const getImgResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
            writeFileSync(pathImg, Buffer.from(getImgResponse.data, "utf-8"));

            // Message send karna image attachment ke saath
            api.sendMessage({
                body: levelUpMessage,
                mentions: [{ tag: userName, id: senderID }],
                attachment: createReadStream(pathImg)
            }, threadID, () => {
                // Send hone ke baad cache clean karna
                if (existsSync(pathImg)) unlinkSync(pathImg);
            });

        } catch (error) {
            // Agar image load na ho, toh sirf text message bhejen
            console.error("Rankup image error:", error);
            api.sendMessage(levelUpMessage, threadID);
        }
    }
}

module.exports.run = async function({ api, event, Threads }) {
    const { threadID, messageID } = event;
    let threadData = (await Threads.getData(threadID)).data || {};

    if (typeof threadData["rankup"] === "undefined" || threadData["rankup"] === false) {
        threadData["rankup"] = true;
    } else {
        threadData["rankup"] = false;
    }

    await Threads.setData(threadID, { data: threadData });
    global.data.threadData.set(threadID, threadData);
    
    const status = (threadData["rankup"] === true) ? "ON" : "OFF";
    return api.sendMessage(`Rankup notification is now ${status}`, threadID, messageID);
}
