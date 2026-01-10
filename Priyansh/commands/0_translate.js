const axios = require("axios");

module.exports.config = {
  name: "trance",
  version: "1.0.4",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Image se text nikal kar auto-translate karta hai (Hindi/Urdu/English)",
  commandCategory: "utility",
  usages: "reply to an image",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const OCR_API_KEY = "K82167305688957";

  try {
    // Check if reply contains an image
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments[0].type !== "photo") {
      return api.sendMessage(
        "❌ Please reply to an image/screenshot to extract and translate text.",
        event.threadID
      );
    }

    const imgUrl = event.messageReply.attachments[0].url;
    api.sendMessage("✅ Processing image, please wait...", event.threadID);

    // 1. OCR - Extract text from Image
    const ocrRes = await axios.get(
      `https://api.ocr.space/parse/imageurl?apikey=${OCR_API_KEY}&language=eng&url=${encodeURIComponent(imgUrl)}`
    );

    const extractedText = ocrRes.data?.ParsedResults?.[0]?.ParsedText;

    if (!extractedText || !extractedText.trim()) {
      return api.sendMessage("❌ Image mein koi readable text nahi mila.", event.threadID);
    }

    // Helper function for Google Translate
    const translate = async (text, targetLang) => {
      const res = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      return {
        text: res.data[0].map(i => i[0]).join(""),
        detectedSrc: res.data[2] // This gets the auto-detected source language
      };
    };

    // 2. Perform Translations
    const transHi = await translate(extractedText, "hi");
    const transUr = await translate(extractedText, "ur");
    const transEn = await translate(extractedText, "en");

    const sourceLang = transHi.detectedSrc; // Detected language code (e.g., 'hi', 'ur', 'en')

    let responseMsg = `📝 **EXTRACTED TEXT:**\n${extractedText}\n\n--- TRANSLATIONS ---\n\n`;

    // 3. Logic: Show relevant translations based on source
    // Agar text Urdu hai (ur), to Hindi aur English dikhao
    if (sourceLang === "ur") {
      responseMsg += `🇮🇳 **Hindi:**\n${transHi.text}\n\n🇬🇧 **English:**\n${transEn.text}`;
    } 
    // Agar text Hindi hai (hi), to Urdu aur English dikhao
    else if (sourceLang === "hi") {
      responseMsg += `🇵🇰 **Urdu:**\n${transUr.text}\n\n🇬🇧 **English:**\n${transEn.text}`;
    } 
    // Agar koi aur language hai (English etc), to teeno dikhao
    else {
      responseMsg += `🇮🇳 **Hindi:**\n${transHi.text}\n\n🇵🇰 **Urdu:**\n${transUr.text}\n\n🇬🇧 **English:**\n${transEn.text}`;
    }

    api.sendMessage(responseMsg, event.threadID);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error: " + err.message, event.threadID);
  }
};
