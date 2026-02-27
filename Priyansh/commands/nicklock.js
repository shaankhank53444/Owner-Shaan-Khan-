const fs = require('fs-extra');
const path = require('path');

const nicklockPath = path.join(__dirname, './cache/nicklock.json');

// Data Helper Functions
function getNicklockData() {
    try {
        if (!fs.existsSync(nicklockPath)) {
            fs.outputJsonSync(nicklockPath, { locks: {} });
        }
        return fs.readJsonSync(nicklockPath);
    } catch (e) {
        return { locks: {} };
    }
}

function saveNicklockData(data) {
    try {
        fs.writeJsonSync(nicklockPath, data, { spaces: 2 });
    } catch (err) {
        console.error('Nicklock Save Error:', err);
    }
}

module.exports = {
    config: {
        name: "nicklock",
        version: "1.5.0",
        hasPermssion: 1, // 1 = Admin only, 0 = Everyone
        credits: "SARDAR RDX",
        description: "User ka nickname lock karein taaki koi badal na sake.",
        commandCategory: "Group",
        usages: "[mention/reply/UID] [nickname] | off [mention]",
        cooldowns: 5
    },

    // Ye function har event (jaise nickname change) par trigger hoga
    handleEvent: async function ({ api, event }) {
        const { type, author, logMessageType, logMessageData, threadID } = event;
        
        // Check if it's a nickname change event
        if (logMessageType === "log:user-nickname") {
            const data = getNicklockData();
            const targetID = logMessageData.participant_id;
            const newNickname = logMessageData.nickname;
            const key = `${threadID}_${targetID}`;

            if (data.locks[key]) {
                const lockedNick = data.locks[key].nickname;
                if (newNickname !== lockedNick) {
                    return api.changeNickname(lockedNick, threadID, targetID, (err) => {
                        if (!err) console.log(`[NICKLOCK] Restored nick for ${targetID}`);
                    });
                }
            }
        }
    },

    run: async function ({ api, event, args, Users }) {
        const { threadID, senderID, mentions, messageReply, type } = event;
        const data = getNicklockData();

        // 1. List Option
        if (args[0] === "list") {
            const threadLocks = Object.entries(data.locks).filter(([key]) => key.startsWith(threadID));
            if (threadLocks.length === 0) return api.sendMessage("Is group mein koi nickname locked nahi hai.", threadID);

            let msg = "🔒 Locked Nicknames:\n";
            for (const [key, value] of threadLocks) {
                const uid = key.split('_')[1];
                const name = await Users.getNameUser(uid);
                msg += `\n👤 ${name}\n📌 Nick: ${value.nickname}\n`;
            }
            return api.sendMessage(msg, threadID);
        }

        // 2. Off / Unlock Option
        if (args[0] === "off" || args[0] === "unlock") {
            let targetID;
            if (type === "message_reply") targetID = messageReply.senderID;
            else if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
            else if (args[1] && !isNaN(args[1])) targetID = args[1];

            if (!targetID) return api.sendMessage("Kise unlock karna hai? Mention karein ya reply dein.", threadID);

            const key = `${threadID}_${targetID}`;
            if (!data.locks[key]) return api.sendMessage("Is user ka nickname locked nahi hai.", threadID);

            delete data.locks[key];
            saveNicklockData(data);
            return api.sendMessage("🔓 Nickname unlock kar diya gaya hai.", threadID);
        }

        // 3. Lock Process
        let targetID, nickname;

        if (type === "message_reply") {
            targetID = messageReply.senderID;
            nickname = args.join(" ");
        } else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            nickname = args.join(" ").replace(mentions[targetID], "").trim();
        } else if (args[0] && !isNaN(args[0])) {
            targetID = args[0];
            nickname = args.slice(1).join(" ");
        }

        if (!targetID || !nickname) {
            return api.sendMessage(`⚠️ Galat format!\nUsage: ${this.config.usages}`, threadID);
        }

        try {
            await api.changeNickname(nickname, threadID, targetID);
            const key = `${threadID}_${targetID}`;
            data.locks[key] = {
                nickname: nickname,
                author: senderID,
                time: Date.now()
            };
            saveNicklockData(data);
            
            const name = await Users.getNameUser(targetID);
            return api.sendMessage(`🔒 Locked!\n👤 User: ${name}\n📝 Nickname: ${nickname}\n\nAb ye nickname koi change nahi kar payega.`, threadID);
        } catch (e) {
            return api.sendMessage("Error: Bot ke paas admin permission honi chahiye nickname badalne ke liye.", threadID);
        }
    }
};
