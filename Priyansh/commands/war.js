const fs = require("fs");
const path = require("path");

/* ================= CREATOR LOCK ================= */
const CREATOR_LOCK = (() => {
  const encoded = "U2hhYW4gS2hhbg=="; 
  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
  name: "war",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "Shaan Khan",
  description: "Advanced Auto-Fill War Module by Shaan Khan",
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
   📁 DATABASE SYSTEM
======================= */
const DATA_DIR = path.join(__dirname, "SHAAN-KHAN-K");
const DATA_FILE = path.join(DATA_DIR, "WAR_LINES.txt");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Agar file khali hai toh aapki di hui list se auto-fill karega
const initialLines = [
  "TER1 BEHEN K1 CHOOT TO K4L4P K4L4P KE LOWD4 CHUSE J44 RH1 H41",
  "TER1 BEHEN KE BOOR KO M41 CHEER J4UNG4",
  "R4ND1 KE 4UL44D TU KREG4 B44P SE F4D44",
  "TER1 BEHEN K1 CHOOT RO RO KE MERE LOWDE KO CHUSTE J44YEG1",
  "TER1 M44 K1 CHOOT KO M41 M4R M44R KE L1KHN4 S1KH4 DUNG4",
  "TER1 D444D11 K1 CHOOT ME M41 LED1 K44 TEL L4G4 KE M44RUNG4",
  "SUN4 H41 TER1 B44J1 CHOOT M41 DOODH D44LO TOU P4N1 N1K4LT4 H41",
  "TER1 M44 K1 CHOOT M41 M1RCH1 4UR TEL G4R4M K4RKE T4DK4 L4G4 DUNG4",
  "TER1 BEHEN K1 CHOOCHE KO 44J M41 D4B4 D4B4 KE B4DE KR DUNG4"
  // Aap baki saari lines yahan add kar sakte hain...
];

if (!fs.existsSync(DATA_FILE) || fs.readFileSync(DATA_FILE, "utf8").trim() === "") {
    fs.writeFileSync(DATA_FILE, initialLines.join("\n"), "utf8");
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
  const { threadID, senderID, isGroup } = event;
  
  if (!isGroup || !global.shaanWarState.has(threadID)) return;
  
  const config = global.shaanWarState.get(threadID);
  if (config.active && senderID === config.targetUID) {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf8").split("\n").filter(Boolean);
      const randomLine = data[Math.floor(Math.random() * data.length)];
      
      let name = "";
      try {
        const info = await api.getUserInfo(senderID);
        name = info[senderID].name;
      } catch (e) { name = "Oye"; }

      api.sendMessage(`${name}, ${randomLine}`, threadID);
    } catch (err) {
      console.log(err);
    }
  }
};

/* =======================
   🧠 COMMAND
======================= */
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminID = "100016828397863"; // Shaan Khan UID

  if (senderID !== adminID) {
    return api.sendMessage("❌ Sirf Admin (Shaan Khan) hi WAR shuru kar sakta hai!", threadID, messageID);
  }

  if (args[0] === "on") {
    const target = args[1] || (event.type === "message_reply" ? event.messageReply.senderID : null);
    
    if (!target) return api.sendMessage("⚠️ Target ka UID dein ya message reply karein!", threadID, messageID);

    global.shaanWarState.set(threadID, { active: true, targetUID: target });
    return api.sendMessage(`✅ WAR MODE ON\n🎯 Target: ${target}\n🔥 Ab file se random attack shuru!`, threadID, messageID);
  }

  if (args[0] === "off") {
    global.shaanWarState.delete(threadID);
    return api.sendMessage("✅ WAR MODE OFF. Target ko choda gaya.", threadID, messageID);
  }

  return api.sendMessage("Kaise use karein:\n1. war on [UID]\n2. war off", threadID, messageID);
};
