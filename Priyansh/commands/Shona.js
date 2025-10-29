const fs = require("fs");
module.exports.config = {
  name: "shona",
    version: "1.0.1",
  hasPermssion: 0,
  credits: "uzairrajput", 
  description: "hihihihi",
  commandCategory: "no prefix",
  usages: "npxs5",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  var { threadID, messageID } = event;
  if (event.body.indexOf("SHONA")==0 || event.body.indexOf("Shona")==0 || event.body.indexOf("shona")==0 || event.body.indexOf("shona")==0) {
    var msg = {
        body: ``,
        attachment: fs.createReadStream(__dirname + `/uzair/Shona.mp3`)
      }
      api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("❣️", event.messageID, (err) => {}, true)
    }
  }
  module.exports.run = function({ api, event, client, __GLOBAL }) {

    }
