module.exports.config = {
    name: "adminUpdate",
    eventType: ["log:thread-admins", "log:thread-name", "log:user-nickname", "log:thread-icon", "log:thread-color"],
    version: "1.0.3",
    credits: "SHAAN KHAN",
    description: "Update team information quickly",
    envConfig: {
        sendNoti: true,
    }
};

module.exports.handleEvent = async function ({ event, api, Threads, Users }) {
    const fs = require("fs-extra");
    var iconPath = __dirname + "/emoji.json";
    if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, JSON.stringify({}));
    
    const { threadID, logMessageType, logMessageData } = event;
    const { setData, getData } = Threads;

    try {
        // Database se current thread ki info nikalna
        let threadInfo = await api.getThreadInfo(threadID);
        let dataThread = (await getData(threadID)).threadInfo || {};

        switch (logMessageType) {
            case "log:thread-admins": {
                const name = await Users.getNameUser(logMessageData.TARGET_ID);
                if (logMessageData.ADMIN_EVENT == "add_admin") {
                    if (!dataThread.adminIDs) dataThread.adminIDs = [];
                    dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
                    if (global.configModule[this.config.name].sendNoti) {
                        api.sendMessage(`»» NOTICE ««\nUpdate user: ${name}\nMil Gya Admin Tujhe Ja Khus Hoja 😸`, threadID);
                    }
                }
                else if (logMessageData.ADMIN_EVENT == "remove_admin") {
                    if (dataThread.adminIDs) {
                        dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id != logMessageData.TARGET_ID);
                    }
                    if (global.configModule[this.config.name].sendNoti) {
                        api.sendMessage(`»» NOTICE ««\nUpdate user: ${name}\nHa Bhai Agaya Swad Tu Admin Rehne Ke Layak Ni Tha 😹`, threadID);
                    }
                }
                break;
            }

            case "log:thread-icon": {
                let preIcon = JSON.parse(fs.readFileSync(iconPath));
                dataThread.threadIcon = logMessageData.thread_icon || "👍";
                if (global.configModule[this.config.name].sendNoti) {
                    api.sendMessage(`» [ GROUP UPDATE ]\n» Icon changed to: ${dataThread.threadIcon}\n» Original icon: ${preIcon[threadID] || "unknown"}`, threadID);
                }
                preIcon[threadID] = dataThread.threadIcon;
                fs.writeFileSync(iconPath, JSON.stringify(preIcon));
                break;
            }

            case "log:thread-color": {
                dataThread.threadColor = logMessageData.thread_color || "🌤";
                if (global.configModule[this.config.name].sendNoti) {
                    api.sendMessage(`» [ GROUP UPDATE ]\n» ${event.logMessageBody.replace("Theme", "color")}`, threadID);
                }
                break;
            }

            case "log:user-nickname": {
                if (!dataThread.nicknames) dataThread.nicknames = {};
                dataThread.nicknames[logMessageData.participant_id] = logMessageData.nickname;
                if (global.configModule[this.config.name].sendNoti) {
                    api.sendMessage(`»» NOTICE ««\nUpdate user nickname: ${(logMessageData.nickname.length == 0) ? "original name" : logMessageData.nickname}`, threadID);
                }
                break;
            }

            case "log:thread-name": {
                dataThread.threadName = logMessageData.name || "No name";
                if (global.configModule[this.config.name].sendNoti) {
                    api.sendMessage(`»» NOTICE «« Update the group name to: ${dataThread.threadName}`, threadID);
                }
                break;
            }
        }
        
        // Final Database Update
        await setData(threadID, { threadInfo: dataThread });
        
    } catch (e) { 
        console.log("AdminUpdate Error: " + e);
    }
};
