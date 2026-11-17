const axios = require('axios');

module.exports.config = {
    name: "play",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "SHAAN Khan",
    commandCategory: "Media",
    usages: "[song name]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const songName = args.join(" ");

    if (!songName) {
        return api.sendMessage("❌ Arrey bhai! Gaane ka naam toh likho. Example: /play Dilbar", threadID, messageID);
    }

    const apiKey = "RDX-API-FREE-191852893";
    const initialUrl = `https://rdx-apis-zone.vercel.app/api/download/playmusic?query=${encodeURIComponent(songName)}&apikey=${apiKey}`;

    try {
        const searchingMsg = await api.sendMessage(`🔍 Searching for **${songName}**... Please wait! 🎶`, threadID);

        // Step 1: Initial Request
        const response = await axios.get(initialUrl, { headers: { "accept": "application/json" } });
        const resData = response.data;

        if (!resData.success) {
            try { api.unsendMessage(searchingMsg.messageID); } catch (e) {}
            const errorMsg = resData.error || "Internal Server Error";
            const hintMsg = resData.hint || "Try different input or retry later.";
            return api.sendMessage(`❌ **Error:** ${errorMsg}\n💡 **Hint:** ${hintMsg}\n\n👑 **SHAAN Khan Bot**`, threadID, messageID);
        }

        const taskId = resData.data?.taskId;
        const statusUri = resData.status_url;

        if (!taskId || !statusUri) {
            try { api.unsendMessage(searchingMsg.messageID); } catch (e) {}
            return api.sendMessage("❌ API se valid task ID nahi mila bhai!", threadID, messageID);
        }

        const statusUrl = `https://rdx-apis-zone.vercel.app${statusUri}&apikey=${apiKey}`;

        // Step 2: Polling loop to check status
        let attempts = 0;
        let finalResult = null;

        while (attempts < 6) {
            await new Promise(resolve => setTimeout(resolve, 4000)); // 4 seconds delay
            try {
                const statusRes = await axios.get(statusUrl, { headers: { "accept": "application/json" } });
                const stData = statusRes.data;

                if (stData && stData.success) {
                    finalResult = stData.data || stData;
                    break;
                } else if (stData && stData.success === false) {
                    finalResult = { error: stData.error, hint: stData.hint };
                    break;
                }
            } catch (err) {
                // Ignore temporary network errors during polling
            }
            attempts++;
        }

        try { api.unsendMessage(searchingMsg.messageID); } catch (e) {}

        if (finalResult && finalResult.error) {
            return api.sendMessage(`❌ **Upstream Error:** ${finalResult.error}\n💡 ${finalResult.hint || ""}\n\n👑 **SHAAN Khan Bot**`, threadID, messageID);
        
