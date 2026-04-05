const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit3", // Command ka naam change kar diya gaya hai
  version: "1.1.0",
  hasPermssion: 0, 
  credits: "Shaan",
  description: "Edit images using NanoBanana AI (Gemini 3 Flash Image)",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  // 1. Validation: Check if it's a reply to an image
  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      "⚠️ Please reply to an image with your edit prompt!\n\nExample: edit3 make the cat wear a crown",
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Please reply to an image file!", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt describing the changes.", threadID, messageID);
  }

  const processingMsg = await api.sendMessage("🎨 NanoBanana is redesigning your image...", threadID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    const imageUrl = attachment.url;
    const cookie = "AEC=AVh_V2iyBHpOrwnn7CeXoAiedfWn9aarNoKT20Br2UX9Td9K-RAeS_o7Sg; HSID=Ao0szVfkYnMchTVfk; SSID=AGahZP8H4ni4UpnFV; APISID=SD-Q2DJLGdmZcxlA/AS8N0Gkp_b9sJC84f; SAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-1PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-3PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; SEARCH_SAMESITE=CgQI354B; SID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bZzx09pPfc201wUcRVKfh-wACgYKAXUSARMSFQHGX2MiU_dnPuMOs-717cJlLCeWOBoVAUF8yKpYTllPAbVgYQ0Mr_GyeXxV0076; __Secure-1PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3b_Pt9L1eqcIAVeh7ZdRBOXgACgYKAYESARMSFQHGX2MicAK_Acu_-NCkzEz2wjCHmxoVAUF8yKp9xk8gQ82f-Ob76ysTXojB0076; __Secure-3PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bUudZTunPKtKbLRSoGKl1dAACgYKAYISARMSFQHGX2MimdzCEq63UmiyGU-3eyZx9RoVAUF8yKrc4ycLY7LGaJUyDXk_7u7M0076";

    // 2. API Request using params for safer encoding
    const response = await axios.get("https://anabot.my.id/api/ai/geminiOption", {
      params: {
        prompt: prompt,
        type: "NanoBanana",
        imageUrl: imageUrl,
        cookie: cookie,
        apikey: "freeApikey"
      },
      timeout: 90000 
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || "The AI failed to process the image.");
    }

    const resultUrl = response.data.data?.result?.url;
    if (!resultUrl) throw new Error("API didn't return an image URL.");

    // 3. Image Download
    const filePath = path.join(cacheDir, `edit3_${Date.now()}.png`);
    const imgData = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(imgData.data, 'binary'));

    // 4. Send Result and Cleanup
    await api.unsendMessage(processingMsg.messageID);
    return api.sendMessage({
      body: `✨ Edit Complete (edit3)!\n\nPrompt: "${prompt}"\nModel: NanoBanana 2`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (error) {
    console.error("Edit3 Error:", error);
    if (processingMsg.messageID) api.unsendMessage(processingMsg.messageID);

    const msg = error.response?.status === 500 
      ? "❌ API Server overloaded. Please try again later." 
      : `❌ Error: ${error.message}`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
