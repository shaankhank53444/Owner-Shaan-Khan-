const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "night",
  version: "1.0.5",
  hasPermission: 0,
  credits: "Shaan",
  description: "Auto Good Night response with image",
  commandCategory: "no prefix",
  usages: "Gud night",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body } = event;

  // 1. Check if body exists and convert to lowercase for easier matching
  if (!body) return;
  const input = body.toLowerCase();

  // 2. Check for trigger words
  if (input.startsWith("good night") || 
      input.startsWith("gud night") || 
      input.startsWith("gud nini") || 
      input.startsWith("gn")) {

    // 3. Image path setup
    const imagePath = path.join(__dirname, "noprefix", "1776499683750.jpg");

    const msg = {
      body: "🌸=𝐆𝐎𝐎𝐃__𝐍𝐈𝐆𝐇𝐓___😘 𝐒𝐎𝐍𝐄 𝐒𝐄 𝐏𝐀𝐇𝐋𝐄 𝐌𝐄𝐑𝐀 𝐍𝐀𝐀𝐌 𝐋𝐄 𝐋𝐀𝐍𝐀 𝐁𝐇𝐎𝐎𝐓 𝐍𝐀𝐇𝐈 𝐀𝐀𝐄𝐆𝐀_____ 😂:))"
    };

    // 4. Attachment handling with Error Check
    if (fs.existsSync(imagePath)) {
      msg.attachment = fs.createReadStream(imagePath);
    } else {
      console.log(`[ ERROR ] Image not found at: ${imagePath}`);
      // Agar image nahi milti toh sirf text bhej dega bot crash nahi hoga
    }

    // 5. Send Message & Reaction
    return api.sendMessage(msg, threadID, (err, info) => {
      if (!err) {
        api.setMessageReaction("😴", messageID, () => {}, true);
      }
    }, messageID);
  }
};

module.exports.run = function({ api, event }) {
  // Yeh khali rahega kyunki handleEvent use ho raha hai
};
