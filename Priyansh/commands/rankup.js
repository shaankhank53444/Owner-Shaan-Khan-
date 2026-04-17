module.exports.config = {
    name: "rankup",
    version: "7.6.8",
    hasPermssion: 1,
    credits: "Shaan Khan",
    description: "Announce rankup with image and bonus coins",
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
    const { createReadStream, existsSync, mkdirSync, writeFileSync, removeSync, unlinkSync } = global.nodemodule["fs-extra"];
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

    const curLevel = Math.floor((Math.sqrt(1 + (4 * exp / 3) + 1) / 2));
    const level = Math.floor((Math.sqrt(1 + (4 * (exp + 1) / 3) + 1) / 2));

    if (level > curLevel && level != 1) {
        const name = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
        
        // Add 200 Coins Bonus
        await Currencies.increaseMoney(senderID, 200);

        let message = getText("levelup", name, level);

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
            }, event.threadID, () => unlinkSync(pathImg));
        } catch (e) {
            api.sendMessage(message, event.threadID);
        }
    }

    await Currencies.setData(senderID, { exp });
}

module.exports.languages = {
    "vi": {
        "off": "𝗧𝗮̆́𝘁",
        "on": "𝗕𝗮̣̂𝘁",
        "successText": "thành công thông báo rankup!",
        "levelup": "🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n👤 𝗡𝗮𝗺𝗲: {0}\n🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: {1}\n💰 𝗕𝗼𝗻𝘂𝘀: +200 Coins\n━━━━━━━━━━━━━━━\n👑 𝗢𝘄𝗻𝗲𝗿: 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻"
    },
    "en": {
        "on": "on",
        "off": "off",
        "successText": "success notification rankup!",
        "levelup": "🎊 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣 🎊\n━━━━━━━━━━━━━━━\n👤 𝗡𝗮𝗺𝗲: {0}\n🆙 𝗡𝗲𝘄 𝗟𝗲𝘃𝗲𝗹: {1}\n💰 𝗕𝗼𝗻𝘂𝘀: +200 Coins\n━━━━━━━━━━━━━━━\n👑 𝗢𝘄𝗻𝗲𝗿: 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻\n\n𝑴𝒂𝒌𝒂 𝒍𝒂𝒅𝒍𝒆 𝒆𝒌 𝒐𝒖𝒓 𝒍𝒆𝒗𝒆𝒍 𝒖𝒑 𝒉𝒖𝒂 𝒕𝒆𝒓𝒂 𝒌𝒊𝒕𝒏𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆 𝒌𝒂𝒓 𝒕𝒉𝒂 𝒉𝒂𝒊 𝒕𝒖"
    }
}

module.exports.run = async function({ api, event, Threads, getText }) {
    const { threadID, messageID } = event;
    let data = (await Threads.getData(threadID)).data;

    if (typeof data["rankup"] == "undefined" || data["rankup"] == false) data["rankup"] = true;
    else data["rankup"] = false;

    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);
    return api.sendMessage(`${(data["rankup"] == true) ? getText("on") : getText("off")} ${getText("successText")}`, threadID, messageID);
}
