const fs = require('fs-extra');
const path = require('path');

if (!global.activeConvos) {
    global.activeConvos = new Map();
}

module.exports = {
    config: {
        name: "convo",
        aliases: ["war", "rdx"],
        description: "Premium Convo with Fixed Shaan-Khan-K Folder",
        credits: "Shaan Khan",
        usage: "convo on / convo off",
        category: "Tools",
        prefix: true
    },

    async run({ api, event, send, client, config }) {
        const { threadID, senderID, body } = event;
        const args = body.split(/\s+/);
        const action = args[1]?.toLowerCase();

        const isAdmin = config.ADMINBOT?.includes(senderID);
        if (!isAdmin) {
            try {
                const info = await api.getThreadInfo(threadID);
                if (!info.adminIDs.some(a => a.id === senderID)) {
                    return send.reply("❌ 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝: Ye command sirf Admin use kar sakte hain.");
                }
            } catch (e) {
                return send.reply("❌ Error checking permissions.");
            }
        }

        if (action === "off") {
            const activeList = [];
            global.activeConvos.forEach((val, key) => {
                activeList.push({ targetTID: key, ...val });
            });

            if (activeList.length === 0) return send.reply("❌ Koi convo active nahi hai.");

            let listMsg = "🛑 **ACTIVE CONVOS** 🛑\n\n";
            activeList.forEach((item, index) => {
                listMsg += `${index + 1}. Group: ${item.targetName}\nTID: ${item.targetTID}\n\n`;
            });
            listMsg += "👉 Number reply karein stop karne ke liye.";

            const infoOff = await send.reply(listMsg);
            client.replies.set(infoOff.messageID, { commandName: "convo", author: senderID, data: { step: "OFF_LIST", activeList } });
            return;
        }

        if (action === "on") {
            const msg = "🚀 **CONVO MODE ON** 🚀\n\nStep 1: **Haters Name** likhein ya 'skip' likhein.";
            const info = await send.reply(msg);
            client.replies.set(info.messageID, { commandName: "convo", author: senderID, data: { step: 1, convoData: {} } });
            return;
        }

        return send.reply(`💡 Usage: ${config.PREFIX}convo on | off`);
    },

    async handleReply({ api, event, send, client, data, config, Users }) {
        const { body, senderID, threadID } = event;
        if (data.author && senderID !== data.author) return;

        let { step, convoData = {} } = data;

        if (step === "OFF_LIST") {
            const index = parseInt(body) - 1;
            const item = data.activeList[index];
            if (item) {
                if (item.timeout) clearTimeout(item.timeout);
                global.activeConvos.delete(item.targetTID);
                return send.reply(`✅ Stopped: ${item.targetName}`);
            }
        }

        switch (step) {
            case 1: // Haters Name
                convoData.hatersName = body.toLowerCase() === "skip" ? "" : body;
                const infoTid = await send.reply("🆔 **TARGET TID**\n\nJis Group ID par messages bhejne hain wo likhein.");
                client.replies.set(infoTid.messageID, { commandName: "convo", author: senderID, data: { step: 3, convoData } });
                break;

            case 3: // TID Input
                convoData.targetTID = body.trim();
                const infoSpeed = await send.reply("⏱️ **SPEED (Seconds)**\n\nKam se kam 10 likhein.");
                client.replies.set(infoSpeed.messageID, { commandName: "convo", author: senderID, data: { step: 4, convoData } });
                break;

            case 4: // Speed Input
                const speed = parseInt(body);
                if (isNaN(speed) || speed < 1) return send.reply("❌ Sahi number likhein.");
                convoData.speed = speed;
                const infoConfirm = await send.reply(`✅ **READY!**\n\nFolder: Shaan-Khan-K\nFile: WAR_LINES.txt\nTID: ${convoData.targetTID}\n\nType **"confirm"** to start!`);
                client.replies.set(infoConfirm.messageID, { commandName: "convo", author: senderID, data: { step: 8, convoData } });
                break;

            case 8: // Final Start
                if (body.toLowerCase() === "confirm") {
                    send.reply("🚀 Convo Start ho gayi hai!");
                    this.startConvolution(api, convoData, threadID, Users);
                }
                break;
        }
    },

    async startConvolution(api, data, originThreadID, Users) {
        const { targetTID, speed, hatersName } = data;
        const folderPath = path.join(__dirname, "Shaan-Khan-K");
        const filePath = path.join(folderPath, "WAR_LINES.txt");

        if (!fs.existsSync(filePath)) {
            return api.sendMessage(`❌ Error: Folder 'Shaan-Khan-K' ya file 'WAR_LINES.txt' nahi mili!`, originThreadID);
        }

        const messages = fs.readFileSync(filePath, "utf-8").split("\n").filter(line => line.trim() !== "");
        let targetName = "Group";
        try {
            const info = await api.getThreadInfo(targetTID);
            targetName = info.threadName || "Unnamed";
        } catch(e) {}

        let index = 0;
        const execute = async () => {
            if (!global.activeConvos.has(targetTID)) return;
            if (index >= messages.length) index = 0; // Loop messages

            const msgBody = hatersName ? `${hatersName} ${messages[index]}` : messages[index];
            api.sendMessage(msgBody, targetTID);

            index++;
            const timeout = setTimeout(execute, speed * 1000);
            global.activeConvos.set(targetTID, { timeout, originThreadID, targetName });
        };

        global.activeConvos.set(targetTID, { originThreadID, targetName });
        execute();
    }
};
