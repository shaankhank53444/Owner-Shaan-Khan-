module.exports.config = {
    name: "uid",
    version: "1.4.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Get UID with manual mention fix for FCA",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, type, messageReply } = event;

    // 1. Reply Method (Hamesha working)
    if (type == "message_reply") {
        let id = messageReply.senderID;
        const info = await api.getUserInfo(id);
        return api.sendMessage(`${info[id].name}: ${id}`, threadID, messageID);
    }

    // 2. Agar koi text likha hai (@name ya normal name)
    if (args.length > 0) {
        const nameSearch = args.join(" ").replace("@", "").toLowerCase();
        
        try {
            // Thread ki puri details nikalna
            const threadInfo = await api.getThreadInfo(threadID);
            const { participantIDs } = threadInfo;
            
            // Sab participants ke naam check karna
            const allUsers = await api.getUserInfo(participantIDs);
            
            for (let id in allUsers) {
                if (allUsers[id].name.toLowerCase().includes(nameSearch)) {
                    return api.sendMessage(`${allUsers[id].name}: ${id}`, threadID, messageID);
                }
            }
        } catch (err) {
            // Agar getThreadInfo fail ho toh purana method
            if (Object.keys(event.mentions).length > 0) {
                let msg = "";
                for (let id in event.mentions) {
                    msg += `${event.mentions[id].replace("@", "")}: ${id}\n`;
                }
                return api.sendMessage(msg.trim(), threadID, messageID);
            }
        }
        
        return api.sendMessage("❌ User nahi mila! Ya toh reply karein ya sahi naam likhein.", threadID, messageID);
    }

    // 3. Default: Apni ID
    const myInfo = await api.getUserInfo(senderID);
    return api.sendMessage(`${myInfo[senderID].name}: ${senderID}`, threadID, messageID);
};
