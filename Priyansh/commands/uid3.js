module.exports.config = {
    name: "uid3",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "SHAAN-KHAN", // DO NOT CHANGE
    description: "Send FB Contact Card Style",
    commandCategory: "Tools",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {

    // 🔒 Credit Lock Protection
    if (module.exports.config.credits !== "SHAAN-KHAN") {
        return api.sendMessage(
            "⚠ SECURITY ALERT ⚠\n❌ Unauthorized modification detected!\nCredits change is not allowed.",
            event.threadID,
            event.messageID
        );
    }

    let uid, name;

    if (Object.keys(event.mentions).length === 0) {  
        uid = event.senderID;  
        name = "You";  
    } else {  
        uid = Object.keys(event.mentions)[0];  
        name = event.mentions[uid].replace("@", "");  
    }  

    const fbProfile = `https://www.facebook.com/profile.php?id=${uid}`;  

    const msg = 
`╭━━━━━━━━━━━━╮
│ ✨ Name: ${name}
│ 🆔 UID: ${uid}
│━━━━━━━━━━━━━
│ 🌐 Facebook Profile:
│ ${fbProfile}
╰━━━━━━━━━━━━━╯`;

    return api.sendMessage(msg, event.threadID, event.messageID);
};