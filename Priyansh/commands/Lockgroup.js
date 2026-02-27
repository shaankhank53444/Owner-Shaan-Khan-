const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "lockgroup",
    version: "1.5.0",
    credits: "SARDAR RDX / Gemini",
    countDown: 5,
    role: 1, // 1 = Group Admins only
    description: "Lock group name, image, or settings.",
    category: "box chat",
    guide: {
      en: "{pn} [name/emoji/theme/image/all] [on/off]"
    }
  },

  async onStart({ api, event, args, Threads }) {
    const { threadID, senderID } = event;
    const send = (msg) => api.sendMessage(msg, threadID, event.messageID);

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const data = (await Threads.getData(threadID)).data || {};
      
      const target = args[0]?.toLowerCase();
      const action = args[1]?.toLowerCase();

      if (!target || !['name', 'emoji', 'theme', 'color', 'image', 'photo', 'all'].includes(target)) {
        return send(`🛡️ LOCK SETTINGS\n` +
          `═══════════════════════\n` +
          `📝 Name: ${data.lockName ? '✅ ON' : '❌ OFF'}\n` +
          `👍 Emoji: ${data.lockEmoji ? '✅ ON' : '❌ OFF'}\n` +
          `🎨 Theme: ${data.lockTheme ? '✅ ON' : '❌ OFF'}\n` +
          `🖼️ Image: ${data.lockImage ? '✅ ON' : '❌ OFF'}\n` +
          `═══════════════════════\n` +
          `Usage: lockgroup [target] [on/off]`);
      }

      const status = (action === 'on' || action === 'enable');

      // Object to update Threads data
      let updateData = { ...data };

      if (target === 'name') {
        updateData.lockName = status;
        updateData.originalName = status ? threadInfo.threadName : null;
      } 
      else if (target === 'emoji') {
        updateData.lockEmoji = status;
        updateData.originalEmoji = status ? threadInfo.emoji : null;
      }
      else if (target === 'theme' || target === 'color') {
        updateData.lockTheme = status;
        updateData.originalTheme = status ? (threadInfo.threadThemeID || threadInfo.color) : null;
      }
      else if (target === 'image' || target === 'photo') {
        if (status && threadInfo.imageSrc) {
          const cacheDir = path.join(__dirname, 'cache', 'lockgroup');
          await fs.ensureDir(cacheDir);
          const imgPath = path.join(cacheDir, `${threadID}.jpg`);
          const imgRes = await axios.get(threadInfo.imageSrc, { responseType: 'arraybuffer' });
          await fs.writeFile(imgPath, Buffer.from(imgRes.data));
          
          updateData.lockImage = true;
          updateData.originalImagePath = imgPath;
        } else {
          updateData.lockImage = false;
        }
      }
      else if (target === 'all') {
        updateData.lockName = status;
        updateData.lockEmoji = status;
        updateData.lockTheme = status;
        updateData.lockImage = status;
        updateData.originalName = status ? threadInfo.threadName : null;
        updateData.originalEmoji = status ? threadInfo.emoji : null;
        updateData.originalTheme = status ? (threadInfo.threadThemeID || threadInfo.color) : null;
      }

      await Threads.setData(threadID, { data: updateData });
      return send(`✅ ${target.toUpperCase()} settings set to ${status ? 'LOCKED' : 'UNLOCKED'}.`);

    } catch (e) {
      console.error(e);
      return send("❌ Error: " + e.message);
    }
  }
};
