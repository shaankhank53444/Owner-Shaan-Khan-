const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "suno",
  version: "5.1.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Interactive AI Audio Generator (Fixed Gender Voice)",
  commandCategory: "AI Music",
  usages: "suno",
  cooldowns: 10
};

const API_KEYS = [
  'Koja-64118e456c1d20ec4b75a9914ec70f6a',
  'Koja-3ce2fd6170ea41e13acf3e7e347a5719',
  'Koja-096a3b8e8046783b1b59643a548ae35d'
];

const BASE_URL = 'https://kojaxd-api.vercel.app/ai/sunoai';

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  return api.sendMessage(
    "📝 **Step 1:** Apne gaane ke **Custom Lyrics** likhein:",
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        step: 1,
        name: this.config.name,
        author: senderID,
        messageID: info.messageID
      });
    },
    messageID
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  const cachePath = path.join(__dirname, "cache");
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

  try {
    // --- STEP 1: Lyrics milne par Gender puchna ---
    if (handleReply.step === 1) {
      return api.sendMessage(
        "🎙️ **Step 2:** Voice choose karein:\n\n1. Male (Mardana Awaaz) 👨\n2. Female (Zanana Awaaz) 👩",
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            step: 2,
            name: this.config.name,
            author: senderID,
            lyrics: body,
            messageID: info.messageID
          });
        },
        messageID
      );
    }

    // --- STEP 2: Gender fix karne ka naya logic ---
    if (handleReply.step === 2) {
      // Is logic se AI ko clear instruction jayegi
      let genderTag = "";
      let genderDisplay = "";

      if (body == "2" || body.toLowerCase().includes("female")) {
        genderTag = "Female Vocalist, Woman's Voice, Clear Female Vocals"; // Strong tags for Female
        genderDisplay = "Female 👩";
      } else {
        genderTag = "Male Vocalist, Man's Voice, Masculine Vocals"; // Strong tags for Male
        genderDisplay = "Male 👨";
      }

      return api.sendMessage(
        `✅ Voice set to: ${genderDisplay}\n\n🎸 **Step 3:** Music ka **Style** batayein? (Classic, Hip Hop, Pop, Rock, etc.)`,
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            step: 3,
            name: this.config.name,
            author: senderID,
            lyrics: handleReply.lyrics,
            genderTag: genderTag,
            genderDisplay: genderDisplay,
            messageID: info.messageID
          });
        },
        messageID
      );
    }

    // --- STEP 3: Style receive karna ---
    if (handleReply.step === 3) {
      return api.sendMessage(
        "🏷️ **Step 4:** Apne Song ka **Title (Naam)** kya rakhna hai?",
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            step: 4,
            name: this.config.name,
            author: senderID,
            lyrics: handleReply.lyrics,
            genderTag: handleReply.genderTag,
            genderDisplay: handleReply.genderDisplay,
            style: body,
            messageID: info.messageID
          });
        },
        messageID
      );
    }

    // --- STEP 4: Audio Generation with Forced Gender Tags ---
    if (handleReply.step === 4) {
      const title = body;
      const { lyrics, genderTag, style, genderDisplay } = handleReply;

      // Yahan hum Style aur Gender ko merge kar rahe hain taake AI ignore na kar sake
      const finalStylePrompt = `${style}, ${genderTag}`;

      api.sendMessage(`⏳ Processing Masterpiece...\n\n🎵 Title: ${title}\n🎙️ Voice: ${genderDisplay}\n🎸 Style: ${style}\n\nAI abhi aapka gaana bana raha hai...`, threadID, messageID);

      const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
      const createUrl = `${BASE_URL}?apikey=${apiKey}&action=create&prompt=${encodeURIComponent(lyrics)}&style=${encodeURIComponent(finalStylePrompt)}&title=${encodeURIComponent(title)}`;

      const createRes = await axios.get(createUrl);
      if (!createRes.data.status) throw new Error("API Limit reached!");

      const taskId = createRes.data.task_id;
      let audioUrl = null;

      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const statusRes = await axios.get(`${BASE_URL}?apikey=${apiKey}&action=status&task_id=${taskId}`);
        const data = statusRes.data.result?.[0]?.data?.data?.[0] || statusRes.data.result?.[0];

        if (data && data.audioUrl) {
          audioUrl = data.audioUrl;
          break;
        }
      }

      if (!audioUrl) return api.sendMessage("❌ Timeout error! Dubara try karein.", threadID, messageID);

      const filePath = path.join(cachePath, `suno_${Date.now()}.mp3`);
      const response = await axios({ method: 'get', url: audioUrl, responseType: 'arraybuffer' });
      await fs.writeFile(filePath, Buffer.from(response.data));

      return api.sendMessage({
        body: `🎶 **Suno AI Audio Generated**\n\n🎼 Title: ${title}\n🎭 Genre: ${style}\n🎙️ Vocal: ${genderDisplay}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    }

  } catch (error) {
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};