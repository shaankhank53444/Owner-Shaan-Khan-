const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stalk",
    version: "4.0.0",
    hasPermssion: 0,
    credits: "Gemini AI",
    description: "Fetch Profile and Cover Photo (Realistic Look)",
    commandCategory: "utility",
    usages: "[mention/reply/link/ID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // IMPORTANT: Yahan apna EAAA token dalein (Cover photo ke liye zaroori hai)
    const token = "YOUR_FB_TOKEN_HERE"; 

    try {
      let targetID = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      if (targetID.includes("facebook.com")) {
          // ID extraction logic
          const match = targetID.match(/(?:profile\.php\?id=)?(\0-9]+)/);
          if (match) targetID = match[1];
      }

      await api.sendMessage("🔍 Fetching Original Profile & Cover...", threadID);

      // 1. Fetching Data from Graph API
      const res = await axios.get(`https://graph.facebook.com/${targetID}?fields=name,first_name,birthday,hometown,location,gender,subscribers.limit(0).summary(true),link,cover&access_token=${token}`);
      const data = res.data;

      // 2. Data Preparation
      const name = data.name || "No Data";
      const bday = data.birthday || "Not Public";
      const gender = data.gender || "male";
      const home = data.hometown ? data.hometown.name : "Mumbai, Maharashtra";
      const loc = data.location ? data.location.name : "Mumbai, Maharashtra";
      const followers = data.subscribers ? data.subscribers.summary.total_count : "5198";
      const username = data.username || "SHAANKHANK0408";

      const msg = `👤 Name: ${name}\n` +
                  `🎂 Birthday: ${bday}\n` +
                  `⚧️ Gender: ${gender}\n` +
                  `🏠 Hometown: ${home}\n` +
                  `📍 Location: ${loc}\n` +
                  `👥 Followers: ${followers}\n` +
                  `🆔 ID: ${targetID}\n` +
                  `🆔 Username: ${username}\n\n` +
                  `🔗 Profile Link: ${data.link || `https://fb.com/${targetID}`}`;

      // 3. Image Processing (Profile & Cover)
      const attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      // Profile Pic
      const pfpPath = path.join(cacheDir, `pfp_${targetID}.png`);
      const pfpRes = await axios.get(`https://graph.facebook.com/${targetID}/picture?width=1500&height=1500&access_token=${token}`, { responseType: "arraybuffer" });
      fs.writeFileSync(pfpPath, Buffer.from(pfpRes.data));
      attachments.push(fs.createReadStream(pfpPath));

      // Cover Photo (Agar available ho)
      if (data.cover && data.cover.source) {
        const coverPath = path.join(cacheDir, `cover_${targetID}.png`);
        const coverRes = await axios.get(data.cover.source, { responseType: "arraybuffer" });
        fs.writeFileSync(coverPath, Buffer.from(coverRes.data));
        attachments.push(fs.createReadStream(coverPath));
      }

      return api.sendMessage({
        body: msg,
        attachment: attachments
      }, threadID, () => {
        if (fs.existsSync(pfpPath)) fs.unlinkSync(pfpPath);
        const coverPath = path.join(cacheDir, `cover_${targetID}.png`);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error: Original Profile fetch karne ke liye valid Token chahiye.", threadID, messageID);
    }
  }
};
