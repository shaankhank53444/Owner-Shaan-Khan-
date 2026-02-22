const os = require('os');

module.exports.config = {
  name: "upt",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Display system uptime with a new aesthetic layout",
  commandCategory: "Hukum Ke Bagher",
  usages: "upt",
  cooldowns: 5
};

module.exports.handleEvent = async ({ api, event }) => {
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

    // Note: Agar aap commands count dynamically chahte hain to global.client.commands.size use karein
    const totalCommands = global.client ? global.client.commands.size : "68";

    const responseMessage = `╭─────────────────────────────╮\n` +
                            `│        🎉 ✧ 𝗨𝗣𝗧𝗜𝗠𝗘 ✧ 😉  │\n` +
                            `╰─────────────────────────────╯\n\n` +
                            `✰ 𝗥𝗨𝗡 ➪ ${gio}ʜ ${phut}ᴍ ${giay}ꜱ ✅\n` +
                            `✰ 𝗧𝗜𝗠𝗘 ➪ ${formattedTime} ⏰\n` +
                            `✰ 𝗗𝗔𝗧𝗘 ➪ ${formattedDate} 📅\n` +
                            `✰ 𝗗𝗔𝗬 ➪ ${formattedDay} 🗓️\n` +
                            `✰ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 ➪ ${totalCommands} 📊\n` +
                            `✰ 𝗢𝘄𝗻𝗲𝗿 ➪ 乛 ꜛSʜʌʌɳ Kʜʌɳ'ฝꜛ ː ꕥ᭄ 👑\n\n` +
                            `┗━━━━━━━━━━━━━━━━━━━━━━━┛\n` +
                            `𝗠𝗔𝗗𝗘 𝗕𝗬 ❤️‍🔥 𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡`;

    api.sendMessage(responseMessage, event.threadID, event.messageID);
  }
};

module.exports.run = () => {};
