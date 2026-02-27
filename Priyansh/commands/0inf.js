module.exports.config = {
  name: "inf",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Bot info aur system status check karne ke liye.",
  commandCategory: "system",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "moment-timezone": ""
  }
};

module.exports.run = async function({ api, event, client, __GLOBAL }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const moment = require("moment-timezone");
  
  // Uptime calculation
  const time = process.uptime();
  const hours = Math.floor(time / (60 * 60));
  const minutes = Math.floor((time % (60 * 60)) / 60);
  const seconds = Math.floor(time % 60);

  // Time and Date
  const juswa = moment.tz("Asia/Karachi").format("『D/MM/YYYY』 【HH:mm:ss】");
  
  // Image links
  const links = [
    "https://i.ibb.co/p64MMvQ5/f0d96d5b9e1b.jpg",
    "https://i.ibb.co/Fq4dtrXd/860aa021ba88.jpg",
    "https://i.ibb.co/5WmcxmBB/ef5270183c4f.jpg",
    "https://i.ibb.co/jk1dBL3w/56f368877445.jpg"
  ];

  const cachePath = __dirname + "/cache/inf.jpg";
  const randomImg = links[Math.floor(Math.random() * links.length)];

  try {
    // Image download using axios for better stability
    const response = await axios.get(randomImg, { responseType: "arraybuffer" });
    fs.writeFileSync(cachePath, Buffer.from(response.data, "utf-8"));

    const msg = {
      body: `╭━☆━╮\n🇵🇰 𝐀𝐃𝐌𝐈𝐍 𝐀𝐍𝐃 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 🇵🇰\n╰━☆━╯\n\n🤖☾︎𝗕𝗢𝗧 𝗡𝗔𝗠𝗘☽︎🤖 ${global.config.BOTNAME}\n══════════════════\n\n🔥𝗕𝗢𝗧 𝗔𝗗𝗠𝗜𝗡 シ︎🔥\n☞︎︎︎ 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 💔🥀\n══════════════════\n\n♥︎═════•❁❀❁•═════♥︎\n\n🌸𝔹𝕆𝕋 ℙℝ𝔼𝔽𝕀𝕏 🌸: ${global.config.PREFIX}\n♥️𝔹𝕆𝕋 𝕆𝕎ℕ𝔼ℝ♥️: 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍\n❤︎═════•❁❀❁•═════❤︎\n\n🕒 𝚄𝙿 𝚃𝙸𝙼𝙴 🕒\n\n🌪️Today is🌪️\n╔════════════════╗\n ${juswa}\n╚════════════════╝\n\n⚡ 𝘽𝙊𝙏 𝙄𝙎 𝙍𝙐𝙉𝙄𝙉𝙄𝙂 ⚡\n╭──🌟━━━━━━━━━━━━🌟──╮\n    ${hours}h ${minutes}m ${seconds}s\n╰──🌟━━━━━━━━━━━━🌟──╯\n\n✅ Thanks for using ${global.config.BOTNAME}\n\n🎀💞 𝗕𝗼𝘁 𝗢𝘄𝗻𝗲𝗿 💞🎀\n╔═══❖•ೋ° °ೋ•❖═══╗\n ✨❤️‍🔥 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 ❤️‍🔥✨\n╚═══❖•ೋ° °ೋ•❖═══╝`,
      attachment: fs.createReadStream(cachePath)
    };

    return api.sendMessage(msg, event.threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }, event.messageID);

  } catch (err) {
    return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
  }
};
