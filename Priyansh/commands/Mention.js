module.exports.config = {
  name: "goiadmin",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
  description: "Bot will rep ng tag admin or rep ng tagbot ",
  commandCategory: "Other",
  usages: "",
  cooldowns: 1
};
module.exports.handleEvent = function({ api, event }) {
  if (event.senderID !== "61557679780525") {
    var aid = ["161557679780525"];
    for (const id of aid) {
    if ( Object.keys(event.mentions) == id) {
      var msg = ["𝐘𝐀𝐑 𝐀𝐑𝐈𝐒𝐇𝐅𝐀 𝐊𝐎 𝐌𝐄𝐍𝐓𝐈𝐎𝐍 𝐊𝐀𝐑𝐎 𝐁𝐔𝐑𝐀 𝐌𝐀𝐍 𝐉𝐀𝐘𝐄 𝐆𝐢😏", "𝐃𝐨𝐨𝐑 𝐇𝐚𝐚𝐓 𝐉𝐚𝐨 𝐌𝐞𝐑𝐞 𝐀𝐫𝐢𝐬𝐡𝐟𝐚 𝐁𝐨𝐬𝐒 𝐒𝐞 𝐊𝐲𝐔 𝐁𝐨𝐋𝐚 𝐑𝐞𝐇 𝐇𝐨 𝐔𝐧𝐨 🤨" , "Wo to masum he 🥺
Us ko mantion mat kro"];
      return api.sendMessage({body: msg[Math.floor(Math.random()*msg.length)]}, event.threadID, event.messageID);
    }
    }}
};
module.exports.run = async function({}) {
        }