111module.exports.config = {
    name: "rankup",
    version: "7.7.0",
    hasPermssion: 1,
    credits: "Shaan Khan",
    description: "Announce rankup with dynamic coins and mentions",
    commandCategory: "Edit-IMG",
    dependencies: {
        "fs-extra": "",
        "canvas": "",
        "axios": ""
    },
    cooldowns: 2,
};

module.exports.handleEvent = async function({ api, event, Currencies, Users, getText }) {
    var { threadID, senderID } = event;
    const { createReadStream, writeFileSync, removeSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { loadImage, createCanvas } = require("canvas");
    const axios = global.nodemodule["axios"];
    const fs = global.nodemodule["fs-extra"];

    let pathImg = __dirname + "/cache/rankup.png";
    let pathAvt1 = __dirname + "/cache/Avtmot.png";

    threadID = String(threadID);
    senderID = String(senderID);

    const thread = global.data.threadData.get(threadID) || {};

    let data = await Currencies.getData(senderID);
    let exp = data.exp;
    exp = exp += 1;

    if (isNaN(exp)) return;

    if (typeof thread["rankup"] != "undefined" && thread["rankup"] == false) {
        await Currencies.setData(senderID, { exp });
        return;
    };

    // Fast Level Formula
    const curLevel = Math.floor((Math.sqrt(1 + (4 * exp / 1) + 1) / 2));
    const level = Math.floor((Math.sqrt(1 + (4 * (exp + 1) / 1) + 1) / 2));

    if (level > curLevel && level != 1) {
        const name = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
        
        // Dynamic Coins Calculation: Level 1 = 200, Level 2 = 400, Level 3 = 600...
        const bonusCoins = level * 200;
        await Currencies.increaseMoney(senderID, bonusCoins);

        // Message body with proper mention and dynamic values
        let message = `🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n👤 𝗡𝗮𝗺𝗲: ${name}\n🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: ${level}\n💰 𝗕𝗼𝗻𝘂𝘀: +${bonusCoins} Coins\n━━━━━━━━━━━━━━━\n👑 𝗢𝘄𝗻𝗲𝗿: 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻\n\n𝑴𝒂𝒌𝒂 𝒍𝒂𝒅𝒍𝒆 𝒆𝒌 𝒐𝒖𝒓 𝒍𝒆𝒗𝒆𝒍 𝒖𝒑 𝒉𝒖𝒂 𝒕𝒆𝒓𝒂 𝒌𝒊𝒕𝒏𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆 𝒌𝒂𝒓 𝒕𝒉𝒂 𝒉𝒂𝒊 𝒕𝒖`;

        var background = [
            "https://i.ibb.co/DffbB7x/2-7-BDCACE.png",
            "https://i.ibb.co/606p1ZF/1-C0-CF112.png",
            "https://i.ibb.co/54b5KY6/3-10100-BC.png",
            "https://i.ibb.co/4RHd3mM/4-AB4-CF2-B.png",
            "https://i.ibb.co/7WHKF0H/9-498-C5-E0.png",
            "https://i.ibb.co/nPfY3HN/8-ADA7767.png",
            "https://i.ibb.co/Ldctgw4/5-49-F92-DC.png",
            "https://i.ibb.co/J29hdFW/6-EB49-EF4.png"
        ];
        
        var rd = background[Math.floor(Math.random() * background.length)];
        
        try {
            let getAvtmot = (await axios.get(`https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
            writeFileSync(pathAvt1, Buffer.from(getAvtmot, "utf-8"));

            let getbackground = (await axios.get(`${rd}`, { responseType: "arraybuffer" })).data;
            writeFileSync(pathImg, Buffer.from(getbackground, "utf-8"));

            let baseImage = await loadImage(pathImg);
            let baseAvt1 = await loadImage(pathAvt1);
            let canvas = createCanvas(baseImage.width, baseImage.height);
            let ctx = canvas.getContext("2d");
            
            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
            ctx.rotate(-25 * Math.PI / 180);
            ctx.drawImage(baseAvt1, 90, 330, 340, 340);
            
            const imageBuffer = canvas.toBuffer();
            writeFileSync(pathImg, imageBuffer);
            removeSync(pathAvt1);

            api.sendMessage({
                body: message,
                mentions: [{ tag: name, id: senderID }],
                attachment: createReadStream(pathImg)
            }, threadID, () => unlinkSync(pathImg));
        } catch (e) {
            api.sendMessage({ body: message, mentions: [{ tag: name, id: senderID }] }, threadID);
        }
    }

    await Currencies.setData(senderID, { exp });
}

module.exports.run = async function({ api, event, Threads }) {
    const { threadID, messageID } = event;
    let data = (await Threads.getData(threadID)).data;

    if (typeof data["rankup"] == "undefined" || data["rankup"] == false) data["rankup"] = true;
    else data["rankup"] = false;

    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);
    return api.sendMessage(`Rankup notification is now ${(data["rankup"] == true) ? "ON" : "OFF"}`, threadID, messageID);
}
