const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit2",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Edit images using NanoBanana AI (v2) with Username",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type, senderID } = event;

  if (type !== "message_reply" || !messageReply) {
    return api.sendMessage(
      `⚠️ Please reply to an image with your edit prompt!\n\n📝 Usage: .edit2 [prompt]\n\nExample: .edit2 make the cat blue\n\n✨ Powered by: Shaan Khan`,
      threadID,
      messageID
    );
  }

  if (!messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      `❌ The message you replied to doesn't contain any image!`,
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage(
      `❌ Please reply to an image, not a ${attachment.type}!`,
      threadID,
      messageID
    );
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage(
      `❌ Please provide an edit prompt!`,
      threadID,
      messageID
    );
  }

  // User ka naam nikaalne ke liye logic
  let senderName = "User";
  try {
    const userInfo = await api.getUserInfo(senderID);
    senderName = userInfo[senderID].name;
  } catch (err) {
    console.log("Error getting user name:", err);
  }

  const imageUrl = attachment.url;

  const processingMsg = await api.sendMessage(
    `🎨 Processing your image edit request...\n⏳ This may take a few moments...\n\n👤 Requested by: ${senderName}\n🔧 Edited by: Shaan Khan`,
    threadID
  );

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
    }

    const cookie = "AEC=AVh_V2iyBHpOrwnn7CeXoAiedfWn9aarNoKT20Br2UX9Td9K-RAeS_o7Sg; HSID=Ao0szVfkYnMchTVfk; SSID=AGahZP8H4ni4UpnFV; APISID=SD-Q2DJLGdmZcxlA/AS8N0Gkp_b9sJC84f; SAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-1PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-3PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; SEARCH_SAMESITE=CgQI354B; SID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bZzx09pPfc201wUcRVKfh-wACgYKAXUSARMSFQHGX2MiU_dnPuMOs-717cJlLCeWOBoVAUF8yKpYTllPAbVgYQ0Mr_GyeXxV0076; __Secure-1PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3b_Pt9L1eqcIAVeh7ZdRBOXgACgYKAYESARMSFQHGX2MicAK_Acu_-NCkzEz2wjCHmxoVAUF8yKp9xk8gQ82f-Ob76ysTXojB0076; __Secure-3PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bUudZTunPKtKbLRSoGKl1dAACgYKAYISARMSFQHGX2MimdzCEq63UmiyGU-3eyZx9RoVAUF8yKrc4ycLY7LGaJUyDXk_7u7M0076";

    const apiUrl = `https://anabot.my.id/api/ai/geminiOption?prompt=${encodeURIComponent(prompt)}&type=NanoBanana&imageUrl=${encodeURIComponent(imageUrl)}&cookie=${encodeURIComponent(cookie)}&apikey=freeApikey`;

    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'Shaan Khan Image Editor/1.0.0' },
      timeout: 60000
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || "API request failed");
    }

    const resultUrl = response.data.data?.result?.url;
    const fileName = `edit2_${Date.now()}.png`;
    const filePath = path.join(cacheDir, fileName);

    const imageResponse = await axios({
      url: resultUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    imageResponse.data.pipe(writer);

    writer.on("finish", () => {
      api.unsendMessage(processingMsg.messageID);
      api.sendMessage(
        {
          body: `✨ Image edited successfully!\n\n📝 Prompt: ${prompt}\n👤 Requested by: ${senderName}\n🎨 Edited by: Shaan Khan`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); },
        messageID
      );
    });

  } catch (error) {
    console.error(error);
    api.unsendMessage(processingMsg.messageID);
    api.sendMessage(`❌ Error: ${error.message}\n\n✨ Powered by: Shaan Khan`, threadID, messageID);
  }
};
