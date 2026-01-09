const fs = require("fs-extra");
const axios = require("axios");
const crypto = require("crypto");

module.exports.config = {
  name: "botdpchang",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "M.R ARYAN", // ❌ ISKO CHANGE KIYA TO FILE KAAM NAHI KAREGI
  description: "Sirf owner bot ki DP change kar sakta hai",
  commandCategory: "System",
  usages: "reply photo",
  cooldowns: 3
};

// 🔐 OWNER UID
const OWNER_IDS = ["100016828397863"];

// 🔒 ORIGINAL CREDIT LOCK (HASH)
const CREDIT_HASH = "3f7a4d2c9c3c8a7d7d1a7fbb1c2fd0a9"; 
// ye hash "M.R ARYAN" ka hai

// 🔐 Credit verify function
function verifyCredit() {
  const currentCredit = module.exports.config.credits;
  const hash = crypto
    .createHash("md5")
    .update(currentCredit)
    .digest("hex");
  return hash === CREDIT_HASH;
}

module.exports.run = async function ({ api, event }) {

  // ❌ Credit tampering detected
  if (!verifyCredit()) {
    return api.sendMessage(
      "❌ Credit change detect hua hai!\nCommand disabled.",
      event.threadID,
      event.messageID
    );
  }

  // ❌ Owner check
  if (!OWNER_IDS.includes(event.senderID)) {
    return api.sendMessage(
      "❌ Sirf owner hi bot ki DP change kar sakta hai!",
      event.threadID,
      event.messageID
    );
  }

  try {
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0]
    ) {
      return api.sendMessage(
        "🔁 Kisi photo ko reply karo!",
        event.threadID,
        event.messageID
      );
    }

    const imgURL = event.messageReply.attachments[0].url;
    const imgPath = __dirname + "/cache/botdp.jpg";

    // 📥 Download image
    const imageBuffer = (
      await axios.get(imgURL, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(imgPath, imageBuffer);

    // 🖼️ Change DP
    api.changeAvatar(fs.createReadStream(imgPath), (err) => {
      if (err) {
        return api.sendMessage(
          "❌ DP change failed!",
          event.threadID,
          event.messageID
        );
      }
      api.sendMessage(
        "✅ Bot ki DP successfully change ho gayi!",
        event.threadID,
        event.messageID
      );
    });

  } catch (e) {
    api.sendMessage(
      "❌ Error: " + e.message,
      event.threadID,
      event.messageID
    );
  }
};