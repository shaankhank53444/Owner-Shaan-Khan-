Module.exports.config = {
  name: 'autosent',
  version: '11.1',
  hasPermssion: 0,
  credits: 'SHAAN-KHAN',
  description: 'Set Karne Ke Bad Automatically Har Ghante Live Date, Time, Day aur Shayari Send Karega',
  commandCategory: 'group messenger',
  usages: '[]',
  cooldowns: 3
};

// 24 Hours Shayari List indexed by hour (0 to 23)
const shayariList = {
  0: "رات کی خاموشی میں بھی ایک الگ شادابی ہے،\nسو جاؤ کہ کل کا سورج ایک نیا موڑ لائے گا۔",
  1: "خاموشیوں کے شَہر میں اُمید کا چراغ جلا،\nاندھیری رات ہی میں تو راستہ صاف نظر آتا ہے۔",
  2: "جب ہر طرف تنہائی ہو تو خدا یاد آتا ہے،\nوہی تو ہے جو سچے دل کی ہر بات سنتا ہے۔",
  3: "محنت اور صبر کا دامن کبھی مت چھوڑنا،\nکیونکہ سچی لگن ہی انسان کو منزل تک پہنچاتی ہے۔",
  4: "صبح کا نور اب جلد پھیلنے والا ہے،\nہر نئی صبح ایک نیا موقع ساتھ لاتی ہے۔",
  5: "اذان کا وقت اور نیکیوں کی طلب،\nخدا کی بارگاہ میں ہر دعا قبول ہوتی ہے۔",
  6: "صبح بخیر! ایک نئی مسکراہٹ کے ساتھ دن کا آغاز کریں،\nخود پر یقین ہی کامیابی کی پہلی سیڑھی ہے۔",
  7: "روشنی پھیلی ہے چاروں طرف امید بن کر،\nہر لمحہ جی لو خوشی کی دھن بن کر۔",
  8: "زندگی میں آگے بڑھنے کا سفر شروع کیجیے،\nجو لوگ محنت کرتے ہیں، کامیابی ان کے قدم چومتی ہے۔",
  9: "اپنے کام پر توجہ دو اور محنت جاری رکھو،\nوقت بدلے گا اور تمہارا دور آئے گا۔",
  10: "ہمیشہ دوسروں کے کام آنے کی کوشش کرو،\nخلوصِ دل سے کی گئی نیکی کبھی ضائع نہیں ہوتی۔",
  11: "زندگی کے ہر لمحے کو خوبصورتی سے جیو،\nیہ وقت دوبارہ لوٹ کر کبھی نہیں آئے گا۔",
  12: "دوپہر کا وقت ہے تھوڑا آرام بھی ضروری ہے،\nصحت اور سکون ہی زندگی کی سچی دولت ہے۔",
  13: "حق اور سچائی کا راستہ ہمیشہ مشکل ہوتا ہے،\nلیکن اسی راستے پر عزت اور کامیابی ملتی ہے۔",
  14: "مشکلات سے گھبرانا کیسا،\nہر مشکل کے بعد آسانیاں مسکراتی ہیں۔",
  15: "خواب وہ نہیں جو ہم سوتے ہوئے دیکھتے ہیں،\nخواب وہ ہیں جو ہمیں سونے نہیں دیتے!🕊️",
  16: "شام کا وقت اور ایک پیالی چائے،\nزندگی کی سادہ سی چیزوں میں بھی سکون ہے۔",
  17: "سورج کے ڈھلنے میں بھی اک ادا ہے،\nدن بھر کی تھکن اب ختم ہونے کو ہے۔",
  18: "شام کا منظر کتنا دلکش ہوتا ہے،\nاپنوں کے ساتھ مل بیٹھو اور خوشیاں بانٹو۔",
  19: "رات کی آمد اور پرسکون ماحول،\nخدا کا شکر ادا کرو ہر نعمت کے لیے۔",
  20: "آج کا کام آج ہی ختم کیجیے،\nکل کے دن کو ایک نئی شروعات دیجیے۔",
  21: "اپنے دل کو صاف رکھو اور سب کو معاف کر دو،\nخدا بھی انہی کو پسند کرتا ہے جو دل کے صاف ہوں۔",
  22: "رات گہری ہو چکی ہے اور تاروں کی چمک،\nایک نئے کل کا حسین پیغام دے رہی ہے۔",
  23: "دن بھر کی تھکن کو اب بھول جاؤ،\nمیٹھے خوابوں کے ساتھ سکون کی نیند سو جاؤ۔"
};

let lastSentHour = -1;

module.exports.onLoad = function ({ api }) {
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Get current hour (0 - 23) in Pakistan Timezone
      const optionsTime = { timeZone: "Asia/Karachi", hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
      const timeFormatter = new Intl.DateTimeFormat('en-US', { timeZone: "Asia/Karachi", hour: 'numeric', hour12: false });
      const currentHour24 = parseInt(timeFormatter.format(now), 10);

      // Check if minute is 00 so it triggers right at the start of every new hour, and hasn't been sent for this hour yet
      const minuteFormatter = new Intl.DateTimeFormat('en-US', { timeZone: "Asia/Karachi", minute: 'numeric' });
      const currentMinute = parseInt(minuteFormatter.format(now), 10);

      if (currentMinute === 0 && lastSentHour !== currentHour24) {
        lastSentHour = currentHour24;

        // Formatted Display Time (12-hour with AM/PM)
        const displayTime = now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Karachi",
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Formatted Date (D/Month/YYYY)
        const dayNum = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", day: 'numeric' });
        const monthStr = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", month: 'long' });
        const yearStr = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", year: 'numeric' });
        const formattedDate = `${dayNum}/${monthStr}/${yearStr}`;

        // Formatted Day (e.g. Jumma, Shanwar, etc.)
        const displayDay = now.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", weekday: 'long' });

        // Get Shayari based on 24-hour index
        const shayari = shayariList[currentHour24] || "زندگی ایک خوبصورت سفر ہے، اسے ہنس کر جیو!";

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
    } catch (e) {
      console.error("Autosent error:", e);
    }
  }, 10000); // Check every 10 seconds reliably
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\nAutoSent command active hai! Yeh ab bilkul theek logic ke sath har ghante auto-message send karega.", event.threadID, event.messageID);
};
