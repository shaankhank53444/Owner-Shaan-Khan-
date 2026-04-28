const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "cover",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Create a cover photo",
  commandCategory: "Media",
  usages: "[name] | [subname] | [color]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const input = args.join(' ');

  if (!input) {
    return api.sendMessage(`⚠️ Please provide name and optional subname/color.\n\nUsage: cover [name] | [subname] | [color]\n\nExample:\n- cover SARDAR RDX\n- cover SARDAR RDX | Official Bot | blue`, threadID, messageID);
  }

  const parts = input.split('|').map(s => s.trim());
  let name = parts[0] || 'SARDAR RDX';
  let subname = parts[1] || 'Bot Official';
  let color = parts[2]?.toLowerCase() || 'blue';

  const colors = {
    'blue': '0066cc',
    'red': 'cc0000',
    'green': '00cc00',
    'purple': '6600cc',
    'pink': 'cc0066',
    'orange': 'cc6600',
    'black': '333333',
    'white': 'ffffff'
  };

  const hexColor = colors[color] || colors['blue'];

  api.sendMessage('🎨 Creating cover photo, please wait...', threadID, messageID);

  try {
    const apiUrl = `https://api-canvass.vercel.app/cover?name=${encodeURIComponent(name)}&subname=${encodeURIComponent(subname)}&uid=${senderID}&color=${hexColor}`;

    const response = await axios.get(apiUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const coverPath = path.join(cacheDir, `cover_${senderID}.jpg`);
    fs.writeFileSync(coverPath, Buffer.from(response.data));

    return api.sendMessage({
      body: `✅ COVER PHOTO CREATED\n═══════════════════════\n👤 Name: ${name}\n📝 Subname: ${subname}\n🎨 Color: ${color}\n═══════════════════════`,
      attachment: fs.createReadStream(coverPath)
    }, threadID, () => fs.unlinkSync(coverPath), messageID);

  } catch (error) {
    console.error(error);
    const fallbackMsg = `⚠️ API Error! Displaying text version:\n\n${name.toUpperCase()}\n${subname}\n\nColor Theme: ${color}`;
    return api.sendMessage(fallbackMsg, threadID, messageID);
  }
};
