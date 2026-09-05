const axios = require("axios"); 
let isSimOn = true; 

module.exports.config = { 
    name: "sim", 
    version: "1.0.1", 
    hasPermission: 0, 
    credits: "SHAAN-KHAN", 
    description: "Simi AI with silent mode", 
    commandCategory: "fun", 
    usages: "sim <text> | sim add <question>|<answer> | sim on/off", 
    cooldowns: 2, 
}; 

module.exports.handleEvent = async function ({ api, event }) { 
    const { threadID, messageID, body } = event; 
    if (isSimOn && body && !body.toLowerCase().startsWith("sim")) { 
        await processQuery(api, event, body, false); 
    } 
}; 

module.exports.run = async function ({ api, event, args }) { 
    const { threadID, messageID } = event; 
    if (!args[0]) { 
        return api.sendMessage( 
            "❗ Istemaal:\nsim on/off\nsim add sawal|jawab\nsim <sawal>", 
            threadID, 
            messageID 
        ); 
    } 
    const cmd = args[0].toLowerCase(); 

    if (cmd === "on") { 
        isSimOn = true; 
        return api.sendMessage( 
            "🤖 SIM Mode ON - Main sirf tab jawab dungi jab mujhe jawab pata ho.", 
            threadID, 
            messageID 
        ); 
    } 

    if (cmd === "off") { 
        isSimOn = false; 
        return api.sendMessage( 
            "🔴 SIM Mode OFF - Ab sirf 'sim' command ke sath kaam karega.", 
            threadID, 
            messageID 
        ); 
    } 

    if (cmd === "add") { 
        const [question, answer] = args 
            .slice(1) 
            .join(" ") 
            .split("|") 
            .map(s => s.trim()); 
        if (!question || !answer) { 
            return api.sendMessage( 
                "❌ Format:\nsim add sawal|jawab", 
                threadID, 
                messageID 
            ); 
        } 
        try { 
            await axios.get( 
                `https://simi-ddlh.onrender.com/add?ask=${encodeURIComponent(question)}&answer=${encodeURIComponent(answer)}` 
            ); 
            return api.sendMessage( 
                `✅ Naya jawab save ho gaya:\n\nSawal: ${question}\nJawab: ${answer}`, 
                threadID, 
                messageID 
            ); 
        } catch (e) { 
            console.error("SIM Add Error:", e); 
            return api.sendMessage("❌ API mein masla aa gaya. Dobara koshish karein.", threadID, messageID); 
        } 
    } 

    await processQuery(api, event, args.join(" "), true); 
}; 

async function processQuery(api, event, query, isExplicitCall) { 
    const { threadID, messageID } = event; 
    try { 
        const words = query 
            .toLowerCase() 
            .split(/\s+/) 
            .filter(Boolean); 

        for (const word of words) { 
            const res = await axios.get( 
                `https://simi-ddlh.onrender.com/simi?ask=${encodeURIComponent(word)}` 
            ); 
            if (res.data?.answer && !isDefaultResponse(res.data.answer)) { 
                return api.sendMessage(res.data.answer, threadID, messageID); 
            } 
        } 

        if (isExplicitCall) { 
            const fullRes = await axios.get( 
                `https://simi-ddlh.onrender.com/simi?ask=${encodeURIComponent(query)}` 
            ); 
            if (fullRes.data?.answer && !isDefaultResponse(fullRes.data.answer)) { 
                return api.sendMessage(fullRes.data.answer, threadID, messageID); 
            } 
            if (!isSimOn) { 
                return api.sendMessage("Maaf karna dost, mujhe iska jawab nahi aata 😅", threadID, messageID); 
            } 
        } 
        return; 
    } catch (e) { 
        console.error("SIM Error:", e); 
        if (isExplicitCall && !isSimOn) { 
            return api.sendMessage("⚠️ System mein masla aa gaya.", threadID, messageID); 
        } 
    } 
} 

function isDefaultResponse(answer) { 
    if (!answer) return true; 
    const text = answer.toLowerCase(); 
    return ( 
        text.includes("don't know") || 
        text.includes("dont know") || 
        text.includes("mujhe nahi pata") || 
        text.includes("maaf kar") 
    ); 
}
