const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "botdpchang",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Shaan Khan", // ✅ Creator name updated
  description: "Sirf specified owner hi bot ki DP change kar sakta hai",
  commandCategory: "System",
  usages: "reply photo",
  cooldowns: 3
};

// 🔐 OWNER UID (Updated)
const OWNER_IDS = ["100016828397863"];

module.exports.run = async function ({ api, event }) {

  // ❌ Owner check
  if (!OWNER_IDS.includes(event.senderID)) {
    return api.sendMessage(
      "❌ Sirf Shaan Khan hi bot ki DP change kar sakta hai!",
      event.threadID,
      event.messageID
    );
  }

  try {
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return api.sendMessage(
        "🔁 Kisi photo ko reply karke ye command use karein!",
        event.threadID,
        event.messageID
      );
    }

    const imgURL = event.messageReply.attachments[0].url;
    const imgPath = __dirname + "/cache/botdp.jpg";

    // 📥 Download image
    const response = await axios.get(imgURL, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, Buffer.from(response.data, "utf-8"));

    // 🖼️ Change DP
    api.changeAvatar(fs.createReadStream(imgPath), (err) => {
      if (err) {
        return api.sendMessage(
          "❌ DP change failed! Error: " + err.message,
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
