1111const fs = require('fs');

// ================= MODULE CONFIG =================
module.exports.config = {
  name: "autoconvo",
  version: "2.4.0",
  hasPermission: 2,
  credits: "Shaan", // Credits updated as requested
  description: "Gaali dene par bot auto-war start karega",
  commandCategory: "Prashasanik",
  usePrefix: false,
  usages: "Auto-trigger on specific keywords",
  cooldowns: 5,
};

// ================= GLOBAL STATE =================
let warStatus = {}; 

const offensiveKeywords = [
  "tmkc","behenchod","madarchod","bhenchod", "lode","chudai","bhosda","chut",
  "bahanchod","jhantu","boxdi","tera jija","laude","bc","mc","hijda","hijde",
  "chhakka","chakka","6kka","madharchod","bahenchod"
].map(k => new RegExp(`\\b${k}\\b`, 'i'));

// ================= FILE HANDLER =================
function getGaliyan() {
  try {
    const data = fs.readFileSync('FYT_GROUP.txt', 'utf8');
    return data.split('\n').filter(g => g.trim() !== '');
  } catch (e) {
    return ["Gaali file 'FYT_GROUP.txt' missing hai!"];
  }
}

// ================= EVENT HANDLER =================
module.exports.handleEvent = async function({ api, event, Users }) {
  const { threadID, senderID, messageID, body } = event;
  if (!body || senderID === api.getCurrentUserID()) return;

  const lowerBody = body.toLowerCase().trim();
  const containsAbuse = offensiveKeywords.some(r => r.test(body));
  const mentionsBot = /\b(bot|shaan|pika)\b/i.test(body);

  // 1. STOP LOGIC (Agar banda sorry bole)
  if (warStatus[threadID] && warStatus[threadID].target === senderID) {
    const stopPhrases = ["sorry shaan", "shaan sorry", "sorry bot", "sorry"];
    
    if (stopPhrases.includes(lowerBody)) {
      clearInterval(warStatus[threadID].interval);
      delete warStatus[threadID];
      return api.sendMessage("Theek hai, ab dubara mat bolna! 😏", threadID, messageID);
    }
  }

  // 2. TRIGGER LOGIC (War start)
  if (containsAbuse && mentionsBot && !warStatus[threadID]) {
    const name = await Users.getNameUser(senderID);
    
    api.sendMessage(`Oye @${name} 😈 Tune panga le liya!\nAb "sorry shaan" bol ke hi bachoge.`, threadID, (err, info) => {
      
      const interval = setInterval(async () => {
        const lines = getGaliyan();
        const randomGali = lines[Math.floor(Math.random() * lines.length)];
        
        api.sendMessage({
          body: `@${name} ${randomGali}`,
          mentions: [{ tag: name, id: senderID }]
        }, threadID);
      }, 4000); // Har 4 second mein reply

      warStatus[threadID] = {
        target: senderID,
        interval: interval
      };
    }, messageID);
  }
};

// ================= COMMAND CONTROL =================
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  // Manual Stop Command: !autoconvo off
  if (args[0] === "off") {
    if (warStatus[threadID]) {
      clearInterval(warStatus[threadID].interval);
      delete warStatus[threadID];
      return api.sendMessage("War mode forcibly turned off. ✅", threadID, messageID);
    } else {
      return api.sendMessage("Koi active war nahi mil rahi.", threadID, messageID);
    }
  }

  return api.sendMessage("Auto-convo system active hai. Kisi ne gaali di to bot khud handle karega.", threadID, messageID);
};
