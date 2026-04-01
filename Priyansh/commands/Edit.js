const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "edit",
  version: "2.5.0",
  hasPermssion: 0,
  credits: "Raza Engineering",
  description: "AI Image Editor - GitHub Optimized",
  commandCategory: "AI Tools",
  usages: "reply to an image with: edit [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;
  const prompt = args.join(" ").trim();

  if (!prompt) return api.sendMessage("❌ Prompt likhein! (Example: edit make it a painting)", threadID, messageID);
  
  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Kisi photo ko reply karein.", threadID, messageID);
  }

  const cacheDir = path.join(process.cwd(), "cache");
  const editedPath = path.join(cacheDir, `edited_${Date.now()}.png`);

  try {
    // GitHub environment mein folder create karna zaroori hai
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
    
    api.sendMessage("🎨 AI processing start ho rahi hai... Powered by: Shaan Khan. ✅", threadID, messageID);

    // Step 1: Direct Image URL from Facebook
    const inputImageUrl = messageReply.attachments[0].url;

    // Step 2: ImgBB Upload (Alternative Method)
    // Agar 500 error aaye toh ho sakta hai aapki API Key block ho.
    // Aap https://api.imgbb.com/ se apni new key le kar yahan paste karein.
    const apiKey = 'e17a15dd6af452cbe53747c0b2b0866d'; 
    
    const imgResponse = await axios.get(inputImageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imgResponse.data).toString('base64');
    
    const body = new URLSearchParams();
    body.append('image', base64Image);

    const upload = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, body);
    const uploadedUrl = upload.data.data.url;

    // Step 3: Call Nano-Banana API
    const apiUrl = `https://api.kraza.qzz.io/imagecreator/nanobanana?imageUrl=${encodeURIComponent(uploadedUrl)}&prompt=${encodeURIComponent(prompt)}`;
    
    // GitHub servers slow ho sakte hain, isliye 3 minutes ka timeout rakha hai
    const response = await axios.get(apiUrl, { timeout: 180000 });

    if (!response.data || !response.data.status || !response.data.result?.image) {
       return api.sendMessage(`❌ API Error: ${response.data.message || "Server didn't respond"}`, threadID, messageID);
    }

    // Step 4: Download Result and Send
    const finalImage = await axios.get(response.data.result.image, { responseType: 'arraybuffer' });
    fs.writeFileSync(editedPath, Buffer.from(finalImage.data));

    return api.sendMessage({
      body: `✅ Edited by Nano-Banana AI\n📝 Prompt: ${prompt}`,
      attachment: fs.createReadStream(editedPath)
    }, threadID, () => {
      if (fs.existsSync(editedPath)) fs.unlinkSync(editedPath);
    }, messageID);

  } catch (error) {
    if (fs.existsSync(editedPath)) fs.unlinkSync(editedPath);
    console.error("DEBUG ERROR:", error.response?.data || error.message);
    
    let msg = "❌ Error 500: API Server busy hai.";
    if (error.message.includes("403")) msg = "❌ Error 403: GitHub IP Blocked by API.";
    if (error.message.includes("400")) msg = "❌ Error 400: ImgBB Key expired or Image too large.";
    
    return api.sendMessage(`${msg}\n\nDetail: ${error.message}`, threadID, messageID);
  }
};
