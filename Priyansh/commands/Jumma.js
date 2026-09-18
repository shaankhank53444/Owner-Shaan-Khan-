const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "jumma",
  version: "2.0.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Jumma par random Islamic messages aur HD photos bhejta hai owner tag ke sath",
  commandCategory: "islamic",
  usages: "[jumma / juma / jumma mubarak]",
  cooldowns: 2
};

module.exports.handleEvent = async function({ api, event }) {
  if (!event || !event.body) return;

  const text = event.body.toLowerCase().trim();
  const keywords = ["jumma", "jammu", "jumma mubarak", "jammu mubarak", "juma", "juma mubarak"];

  if (keywords.includes(text)) {
    // Owner Tag String
    const ownerTag = "\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

    // High Quality Islamic Image URLs
    const images = [
      "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590076175571-4b5459efb08c?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=1000&auto=format&fit=crop"
    ];

    // Array of Random Messages
    const messages = [
      `✨ **سُورَةُ الجمعة (Surah Al-Jumu'ah)** ✨
    
﷽

1️⃣ يُسَبِّحُ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ الْمَلِكِ الْقُدُّوسِ الْعَزِيزِ الْحَكِيمِ
✨ *ترجمہ:* جو چیز آسمانوں میں ہے اور جو چیز زمین میں ہے سب اللہ کی تسبیح کرتی ہے جو بادشاہ، پاک ذات، زبردست اور حکمت والا ہے۔

9️⃣ يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ ۚ ذَٰلِكُمْ خَيْرٌ لَّكُمْ إِن كُنتُمْ تَعْلَمُونَ
✨ *ترجمہ:* اے ایمان والو! جب جمعہ کے دن نماز کے لیے اذان دی جائے تو اللہ کے ذکر کی طرف دوڑو اور خرید و فروخت چھوڑ دو، یہ تمہارے لیے بہتر ہے اگر تم جانتے ہو۔

---
❤️ **جمعہ مبارک!** اللہ تعالیٰ آپ کی تمام دعائیں قبول فرمائے۔ (آمین)`,

      `✨ **جمعہ کی فضیلت (حدیثِ مبارکہ)** ✨

رسول اللہ ﷺ نے فرمایا:
"بہترین دن جس پر سورج طلوع ہوا جمعہ کا دن ہے، اسی دن آدم علیہ السلام پیدا ہوئے، اسی دن جنت میں داخل کیے گئے اور اسی دن جنت سے نکالے گئے، اور قیامت بھی جمعہ کے دن ہی قائم ہوگی۔" *(صحیح مسلم)*

---
🌸 **جمعہ مبارک!** اللہ آپ کو اور آپ کے گھر والوں کو خوش رکھے۔`,

      `✨ **درود شریف کی فضیلت** ✨

نبی کریم ﷺ نے فرمایا:
"جمعہ کے دن مجھ پر کثرت سے درود بھیجا کرو، کیونکہ تمہارا درود مجھ پر پیش کیا جاتا ہے۔"

اَللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ 💚

---
💐 **جمعہ مبارک!** آج کے دن درود شریف پڑھنا نہ بھولیں۔`,

      `✨ **جمعہ کے دن کی مسنون سنتیں** ✨

1️⃣ غسل کرنا
2️⃣ اچھے اور صاف کپڑے پہننا
3️⃣ خوشبو (عطر) لگانا
4️⃣ جمعہ کی نماز کے لیے جلدی جانا
5️⃣ سورۃ الکہف کی تلاوت کرنا
6️⃣ کثرت سے درود شریف پڑھنا

---
🌺 **جمعہ مبارک!** ان سنتوں پر عمل کرنے کی توفیق عطا فرمائے۔`,

      `✨ **جمعہ کی خوبصورت دعا** ✨

"یا اللہ! اس مبارک جمعہ کے صدقے ہمارے تمام گناہ معاف فرما، ہماری پریشانیوں کو دور فرما، مریضوں کو شفا عطا کر اور تمام مسلمان امت پر اپنا خصوصاً رحم و کرم نازل فرما۔"

آمین یا رب العالمین 🤲

---
🕌 **جمعہ مبارک!** دعاؤں میں یاد رکھئے گا۔`
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)] + ownerTag;
    const randomImgUrl = images[Math.floor(Math.random() * images.length)];
    
    // Path for temporary image save
    const imgPath = path.join(__dirname, "cache", `jumma_${event.senderID}.jpg`);

    try {
      // Ensure cache directory exists
      await fs.ensureDir(path.join(__dirname, "cache"));

      // Download image buffer and write to cache
      const imageResponse = await axios.get(randomImgUrl, { responseType: "arraybuffer" });
      await fs.writeFile(imgPath, Buffer.from(imageResponse.data, "utf-utf8"));

      // Send Message with Local File Attachment
      return api.sendMessage(
        {
          body: randomMsg,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => fs.unlinkSync(imgPath), // Delete temporary file after sending
        event.messageID
      );
    } catch (e) {
      // Fallback text if download/fs fails
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      return api.sendMessage(randomMsg, event.threadID, event.messageID);
    }
  }
};

module.exports.run = async function({ api, event }) {
  const cloneEvent = { ...event, body: "jumma" };
  return this.handleEvent({ api, event: cloneEvent });
};
