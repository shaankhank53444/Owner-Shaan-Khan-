/**
 * @author MintDaL
 * @remake Gemini AI
 * @warn Do not edit credits
 */

module.exports.config = {
  name: "info",
  version: "1.3.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Bot aur Admin ki info (Sirf start mein info likhne par)",
  commandCategory: "User Help",
  usages: "info",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const { threadID, messageID, body } = event;

  // STRICT CHECK: Sirf tab chalega jab message "info" se shuru ho
  if (!body || !body.toLowerCase().startsWith("info")) {
    return;
  }

  // Stats aur Prefix nikalna
  const threadSetting = (await Threads.getData(String(threadID))).data || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  const systemPrefix = global.config.PREFIX;

  const time = process.uptime();
  const hours = Math.floor(time / (60 * 60));
  const minutes = Math.floor((time % (60 * 60)) / 60);

  const dateNow = Date.now();
  const { commands } = global.client;

  const imageLink = "https://i.imgur.com/Hp95vr5.jpeg";
  const cachePath = __dirname + "/cache/info_shaan.jpg";

  // Roman Urdu Message
  const msgBody = `𝐀𝐃𝐌𝐈𝐍 𝐀𝐍𝐃 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎
─────────────────
» System Prefix: ${systemPrefix}
» Group Prefix: ${prefix}
» Total Commands: ${commands.size}
» Bot Ping: ${Date.now() - dateNow}ms
» Bot Online: ${hours}h ${minutes}m
─────────────────
╭───────────╮
  𝐎𝐰𝐧𝐞𝐫: 𝐌.𝐑 𝐒𝐇𝐀𝐀𝐍 
╰───────────╯ 
  𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐓𝐨 𝐒𝐇𝐀𝐀𝐍 𝐁𝐎𝐓 
──────────────────
𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐈𝐃:
https://www.facebook.com/profile.php?id=100016828397863
─────────────────`;

  try {
    // Image download logic with Axios (More stable)
    const response = await axios.get(imageLink, { responseType: "arraybuffer" });
    fs.writeFileSync(cachePath, Buffer.from(response.data, "utf-8"));

    return api.sendMessage(
      {
        body: msgBody,
        attachment: fs.createReadStream(cachePath),
      },
      threadID,
      () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      },
      messageID
    );
  } catch (error) {
    // Agar image mein koi masla aaye toh sirf text bhej do, bot crash nahi hoga
    console.error("Info Command Error:", error);
    return api.sendMessage(msgBody, threadID, messageID);
  }
};
