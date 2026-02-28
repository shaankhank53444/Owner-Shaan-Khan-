const fs = require("fs");
const path = require("path");

/* ================= CREATOR LOCK ================= */
// "Shaan Khan" is encoded in Base64 as "U2hhYW4gS2hhbg=="
const CREATOR_LOCK = (() => {
  const encoded = "U2hhYW4gS2hhbg=="; 

  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
  name: "war",
  version: "1.6.0",
  hasPermssion: 2,
  credits: "Shaan Khan",
  description: "MODIFIED BY SHAAN KHAN 🤠🙃",
  commandCategory: "Admin",
  usages: "war on [UID] / war off",
  cooldowns: 5,
};

// 🔐 Credit Protection - Check if credits are tampered
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits cannot be changed.");
  module.exports.run = () => {};
  module.exports.handleEvent = () => {};
  return;
}

/* =======================
   📁 FOLDER SYSTEM
======================= */

const DATA_DIR = path.join(__dirname, "SHAAN-KHAN");
const DATA_FILE = path.join(DATA_DIR, "WAR_LINES.txt");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load lines
function loadGaali() {
  if (!fs.existsSync(DATA_FILE)) {
    // Default line if file is empty
    fs.writeFileSync(DATA_FILE, "TERI MAA KO CHOD DUN!\n");
  }
  return fs.readFileSync(DATA_FILE, "utf8").split(/\r?\n/).filter(Boolean);
}

let gaaliLines = loadGaali();

/* =======================
   👑 ADMINS
======================= */

const botAdminUIDs = ["100016828397863"];

/* =======================
   ⚔️ WAR STATE (MEMORY ONLY)
======================= */

let warMode = false;
let targetUID = null;

/* =======================
   📩 HANDLE EVENT
======================= */

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, isGroup } = event;
  if (!isGroup) return;
  
  // Only trigger if war mode is ON and the sender is the TARGET
  if (!warMode || senderID !== targetUID) return;

  const gaali = gaaliLines[Math.floor(Math.random() * gaaliLines.length)];

  let name = "User";
  try {
    const info = await api.getUserInfo(senderID);
    name = info[senderID]?.name || "User";
  } catch (e) {
    // Fail silently if user info cannot be fetched
  }

  const finalMsg = `${name} ${gaali}`;
  return api.sendMessage(finalMsg, threadID);
};

/* =======================
   🧠 COMMAND
======================= */

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, isGroup } = event;

  if (!isGroup)
    return api.sendMessage("❌ Group only command.", threadID, messageID);

  // Authorization Check
  if (!botAdminUIDs.includes(senderID))
    return api.sendMessage("❌ Sirf Admin (Shaan Khan) hi ye command chala sakta hai.", threadID, messageID);

  if (args[0] === "on") {
    if (!args[1])
      return api.sendMessage(
        "⚠️ UID provide karein.\nUsage: war on [UID]",
        threadID,
        messageID
      );

    warMode = true;
    targetUID = args[1];

    return api.sendMessage(
      `✅ WAR MODE ACTIVATED\n🎯 Target UID: ${targetUID}\n🔥 Ab maza ayega!`,
      threadID,
      messageID
    );
  }

  if (args[0] === "off") {
    warMode = false;
    targetUID = null;
    return api.sendMessage("✅ WAR MODE DEACTIVATED. Shanti wapas aa gayi.", threadID, messageID);
  }

  return api.sendMessage(
    "Usage:\nwar on [UID]\nwar off",
    threadID,
    messageID
  );
};
