module.exports.config = {
        name: "off",
        version: "1.0.0",
        hasPermssion: 2,
        credits: "Shaan Khan",
        description: "turn the bot off and stop node workflow",
        commandCategory: "system",
        cooldowns: 0
        };

module.exports.run = async ({event, api}) => {
    const permission = ["100016828397863"];
    if (!permission.includes(event.senderID)) return api.sendMessage("[ ERR ] You don't have permission to use this command, This Command Only For only Shaan", event.threadID, event.messageID);
    
    await api.sendMessage(`[ OK ] ${global.config.BOTNAME} Bot and Node.js workflow are now turned off completely.`, event.threadID, async () => {
        try {
            // Agar aap PM2 use kar rahe hain workflow/process ke liye toh yeh usay bhi stop kar dega
            if (typeof process.send === 'function') {
                process.send('shutdown');
            }
        } catch (e) {
            console.error(e);
        }
        // Node.js process aur workflow execution ko rokne ke liye
        process.exit(0);
    });
}
