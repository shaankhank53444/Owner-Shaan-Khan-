module.exports.config = {
  name: "coupledp",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Couple Dp photos without prefix",
  commandCategory: "no prefix",
  usages: "couple dp",
  cooldowns: 2,
};

module.exports.handleEvent = async ({ api, event, Threads }) => {
  const axios = require("axios");
  const request = require("request");
  const fs = require("fs-extra");
  
  let { body, threadID, messageID } = event;
  if (body) {
    // Yahan check ho raha hai agar message "couple dp" hai
    const input = body.toLowerCase();
    if (input == "couple dp" || input == "cpl dp") {
      
      var link = [
        "https://i.imgur.com/g7woYNY.jpg","https://i.imgur.com/0jDiNmQ.jpg","https://i.imgur.com/3OX7sWP.jpg","https://i.imgur.com/IthNc1C.jpg","https://i.imgur.com/1RoN4la.jpg","https://i.imgur.com/vcfIO27.jpg","https://i.imgur.com/8yWRoMe.jpg","https://i.imgur.com/nku8dTF.jpg","https://i.imgur.com/V32qQb0.jpg","https://i.imgur.com/lkem5Gd.jpg","https://i.imgur.com/QIpV0AY.jpg","https://i.imgur.com/zdnDEtm.jpg","https://i.imgur.com/w7eKGSy.jpg","https://i.imgur.com/ONCJm5B.jpg","https://i.imgur.com/oQavLMr.jpg","https://i.imgur.com/MuBToNp.jpg","https://i.imgur.com/JrMY7j8.jpg","https://i.imgur.com/MauPoyi.jpg","https://i.imgur.com/t1B6vz1.jpg","https://i.imgur.com/VT200cX.jpg","https://i.imgur.com/9HTasfZ.jpg","https://i.imgur.com/waeDhYd.jpg","https://i.imgur.com/5dHsVO8.jpg","https://i.imgur.com/rrWIcrz.jpg","https://i.imgur.com/nEVUP1b.jpg","https://i.imgur.com/iHqdCMp.jpg","https://i.imgur.com/YHsbqM7.jpg","https://i.imgur.com/5ZQOCmT.jpg","https://i.imgur.com/AvoyQyk.jpg","https://i.imgur.com/MCuS0xn.jpg","https://i.imgur.com/c8yiwxR.jpg"
      ];

      var callback = () => api.sendMessage({
        body: `☟  ========== ☟ ==========  ☟\n𝐎𝐰𝐧𝐞𝐫 ➻  ──── 💐𝐒𝐇𝐀𝐀𝐍💐`,
        attachment: fs.createReadStream(__dirname + "/cache/couple.jpg")
      }, threadID, () => fs.unlinkSync(__dirname + "/cache/couple.jpg"), messageID);

      return request(encodeURI(link[Math.floor(Math.random() * link.length)]))
        .pipe(fs.createWriteStream(__dirname + "/cache/couple.jpg"))
        .on("close", () => callback());
    }
  }
};

module.exports.run = async ({ api, event, args }) => {
  // Ye khali rahega kyunki hum handleEvent use kar rahe hain
};
