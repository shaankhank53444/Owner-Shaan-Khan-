module.exports.config = {
  name: "dpname",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Drake meme maker",
  commandCategory: "edit-img",
  usages: "text 1 + text 2",
  cooldowns: 1
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise((resolve) => {
    if (!text) return resolve([]);
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return resolve(lines);
  });
};

module.exports.run = async function ({ api, event, args }) {
  let { threadID, messageID } = event;
  const { loadImage, createCanvas, registerFont } = require("canvas");
  const fs = require("fs-extra");
  const axios = require("axios");
  const pathImg = __dirname + `/cache/drake_${threadID}.png`;
  const pathFont = __dirname + "/cache/SNAZZYSURGE.ttf";

  // Text parsing logic
  const content = args.join(" ").split("+").map(item => item.trim());
  let text1 = content[0] || "Text 1";
  let text2 = content[1] || "Text 2";

  try {
    // 1. Image Download
    let imageBuffer = (await axios.get(`https://i.imgur.com/Vu0AYmH.jpg`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(imageBuffer, "utf-8"));

    // 2. Font Check & Download (Using a more reliable link if possible)
    if (!fs.existsSync(pathFont)) {
      let getfont = (await axios.get(`https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathFont, Buffer.from(getfont, "utf-8"));
    }

    registerFont(pathFont, { family: "SNAZZYSURGE" });

    let baseImage = await loadImage(pathImg);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.font = "30px SNAZZYSURGE";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";

    // 3. Drawing Text
    const lines1 = await this.wrapText(ctx, text1, 200);
    const lines2 = await this.wrapText(ctx, text2, 200);

    // Top Right Box (Drake rejecting)
    ctx.fillText(lines1.join("\n"), 250, 100);
    
    // Bottom Right Box (Drake accepting)
    ctx.fillText(lines2.join("\n"), 250, 300);

    const finalBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, finalBuffer);

    return api.sendMessage(
      { attachment: fs.createReadStream(pathImg) },
      threadID,
      () => fs.unlinkSync(pathImg),
      messageID
    );
  } catch (err) {
    console.error(err);
    return api.sendMessage("Error: " + err.message, threadID, messageID);
  }
};
