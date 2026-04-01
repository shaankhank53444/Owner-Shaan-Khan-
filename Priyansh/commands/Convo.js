const fs = require('fs-extra');
const path = require('path');

// Global map for tracking active convos
if (!global.activeConvos) {
    global.activeConvos = new Map();
}

module.exports.config = {
    name: "convo",
    version: "2.0.0",
    hasPermssion: 0, // 0 = Everyone, 1 = Admin, 2 = Bot Admin
    credits: "Shaan Khan",
    description: "Premium Convo Mode for Shaan-Khan-K",
    commandCategory: "Tools",
    usages: "convo on | off",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, client }) {
    const { threadID, senderID, messageID } = event;
    const action = args[0]?.toLowerCase();

    // Permission Check (Group Admin or Bot Admin)
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(item => item.id == senderID);
    const isBotAdmin = global.config.ADMINBOT.includes(senderID);

    if (!isAdmin && !isBotAdmin) {
        return api.sendMessage("❌ 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝: Sirf Admins ye use kar sakte hain.", threadID, messageID);
    }

    if (action === "off") {
        const activeList = [];
        global.activeConvos.forEach((val, key) => {
            activeList.push({ targetTID: key, ...val });
        });

        if (activeList.length === 0) return api.sendMessage("❌ Koi convo active nahi hai.", threadID);

        let listMsg = "🛑 **ACTIVE CONVOS** 🛑\n\n";
        activeList.forEach((item, index) => {
            listMsg += `${index + 1}. Group: ${item.targetName}\nTID: ${item.targetTID}\n\n`;
        });
        listMsg += "👉 Number reply karein stop karne ke liye.";

        return api.sendMessage(listMsg, threadID, (err, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                step: "OFF_LIST",
                activeList
            });
        }, messageID);
    }

    if (action === "on") {
        const msg = "🚀 **CONVO MODE ON** 🚀\n\nStep 1: **Haters Name** likhein ya 'skip' likhein.";
        return api.sendMessage(msg, threadID, (err, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                step: 1,
                convoData: {}
            });
        }, messageID);
    }

    return api.sendMessage(`💡 Usage: ${global.config.PREFIX}convo on | off`, threadID, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply, Users }) {
    const { body, senderID, threadID, messageID } = event;
    if (handleReply.author != senderID) return;

    let { step, convoData = {} } = handleReply;

    if (step === "OFF_LIST") {
        const index = parseInt(body) - 1;
        const item = handleReply.activeList[index];
        if (item) {
            if (item.timeout) clearTimeout(item.timeout);
            global.activeConvos.delete(item.targetTID);
            return api.sendMessage(`✅ Stopped convo in: ${item.targetName}`, threadID, messageID);
        }
    }

    switch (step) {
        case 1:
            convoData.hatersName = body.toLowerCase() === "skip" ? "" : body;
            api.sendMessage("🆔 **TARGET TID**\n\nTarget Group/User ID likhein.", threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    step: 3,
                    convoData
                });
            }, messageID);
            break;

        case 3:
            convoData.targetTID = body.trim();
            api.sendMessage("⏱️ **SPEED (Seconds)**\n\nGap likhein (e.g., 2)", threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    step: 4,
                    convoData
                });
            }, messageID);
            break;

        case 4:
            const speed = parseInt(body);
            if (isNaN(speed) || speed < 1) return api.sendMessage("❌ Sahi number likhein.", threadID, messageID);
            convoData.speed = speed;
            api.sendMessage(`✅ **READY!**\n\nFolder: Shaan-Khan-K\nFile: WAR_LINES.txt\n\nType **"confirm"** to start!`, threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    step: "CONFIRM",
                    convoData
                });
            }, messageID);
            break;

        case "CONFIRM":
            if (body.toLowerCase() === "confirm") {
                api.sendMessage("🚀 Convo Start ho gayi hai!", threadID);
                startConvolution(api, convoData, threadID);
            }
            break;
    }
};

async function startConvolution(api, data, originThreadID) {
    const { targetTID, speed, hatersName } = data;
    const filePath = path.join(__dirname, "Shaan-Khan-K", "WAR_LINES.txt");

    if (!fs.existsSync(filePath)) {
        return api.sendMessage(`❌ Error: Folder 'Shaan-Khan-K' ya 'WAR_LINES.txt' nahi mili!`, originThreadID);
    }

    const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(line => line.trim() !== "");
    if (lines.length === 0) return api.sendMessage("❌ File khali hai!", originThreadID);

    let targetName = "Target Group";
    try {
        const info = await api.getThreadInfo(targetTID);
        targetName = info.threadName || targetTID;
    } catch(e) { targetName = targetTID; }

    let index = 0;
    const execute = async () => {
        if (!global.activeConvos.has(targetTID)) return;
        
        const msgBody = hatersName ? `${hatersName} ${lines[index]}` : lines[index];
        api.sendMessage(msgBody, targetTID);

        index = (index + 1) % lines.length;
        const timeout = setTimeout(execute, speed * 1000);
        global.activeConvos.get(targetTID).timeout = timeout;
    };

    global.activeConvos.set(targetTID, { originThreadID, targetName });
    execute();
}
