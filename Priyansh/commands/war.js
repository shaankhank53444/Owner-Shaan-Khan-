const fs = require("fs");
const path = require("path");

/* ================= CREATOR LOCK ================= */
const CREATOR_LOCK = (() => {
  const encoded = "U2hhYW4gS2hhbg=="; 
  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
  name: "war",
  version: "2.1.0",
  hasPermssion: 2,
  credits: "Shaan Khan",
  description: "Fixed File System War Module",
  commandCategory: "Admin",
  usages: "war on [UID] / war off",
  cooldowns: 2,
};

// Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits belong to Shaan Khan.");
  module.exports.run = () => {};
  module.exports.handleEvent = () => {};
  return;
}

/* =======================
   📁 DATABASE SYSTEM (Fixed)
======================= */
// Folder path fix: "Shaan-Khan-K" folder script ke sath hi banega
const DATA_DIR = path.join(__dirname, "Shaan-Khan-K");
const DATA_FILE = path.join(DATA_DIR, "WAR_LINES.txt");

// Folder aur File check
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default lines agar file missing ho (Aap yahan apni lines add kar sakte hain)
const defaultContent = "Suno\nKahan ho?\nBaat suno\nReply do";

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, defaultContent, "utf8");
}

/* =======================
   ⚔️ WAR STATE
======================= */
if (!global.shaanWarState) {
  global.shaanWarState = new Map();
}

/* =======================
   📩 HANDLE EVENT
======================= */
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, isGroup, body } = event;

  // Agar group nahi hai, ya war active nahi hai, ya message khali hai toh return
  if (!isGroup || !global.shaanWarState.has(threadID) || !body) return;

  const config = global.shaanWarState.get(threadID);
  
  // Check if sender is the target
  if (config.active && senderID == config.targetUID) {
    try {
      // File se fresh data read karna taake live update ho sake
      const fileData = fs.readFileSync(DATA_FILE, "utf8");
      const lines = fileData.split("\n").filter(line => line.trim() !== "");
      
      if (lines.length === 0) return;

      const randomLine = lines[Math.floor(Math.random() * lines.length)];

      let name = "";
      try {
        const info = await api.getUserInfo(senderID);
        name = info[senderID].firstName || info[senderID].name.split(" ")[0];
      } catch (e) { 
        name = "User"; 
      }

      // Ek message par ek reply
      api.sendMessage(`${name}, ${randomLine}`, threadID);
    } catch (err) {
      console.error("War Module Error:", err);
    }
  }
};

/* =======================
   🧠 COMMAND
======================= */
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;
  const adminID = "100016828397863"; // Shaan Khan UID

  if (senderID !== adminID) {
    return api.sendMessage("❌ Sirf Shaan Khan hi ye command chala sakta hai!", threadID, messageID);
  }

  if (args[0] === "on") {
    let target = null;

    if (type === "message_reply") {
      target = messageReply.senderID;
    } else if (args[1]) {
      target = args[1];
    }

    if (!target) {
      return api.sendMessage("⚠️ Target ka UID dein ya kisi ke message par reply karke 'war on' likhein!", threadID, messageID);
    }

    global.shaanWarState.set(threadID, { active: true, targetUID: target });
    return api.sendMessage(`✅ WAR STARTED\n🎯 Target UID: ${target}\n📂 File: WAR_LINES.txt se attack shuru!`, threadID, messageID);
  }

  if (args[0] === "off") {
    if (global.shaanWarState.has(threadID)) {
      global.shaanWarState.delete(threadID);
      return api.sendMessage("✅ WAR STOPPED. Target ko bakhsh diya gaya.", threadID, messageID);
    } else {
      return api.sendMessage("⚠️ Is group mein koi war active nahi hai.", threadID, messageID);
    }
  }

  return api.sendMessage("💡 Usage:\n• war on [UID/Reply]\n• war off", threadID, messageID);
};
