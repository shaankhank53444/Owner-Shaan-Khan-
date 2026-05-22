module.exports.config = {
  name: "dpname",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Drake meme maker",
  commandCategory: "image",
  usages: "dpname [text1] | [text2]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { createCanvas, loadImage } = global.nodemodule["canvas"];
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  
  // Cache folder check and create
  const dirPath = __dirname + "/cache/";
  if (!fs.existsSync(dirPath)) fs.ensureDirSync(dirPath);

  let pathImg = dirPath + `drake_${event.senderID}.png`;
  
  // Text split ( | ke through)
  let input = args.join(" ");
  let text = input.split("|");
  let t1 = text[0] ? text[0].trim() : "Text 1";
  let t2 = text[1] ? text[1].trim() : "Text 2";

  try {
    // Image Download
    let getImage = (await axios.get(`https://i.imgur.com/nJPIeQS.jpg`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getImage, "utf-8"));

    let baseImage = await loadImage(pathImg);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // Font settings
    ctx.font = "40px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    
    // Draw text
    ctx.fillText(t1, 360, 80);
    ctx.fillText(t2, 360, 220);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    
    return api.sendMessage(
      { attachment: fs.createReadStream(pathImg) },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );
  } catch (e) {
    return api.sendMessage("Error: " + e.message, event.threadID, event.messageID);
  }
};
