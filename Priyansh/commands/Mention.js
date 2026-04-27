module.exports.config = {
  name: "goiadmin2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Bot will respond when tagging two specific admins",
  commandCategory: "Other",
  usages: "",
  cooldowns: 1
};

module.exports.handleEvent = function({ api, event }) {
  // Yahan apni dono Admin IDs set karein
  const admin1 = "61557679780525"; 
  const admin2 = "ADD_SECOND_ID_HERE"; // <-- Dusri ID yahan lagayein

  if (event.senderID !== admin1 && event.senderID !== admin2) {
    const mentions = Object.keys(event.mentions);
    
    // Agar dono mein se koi bhi tag hota hai to reply karega
    if (mentions.includes(admin1) || mentions.includes(admin2)) {
      const msg = [
        "𝐘𝐀𝐑 𝐀𝐑𝐈𝐒𝐇𝐅𝐀 𝐊𝐎 𝐌𝐄𝐍𝐓𝐈𝐎𝐍 𝐊𝐀𝐑𝐎 𝐁𝐔𝐑𝐀 𝐌𝐀𝐍 𝐉𝐀𝐘𝐄 𝐆𝐢😏", 
        "𝐃𝐨𝐨𝐑 𝐇𝐚𝐚𝐓 𝐉𝐚𝐨 𝐌𝐞𝐑𝐞 𝐚𝐫𝐢𝐬𝐡𝐟𝐚 𝐁𝐨𝐬𝐒 𝐒𝐞 𝐊𝐲𝐔 𝐁𝐨𝐋𝐚 𝐑𝐞𝐇 𝐇𝐨 𝐔𝐧𝐨 🤨", 
        "Wo to masum he 🥺 Us ko mention mat kro"
      ];
      
      return api.sendMessage({
        body: msg[Math.floor(Math.random() * msg.length)]
      }, event.threadID, event.messageID);
    }
  }
};

module.exports.run = async function({}) {
  // Empty
};
