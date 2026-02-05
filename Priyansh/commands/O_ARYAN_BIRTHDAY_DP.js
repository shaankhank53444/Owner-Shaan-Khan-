module.exports.config = {
  name: "birthday",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Birthday DP Maker",
  commandCategory: "PROFILE DP",
  usages: "self or mention",
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "canvas": ""
  },
  cooldowns: 5
};

module.exports.wrapText = (ctx, name, maxWidth) => {
  return new Promise(resolve => {
    if (ctx.measureText(name).width < maxWidth) return resolve([name]);
    const words = name.split(' ');
    const lines = [];
    let line = '';
    while (words.length > 0) {
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
}

module.exports.run = async function ({ args, Users, api, event }) {
  const { loadImage, createCanvas } = require("canvas");
  const fs = require("fs-extra");
  const axios = require("axios");
  
  let pathImg = __dirname + `/cache/birthday_${event.senderID}.png`;
  let pathAvt1 = __dirname + `/cache/avt_${event.senderID}.png`;

  var id = Object.keys(event.mentions)[0] || event.senderID;
  var name = await Users.getNameUser(id);

  // Background Image URL
  var backgroundUrl = "https://i.imgur.com/y77QpRe.jpg";
  // Profile Picture URL (Using a more reliable method)
  var avatarUrl = `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  try {
    // Download Images
    let getAvt = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvt, "utf-8"));

    let getBackground = (await axios.get(backgroundUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getBackground, "utf-8"));

    let baseImage = await loadImage(pathImg);
    let baseAvt = await loadImage(pathAvt1);

    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");

    // Draw Background
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    
    // Draw Avatar (Aapke coordinates ke mutabiq)
    ctx.drawImage(baseAvt, 231, 170, 307, 385);

    // Draw Name Text
    ctx.font = "bold 30px Arial"; // Font thoda bada kiya
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "center";
    
    // Text ko avatar ke niche ya background ke hisab se set karein (X=385, Y=600 example hai)
    ctx.fillText(name, 385, 580); 

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage({
      body: `Happy Birthday, ${name}!`,
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => {
      if(fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      if(fs.existsSync(pathAvt1)) fs.unlinkSync(pathAvt1);
    }, event.messageID);

  } catch (error) {
    console.log(error);
    return api.sendMessage("Koshish nakam rahi, shayad internet ya API ka masla hai.", event.threadID, event.messageID);
  }
}
