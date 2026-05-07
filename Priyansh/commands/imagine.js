module.exports.config = {
  name: "imagine",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Generate image from Pollinations AI",
  commandCategory: "image",
  usages: "query",
  cooldowns: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const axios = require('axios');
  const fs = require('fs-extra');
  let { threadID, messageID } = event;
  let query = args.join(" ");

  if (!query) return api.sendMessage("Please provide a prompt/query.", threadID, messageID);

  let path = __dirname + `/cache/poli_${Date.now()}.png`;

  try {
    // encodeURIComponent add kiya hai taaki spaces aur special characters prompt mein masla na karein
    const response = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(query)}`, {
      responseType: "arraybuffer",
    });

    // Buffer ko binary format mein save kiya gaya hai
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));

    api.sendMessage({
      body: `“${query}” 𝗜𝗺𝗮𝗴𝗲 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱`,
      attachment: fs.createReadStream(path)
    }, threadID, () => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    }, messageID);

  } catch (e) {
    return api.sendMessage("Error: Image generate nahi ho saki.", threadID, messageID);
  }
};
