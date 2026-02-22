const os = require('os');

module.exports.config = {
  name: "upt",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Display system uptime with dynamic owner name",
  commandCategory: "system",
  usages: "upt",
  cooldowns: 5
};

module.exports.handleEvent = async ({ api, event, Users }) => {
  if (!event.body) return;

  if (event.body.toLowerCase().indexOf("upt") == 0) {
    const time = process.uptime(),
          gio = Math.floor(time / (60 * 60)),
          phut = Math.floor((time % (60 * 60)) / 60),
          giay = Math.floor(time % 60);

    const currentDate = new Date();
    
    // Time formatting for Asia/Karachi
    const formattedTime = currentDate.toLocaleTimeString('en-US', { 
      hour12: true, 
      timeZone: 'Asia/Karachi' 
    });
    const formattedDate = currentDate.toLocaleDateString('en-GB', { 
      timeZone: 'Asia/Karachi' 
    });
    const formattedDay = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      timeZone: 'Asia/Karachi' 
    });

    // Dynamic Owner Name Fetching
    // Config file se pehla admin ID lega, agar nahi mila to default credits dikhayega
    const adminID = global.config.ADMINBOT[0]; 
    let ownerName = "Admin";
    try {
        ownerName = await Users.getNameUser(adminID);
    } catch (e) {
        ownerName = "SHAAN KHAN"; // Fallback name
    }

    const totalCommands = global.client ? global.client.commands.size : "68";

    const responseMessage = `╭─────────────────────────────╮\n` +
                            `│        🎉 ✧ 𝗨𝗣𝗧𝗜𝗠𝗘 ✧ 😉  │\n` +
                            `╰─────────────────────────────╯\n\n` +
                            `✰ 𝗥𝗨𝗡 ➪ ${gio}ʜ ${phut}ᴍ ${giay}ꜱ ✅\n` +
                            `✰ 𝗧𝗜𝗠𝗘 ➪ ${formattedTime} ⏰\n` +
                            `✰ 𝗗𝗔𝗧𝗘 ➪ ${formattedDate} 📅\n` +
                            `✰ 𝗗𝗔𝗬 ➪ ${formattedDay} 🗓️\n` +
                            `✰ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 ➪ ${totalCommands} 📊\n` +
                            `✰ 𝗢𝘄𝗻𝗲𝗿 ➪ ${ownerName} 👑\n\n` +
                            `┗━━━━━━━━━━━━━━━━━━━━━━━┛\n` +
                            `𝗠𝗔𝗗𝗘 𝗕𝗬 ❤️‍🔥 𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡`;

    return api.sendMessage(responseMessage, event.threadID, event.messageID);
  }
};

module.exports.run = () => {};
