const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Edit images using NanoBanana AI (v2)",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  if (type !== "message_reply" || !messageReply) {
    return api.sendMessage(
      `⚠️ Please reply to an image with your edit prompt!\n\n📝 Usage: .edit2 [prompt]\n\nExample: .edit2 make the cat blue and add sunglasses\n\n✨ Powered by: MISS ALIYA`,
      threadID,
      messageID
    );
  }

  if (!messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      `❌ The message you replied to doesn't contain any image!\n\nPlease reply to a message with an image.\n\n✨ Powered by: MISS ALIYA`,
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage(
      `❌ Please reply to an image, not a ${attachment.type}!\n\n✨ Powered by: MISS ALIYA`,
      threadID,
      messageID
    );
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage(
      `❌ Please provide an edit prompt!\n\n📝 Usage: .edit2 [prompt]\n\nExample: .edit2 make the cat blue and add sunglasses\n\n✨ Powered by: MISS ALIYA`,
      threadID,
      messageID
    );
  }

  const imageUrl = attachment.url;

  const processingMsg = await api.sendMessage(
    `🎨 Processing your image edit request...\n⏳ This may take a few moments...\n\n✨ Requested by: ${event.senderID}\n🔧 Edited by: MISS ALIYA`,
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
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'MISS ALIYA Image Editor/1.0.0'
      },
      timeout: 60000,
      validateStatus: (status) => status < 600
    });

    if (response.status === 500 && response.data?.error) {
      throw new Error(`API Error: ${response.data.error} - ${response.data.details || 'Server issue'}`);
    }

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || "API request failed or returned no data");
    }

    const resultUrl = response.data.data?.result?.url;
    if (!resultUrl) {
      throw new Error("No edited image URL returned from API");
    }

    const fileName = `edit2_${Date.now()}.png`;
    const filePath = path.join(cacheDir, fileName);
    
    const imageResponse = await axios({
      url: resultUrl,
      method: "GET",
      responseType: "stream",
      timeout: 60000,
      headers: {
        'User-Agent': 'MISS ALIYA Image Editor/1.0.0'
      }
    });

    const writer = fs.createWriteStream(filePath);
    imageResponse.data.pipe(writer);

    writer.on("finish", () => {
      api.unsendMessage(processingMsg.messageID);

      api.sendMessage(
        {
          body: `✨ Image edited successfully!\n\n📝 Prompt: ${prompt}\n🎨 Powered by: MISS ALIYA\n⚡ Edited via NanoBanana AI\n\n💾 Image saved!`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        messageID
      );
    });

    writer.on("error", (err) => {
      console.error("Error downloading edited image:", err);
      api.unsendMessage(processingMsg.messageID);
      api.sendMessage(
        `❌ Failed to download the edited image. Please try again.\n\n✨ Powered by: MISS ALIYA`,
        threadID,
        messageID
      );
    });

  } catch (error) {
    console.error("Error in edit2 command:", error);
    api.unsendMessage(processingMsg.messageID);
    
    let errorMessage = `❌ An error occurred while editing the image.\n\n✨ Powered by: MISS ALIYA`;
    
    if (error.message.includes('ENOSPC')) {
      errorMessage = `❌ API server is full (disk space error). Please try again later.\n\n✨ Powered by: MISS ALIYA`;
    } else if (error.response?.status === 500) {
      errorMessage = `❌ API server error (500). Service down.\n\n✨ Powered by: MISS ALIYA`;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = `❌ Request timeout. The AI took too long to respond.\n\n✨ Powered by: MISS ALIYA`;
    } else if (error.message) {
      errorMessage += `\n\n📌 Error: ${error.message}`;
    }
    
    api.sendMessage(errorMessage, threadID, messageID);
  }
};