const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "SHAAN",
  description: "Edit images using NanoBanana AI (Gemini)",
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
      "⚠️ Please reply to an image with your edit prompt!\n\nExample: edit make the cat blue",
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage(`❌ Please reply to an image, not a ${attachment.type}!`, threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("❌ Please provide an edit prompt!", threadID, messageID);
  }

  const imageUrl = attachment.url;
  const waitingMsg = await api.sendMessage("🎨 NanoBanana is editing your image... Please wait a moment.", threadID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    // Tip: Agar error aaye toh ye cookie refresh karni hogi.
    const cookie = "AEC=AVh_V2iyBHpOrwnn7CeXoAiedfWn9aarNoKT20Br2UX9Td9K-RAeS_o7Sg; HSID=Ao0szVfkYnMchTVfk; SSID=AGahZP8H4ni4UpnFV; APISID=SD-Q2DJLGdmZcxlA/AS8N0Gkp_b9sJC84f; SAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-1PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; __Secure-3PAPISID=9BY2tOwgEz4dK4dY/Acpw5_--fM7PV-aw4; SEARCH_SAMESITE=CgQI354B; SID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bZzx09pPfc201wUcRVKfh-wACgYKAXUSARMSFQHGX2MiU_dnPuMOs-717cJlLCeWOBoVAUF8yKpYTllPAbVgYQ0Mr_GyeXxV0076; __Secure-1PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3b_Pt9L1eqcIAVeh7ZdRBOXgACgYKAYESARMSFQHGX2MicAK_Acu_-NCkzEz2wjCHmxoVAUF8yKp9xk8gQ82f-Ob76ysTXojB0076; __Secure-3PSID=g.a0002wiVPDeqp9Z41WGZdsMDSNVWFaxa7cmenLYb7jwJzpe0kW3bUudZTunPKtKbLRSoGKl1dAACgYKAYISARMSFQHGX2MimdzCEq63UmiyGU-3eyZx9RoVAUF8yKrc4ycLY7LGaJUyDXk_7u7M0076";

    // API Call with encoded components
    const apiUrl = `https://anabot.my.id/api/ai/geminiOption`;
    
    const response = await axios.get(apiUrl, {
      params: {
        prompt: prompt,
        type: "NanoBanana",
        imageUrl: imageUrl,
        cookie: cookie,
        apikey: "freeApikey"
      },
      timeout: 120000 // 2 minutes timeout because AI takes time
    });

    // Detailed Debugging for API response
    if (!response.data || response.data.status !== 200) {
      throw new Error(response.data?.message || "API returned an invalid status.");
    }

    const resultUrl = response.data.result; // Checking actual result field from this API
    if (!resultUrl) throw new Error("API could not generate an image for this prompt.");

    const filePath = path.join(cacheDir, `nano_${Date.now()}.png`);
    
    // Download the resulting image
    const getImg = await axios.get(resultUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(getImg.data));

    await api.unsendMessage(waitingMsg.messageID);

    return api.sendMessage({
      body: `✅ Image Edited Successfully!\n\n✨ Prompt: ${prompt}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (error) {
    if (waitingMsg) api.unsendMessage(waitingMsg.messageID);
    
    console.error("EDIT ERROR:", error.response?.data || error.message);
    
    let errMsg = "An error occurred while processing the image.";
    if (error.message.includes("timeout")) errMsg = "⏳ API took too long to respond. Try again later.";
    if (error.response?.status === 403) errMsg = "🔑 Cookie expired! Please update the cookie in the code.";

    return api.sendMessage(`❌ ${errMsg}`, threadID, messageID);
  }
};
