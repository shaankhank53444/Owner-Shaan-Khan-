module.exports.config = {
    name: "editcmd",
    version: "1.0.1",
    hasPermssion: 2, // Sirf Admin ke liye
    credits: "Shaan",
    description: "Bot ke andar se kisi bhi command file ko edit karein",
    commandCategory: "Admin",
    usages: "[command name]",
    cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const fs = require("fs-extra");
    const path = require("path");
    const { threadID, messageID, senderID, body } = event;

    // Check agar reply dene wala wahi admin hai jisne command start ki thi
    if (senderID != handleReply.author) return;

    const cmdPath = path.join(__dirname, `${handleReply.cmdName}.js`);

    try {
        // Naya code file mein save karna
        fs.writeFileSync(cmdPath, body, "utf-8");

        // Cache clear karna taake naye changes load ho sakein
        delete require.cache[require.resolve(cmdPath)];
        const updatedCommand = require(cmdPath);

        // Global client commands mein update karna
        if (global.client.commands.has(handleReply.cmdName)) {
            global.client.commands.delete(handleReply.cmdName);
            global.client.commands.set(handleReply.cmdName, updatedCommand);
        }

        return api.sendMessage(
            `━━━━━━━━━━━━━━━━━━\n✅ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗨𝗣𝗗𝗔𝗧𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n\n📌 Command: ${handleReply.cmdName}\n✨ Status: Success\n💡 Note: Changes instantly apply ho chuke hain.`,
            threadID,
            messageID
        );
    } catch (error) {
        return api.sendMessage(
            `❌ Error while updating:\n${error.message}`,
            threadID,
            messageID
        );
    }
};

module.exports.run = async function({ api, event, args }) {
    const fs = require("fs-extra");
    const path = require("path");
    const { threadID, messageID, senderID } = event;

    if (!args[0]) {
        return api.sendMessage(
            `⚠️ Please specify a command name!\nExample: editcmd help`,
            threadID,
            messageID
        );
    }

    const cmdName = args[0].toLowerCase();
    const cmdPath = path.join(__dirname, `${cmdName}.js`);

    // Check file exist karti hai ya nahi
    if (!fs.existsSync(cmdPath)) {
        return api.sendMessage(
            `⚠️ Command "${cmdName}" nahi mili!`,
            threadID,
            messageID
        );
    }

    try {
        const currentCode = fs.readFileSync(cmdPath, "utf-8");

        return api.sendMessage(
            `📝 Editing: ${cmdName}.js\n\n━━━━━━━━━━━━━━━━━━\n niche diye gaye code ko copy karein, edit karein aur is message par REPLY karein.\n━━━━━━━━━━━━━━━━━━\n\n${currentCode}`,
            threadID,
            (err, info) => {
                if (err) return console.log(err);
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    cmdName: cmdName
                });
            },
            messageID
        );
    } catch (e) {
        return api.sendMessage(`❌ Error reading file: ${e.message}`, threadID, messageID);
    }
};
