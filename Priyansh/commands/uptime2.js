const os = require("os");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "upt2",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "No prefix uptime command",
    commandCategory: "system",
    usages: "upt2",
    cooldowns: 5,
    dependencies: {
      "fs-extra": "",
      "axios": "",
      "path": ""
    }
  },

  // Ye part "upt2" bina prefix ke detect karega
  handleEvent: async function ({ api, event }) {
    if (event.body && event.body.toLowerCase() === "upt2") {
      return this.run({ api, event });
    }
  },

  run: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      const totalSeconds = process.uptime();
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const totalMemoryGB = os.totalmem() / 1024 ** 3;
      const freeMemoryGB = os.freemem() / 1024 ** 3;
      const usedMemoryGB = totalMemoryGB - freeMemoryGB;
      const cpuUsage = (os.loadavg()[0] * 100 / os.cpus().length).toFixed(1);

      const timeStart = Date.now();
      const time = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      });
      const date = new Date().toLocaleDateString("en-US");

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

      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      
      const imgPath = path.join(cachePath, `uptime_${Date.now()}.gif`);
      const imgUrl = "https://i.ibb.co/TqwtBwF2/2c307b069cfd.gif";

      const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
      await fs.outputFile(imgPath, Buffer.from(response.data));

      return api.sendMessage({
        body: systemInfo,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        api.unsendMessage(infoMsg.messageID);
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ | Error: System info load nahi ho payi.", threadID, messageID);
    }
  }
};
