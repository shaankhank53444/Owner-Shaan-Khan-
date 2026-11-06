Module.exports.config = {
  name: 'autosent',
  version: '11.0',
  hasPermssion: 0,
  credits: 'SHAAN-KHAN',
  description: 'Set Karne Ke Bad Automatically Har Ghante Live Date, Time, Day aur Shayari Send Karega',
  commandCategory: 'group messenger',
  usages: '[]',
  cooldowns: 3
};

const nam = {
  "12:00:00 AM": "رات کی خاموشی میں بھی ایک الگ شادابی ہے،\nسو جاؤ کہ کل کا سورج ایک نیا موڑ لائے گا۔",
  "01:00:00 AM": "خاموشیوں کے شَہر میں اُمید کا چراغ جلا،\nاندھیری رات ہی میں تو راستہ صاف نظر آتا ہے۔",
  "02:00:00 AM": "جب ہر طرف تنہائی ہو تو خدا یاد آتا ہے،\nوہی تو ہے جو سچے دل کی ہر بات سنتا ہے۔",
  "03:00:00 AM": "محنت اور صبر کا دامن کبھی مت چھوڑنا،\nکیونکہ سچی لگن ہی انسان کو منزل تک پہنچاتی ہے۔",
  "04:00:00 AM": "صبح کا نور اب جلد پھیلنے والا ہے،\nہر نئی صبح ایک نیا موقع ساتھ لاتی ہے۔",
  "05:00:00 AM": "اذان کا وقت اور نیکیوں کی طلب،\nخدا کی بارگاہ میں ہر دعا قبول ہوتی ہے۔",
  "06:00:00 AM": "صبح بخیر! ایک نئی مسکراہٹ کے ساتھ دن کا آغاز کریں،\nخود پر یقین ہی کامیابی کی پہلی سیڑھی ہے۔",
  "07:00:00 AM": "روشنی پھیلی ہے چاروں طرف امید بن کر،\nہر لمحہ جی لو خوشی کی دھن بن کر۔",
  "08:00:00 AM": "زندگی میں آگے بڑھنے کا سفر شروع کیجیے،\nجو لوگ محنت کرتے ہیں، کامیابی ان کے قدم چومتی ہے۔",
  "09:00:00 AM": "اپنے کام پر توجہ دو اور محنت جاری رکھو،\nوقت بدلے گا اور تمہارا دور آئے گا۔",
  "10:00:00 AM": "ہمیشہ دوسروں کے کام آنے کی کوشش کرو،\nخلوصِ دل سے کی گئی نیکی کبھی ضائع نہیں ہوتی۔",
  "11:00:00 AM": "زندگی کے ہر لمحے کو خوبصورتی سے جیو،\nیہ وقت دوبارہ لوٹ کر کبھی نہیں آئے گا۔",
  "12:00:00 PM": "دوپہر کا وقت ہے تھوڑا آرام بھی ضروری ہے،\nصحت اور سکون ہی زندگی کی سچی دولت ہے۔",
  "01:00:00 PM": "حق اور سچائی کا راستہ ہمیشہ مشکل ہوتا ہے،\nلیکن اسی راستے پر عزت اور کامیابی ملتی ہے۔",
  "02:00:00 PM": "مشکلات سے گھبرانا کیسا،\nہر مشکل کے بعد آسانیاں مسکراتی ہیں۔",
  "03:00:00 PM": "خواب وہ نہیں جو ہم سوتے ہوئے دیکھتے ہیں،\nخواب وہ ہیں جو ہمیں سونے نہیں دیتے!🕊️",
  "04:00:00 PM": "شام کا وقت اور ایک پیالی چائے،\nزندگی کی سادہ سی چیزوں میں بھی سکون ہے۔",
  "05:00:00 PM": "سورج کے ڈھلنے میں بھی اک ادا ہے،\nدن بھر کی تھکن اب ختم ہونے کو ہے۔",
  "06:00:00 PM": "شام کا منظر کتنا دلکش ہوتا ہے،\nاپنوں کے ساتھ مل بیٹھو اور خوشیاں بانٹو۔",
  "07:00:00 PM": "رات کی آمد اور پرسکون ماحول،\nخدا کا شکر ادا کرو ہر نعمت کے لیے۔",
  "08:00:00 PM": "آج کا کام آج ہی ختم کیجیے،\nکل کے دن کو ایک نئی شروعات دیجیے۔",
  "09:00:00 PM": "اپنے دل کو صاف رکھو اور سب کو معاف کر دو،\nخدا بھی انہی کو پسند کرتا ہے جو دل کے صاف ہوں۔",
  "10:00:00 PM": "رات گہری ہو چکی ہے اور تاروں کی چمک،\nایک نئے کل کا حسین پیغام دے رہی ہے۔",
  "11:00:00 PM": "دن بھر کی تھکن کو اب بھول جاؤ،\nمیٹھے خوابوں کے ساتھ سکون کی نیند سو جاؤ۔"
};

let lastSentTime = "";

module.exports.onLoad = function ({ api }) {
  setInterval(async () => {
    const now = new Date();
    
    // Time format for matching (hh:mm:ss AM/PM)
    const timeString = now.toLocaleTimeString("en-US", {
      timeZone: "Asia/Karachi",
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (lastSentTime === timeString) return;

    if (nam[timeString]) {
      lastSentTime = timeString;

      // Formatting Date, Time and Day dynamically for Pakistan Timezone
      const displayTime = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Karachi",
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const optionsDate = { timeZone: "Asia/Karachi", day: 'numeric', month: 'long', year: 'numeric' };
      const displayDate = now.toLocaleDateString("en-US", optionsDate).replace(/,/, ''); // e.g., November 6 2026 -> 6/November/2026 style conversion if needed, or standard clean format
      
      // Custom date format generator: D/Month/YYYY
      const dayNum = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", day: 'numeric' });
      const monthStr = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", month: 'long' });
      const yearStr = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", year: 'numeric' });
      const formattedDate = `${dayNum}/${monthStr}/${yearStr}`;

      const displayDay = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", weekday: 'long' });

      // Shayari text for the current hour
      const shayari = nam[timeString];

      const finalMessage = `❁━━━━━【 𝗧𝗜𝗠𝗘 】━━━━━❁\n` +
                           `𝗧𝗜𝗠𝗘 ➪ ${displayTime}\n` +
                           `𝗗𝗔𝗧𝗘 ➪ ${formattedDate}\n` +
                           `𝗗𝗔𝗬 ➪ ${displayDay}\n\n\n` +
                           `「📝 𝗦𝗛𝗔𝗬𝗔𝗥𝗜 」\n` +
                           `${shayari}\n\n` +
                           `❁━━━━【 𝐎𝐖𝐍𝐄𝐑: 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵 】━━━━❁`;

      const allThreads = global.data.allThreadID || [];

      for (const threadID of allThreads) {
        api.sendMessage(finalMessage, threadID, (err) => {
          if (err) console.error(`Failed to send to ${threadID}:`, err);
        });
      }
    }
  }, 1000);
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\nAutoSent command active hai! Yeh har ghante live Date, Time, Day aur new Shayari automatic send karega.", event.threadID, event.messageID);
};
