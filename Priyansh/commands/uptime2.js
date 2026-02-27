const os = require("os");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "uptime2",
    version: "1.0.1",
    hasPermssion: 0, // Mirai mein 0 = Everyone, 1 = Admin, 2 = Bot Admin
    credits: "Shaan Khan",
    description: "Bot ka system status aur uptime check karein.",
    commandCategory: "system",
    usages: "",
    cooldowns: 5,
    dependencies: {
      "fs-extra": "",
      "axios": "",
      "path": ""
    }
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
      // Uptime calculation using process.uptime()
      const totalSeconds = process.uptime();
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // System Stats
      const totalMemoryGB = os.totalmem() / 1024 ** 3;
      const freeMemoryGB = os.freemem() / 1024 ** 3;
      const usedMemoryGB = totalMemoryGB - freeMemoryGB;
      const cpuUsage = (os.loadavg()[0] * 100 / os.cpus().length).toFixed(1);

      // Date and Time (India)
      const timeStart = Date.now();
      const time = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      });
      const date = new Date().toLocaleDateString("en-US");

      // Initial ping message
      const infoMsg = await api.sendMessage("⚡ | System analysis in progress...", threadID);
      const ping = Date.now() - timeStart;

      let pingStatus = ping < 500 ? "✅ | Stable" : "⚠️ | High Latency";

      const systemInfo = `
┏━━━━━༺༻━━━━━┓
         𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎
┗━━━━━༺༻━━━━━┛
╭──────[ ✦ ]──────╮
➤ ⏳ 𝗨𝗣𝗧𝗜𝗠𝗘: ${uptimeFormatted}
➤ 🖥️ 𝗢𝗦: ${os.type()} ${os.arch()}
➤ ⚙️ 𝗡𝗢𝗗𝗘: ${process.version}
➤ 🧠 𝗖𝗣𝗨: ${os.cpus()[0].model}
➤ 💾 𝗦𝗧𝗢𝗥𝗔𝗚𝗘: ${usedMemoryGB.toFixed(2)} / ${totalMemoryGB.toFixed(2)} GB
➤ 📈 𝗖𝗣𝗨 𝗟𝗢𝗔𝗗: ${cpuUsage}%
➤ 🧹 𝗥𝗔𝗠 𝗨𝗦𝗘: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
╰──────[ ✦ ]──────╯
┏━━━━━༺༻━━━━━┓
       𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒
┗━━━━━༺༻━━━━━┛
➤ 📅 𝗗𝗔𝗧𝗘: ${date}
➤ ⏰ 𝗧𝗜𝗠𝗘: ${time}
➤ ⚡ 𝗣𝗜𝗡𝗚: ${ping} ms
➤ ⭐ 𝗦𝗧𝗔𝗧𝗨𝗦: ${pingStatus}
`;

      const imgPath = path.join(__dirname, "cache", `uptime_${Date.now()}.gif`);
      const imgUrl = "https://i.ibb.co/TqwtBwF2/2c307b069cfd.gif";

      // Download and Send Image
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

      const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
      await fs.outputFile(imgPath, Buffer.from(response.data));

      return api.sendMessage({
        body: systemInfo,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        api.unsendMessage(infoMsg.messageID); // Purana "Checking" message delete kar dega
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ | Error: System details fetch nahi ho paaye.", threadID, messageID);
    }
  }
};
