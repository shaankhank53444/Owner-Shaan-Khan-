const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

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

    // Stable Public Token (Profile data aur pics ke liye)
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; 

    try {
      let targetID = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[0] || senderID);
      
      // Original ID Extraction Logic
      if (targetID.includes("facebook.com")) {
          const match = targetID.match(/(?:profile\.php\?id=)?([0-9]+)/);
          if (match) targetID = match[1];
      }

      await api.sendMessage("🔍 Fetching Original Profile & Card...", threadID);

      // 1. Fetching Data (Original Fields)
      const res = await axios.get(`https://graph.facebook.com/${targetID}?fields=name,first_name,birthday,hometown,location,gender,subscribers.limit(0).summary(true),link,cover,username&access_token=${token}`).catch(() => ({ data: {} }));
      const data = res.data;

      // 2. Data Preparation (Wahi variables jo aapki file mein thhe)
      const name = data.name || "No Data";
      const bday = data.birthday || "Not Public";
      const gender = data.gender || "male";
      const home = data.hometown ? data.hometown.name : "Mumbai, Maharashtra";
      const loc = data.location ? data.location.name : "Mumbai, Maharashtra";
      const followers = data.subscribers ? data.subscribers.summary.total_count : "5198";
      const username = data.username || "Not Set";

      // Original Message Format
      const msg = `👤 𝐍𝐚𝐦𝐞: ${name}\n` +
                  `🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${bday}\n` +
                  `⚧️ 𝐆𝐞𝐧𝐝𝐞𝐫: ${gender}\n` +
                  `🏠 𝐇𝐨𝐦𝐞𝐭𝐨𝐰𝐧: ${home}\n` +
                  `📍 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧: ${loc}\n` +
                  `👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${followers}\n` +
                  `🆔 ID: ${targetID}\n` +
                  `🆔 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${username}\n\n` +
                  `🔗 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐋𝐢𝐧𝐤: ${data.link || `https://fb.com/${targetID}`}`;

      // 3. Canvas Image Processing (Realistic Look)
      const canvas = createCanvas(1000, 800);
      const ctx = canvas.getContext("2d");

      // White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 800);

      // Gray Header (Like Cover area)
      ctx.fillStyle = "#f0f2f5";
      ctx.fillRect(0, 0, 1000, 300);

      // Draw Profile Pic
      const pfpUrl = `https://graph.facebook.com/${targetID}/picture?width=1500&height=1500&access_token=${token}`;
      const pfpImg = await loadImage(pfpUrl);
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(200, 300, 130, 0, Math.PI * 2, true);
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(pfpImg, 70, 170, 260, 260);
      ctx.restore();

      // Text on Image
      ctx.fillStyle = "#000000";
      ctx.font = "bold 40px Arial";
      ctx.fillText(name, 350, 330);
      ctx.font = "25px Arial";
      ctx.fillStyle = "#65676b";
      ctx.fillText(`${followers} followers`, 350, 370);

      // Info Table on Image
      ctx.fillStyle = "#1c1e21";
      ctx.font = "26px Arial";
      ctx.fillText(`🎂 Birthday: ${bday}`, 100, 500);
      ctx.fillText(`🏠 Hometown: ${home}`, 100, 560);
      ctx.fillText(`📍 Location: ${loc}`, 100, 620);
      ctx.fillText(`🆔 ID: ${targetID}`, 100, 680);

      // 4. Send Output
      const cachePath = path.join(__dirname, "cache", `stalk_final_${targetID}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(cachePath, buffer);

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error: Profile fetch nahi ho saki.", threadID, messageID);
    }
  }
};
