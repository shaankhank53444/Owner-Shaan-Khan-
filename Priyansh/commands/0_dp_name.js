module.exports.config = {
  name: "dpname",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Drake meme maker",
  commandCategory: "image",
  usages: "text 1 + text 2",
  cooldowns: 1
};

module.exports.run = async function ({ api, event, args }) {
  const { createCanvas, loadImage } = require("canvas");
  const fs = require("fs-extra");
  const axios = require("axios");
  
  let pathImg = __dirname + `/cache/drake_meme.png`;
  let input = args.join(" ");
  let text = input.split("+");
  
  // Agar text nahi diya to error message
  if (!text[0] || !text[1]) return api.sendMessage("Sahi format use karein: dpname Text1 + Text2", event.threadID, event.messageID);

  let getImage = (await axios.get(`https://i.imgur.com/nJPIeQS.jpg`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(pathImg, Buffer.from(getImage, "utf-8"));

  let baseImage = await loadImage(pathImg);
  let canvas = createCanvas(baseImage.width, baseImage.height);
  let ctx = canvas.getContext("2d");
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  ctx.font = "30px Arial";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  
  // Text 1 (Upar)
  ctx.fillText(text[0].trim(), 360, 67);
  // Text 2 (Niche)
  ctx.fillText(text[1].trim(), 360, 197);

  const imageBuffer = canvas.toBuffer();
  fs.writeFileSync(pathImg, imageBuffer);
  
  return api.sendMessage(
    { attachment: fs.createReadStream(pathImg) },
    event.threadID,
    () => fs.unlinkSync(pathImg),
    event.messageID
  );
};
