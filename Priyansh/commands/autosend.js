const axios = require('axios');

module.exports.config = {
  name: "hourlytime",
  version: "7.4.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "24-Hour Fresh Urdu Poetry with New Stylish Design.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 0,
};

const shayariList = [
  /* 00 (12 AM) */ "رات آئی ہے تو پھر یاد تیری آئی ہے 🌌 انجمن میں بھی وہی عالمِ تنہائی ہے 🥀",
  /* 01 (1 AM)  */ "نیند سے کیا واسطہ اب ہم کو 🌠 تری یاد میں جاگنا ہی مقدر بن گیا ہے 💎",
  /* 02 (2 AM)  */ "خواب بن کر ہی سہی آ تو سہی 😴 میری اجڑی ہوئی نیندوں کو سجا تو سہی 💤",
  /* 03 (3 AM)  */ "تہجد کی خاموشی اور تیری یاد کا سماں 🕯️ مانگا ہے رب سے تجھے کر کے سجدہ یہاں 🤲",
  /* 04 (4 AM)  */ "سحر ہونے کو ہے اور دل اب بھی بے چین ہے ✨ تارے چھپ گئے پر تیرا عکس ابھی باقی ہے 🌅",
  /* 05 (5 AM)  */ "صبح کا نور فضاؤں میں بکھرنے لگا ☀️ رب کی رحمت کا دریا دل میں اترنے لگا 🕋",
  /* 06 (6 AM)  */ "تازہ ہوا اور پرندوں کی چہکار کے ساتھ 🦜 اک نئی شروعات ہو تیرے پیار کے ساتھ 🌹",
  /* 07 (7 AM)  */ "سورج کی پہلی کرن تجھ کو سلام کہے 🌸 تیرا ہر دن خوشیوں کے نام رہے ✨",
  /* 08 (8 AM)  */ "چائے کی چسکی اور تیری یادوں کا جادو ☕ دل پہ رہتا نہیں اب اپنا کوئی قابو 😊",
  /* 09 (9 AM)  */ "دن چڑھ گیا ہے اب کام کی باری ہے 🌻 پر دل میں اب بھی تیری ہی یادوں کی سواری ہے 👨‍👩‍👧‍👦",
  /* 10 (10 AM) */ "تیری سادگی پہ مرتے ہیں ہم اے ہمسفر 👸 جیسے چائے میں سانولا پن اور اس کا اثر ☕",
  /* 11 (11 AM) */ "دھوپ کی حدت میں سایہ ہے تیری یاد 📜 تپتے صحرا میں گویا ایک دعا ہے تیری یاد 🤲",
  /* 12 (12 PM) */ "دوپہر کی خاموشی میں تیرا خیال آتا ہے ☀️ جیسے پیاسے کو ٹھنڈے جام کا سوال آتا ہے 🍱",
  /* 13 (1 PM)  */ "مسکراہٹیں بانٹتے چلو اس جہاں میں 😊 رب کی رضا ہے بس دوسروں کے کام آنے میں 🌈",
  /* 14 (2 PM)  */ "قسمت کی لکیروں میں تجھے ڈھونڈ لیتے ہیں 💍 ہم ہر دعا میں بس تیرا ساتھ مانگ لیتے ہیں 🔐",
  /* 15 (3 PM)  */ "شام ہونے کو ہے اور موسم بڑا سہانہ ہے 🎇 بس تجھے ایک نظر جی بھر کے دیکھنا ہے 💖",
  /* 16 (4 PM)  */ "عصر کی اذانیں دل کو سکون دیتی ہیں ✨ جیسے تیری باتیں روح کو جلا دیتی ہیں 🔒",
  /* 17 (5 PM)  */ "ڈوبتا سورج اک نیا پیغام لاتا ہے 🌇 کہ ہر مشکل کے بعد ہی سویرا آتا ہے ✨",
  /* 18 (6 PM)  */ "مغرب کا وقت اور تیری یاد کا غلبہ 🥀 دل دھڑکتا ہے تو سنائی دیتا ہے تیرا ہی نام 🏹",
  /* 19 (7 PM)  */ "شام کی تنہائی میں چراغِ وفا جلائیں گے 🌕 ہم تیرے بن اب جی کر کیا پائیں گے 💞",
  /* 20 (8 PM)  */ "عشاء کا سکون اور دل کی یہ پکار ✨ الٰہی! سلامت رہے میرا وہ یار 👑",
  /* 21 (9 PM)  */ "ستاروں کی محفل اور چاند کی چاندنی ✨ تو ہے میرے خوابوں کی سچی راجدھانی 💎",
  /* 22 (10 PM) */ "وفا کا عہد ہے اور سانسوں کی ڈوری 💖 تیرے بغیر ادھوری ہے میری ہر اک سٹوری 🗝️",
  /* 23 (11 PM) */ "اب سو جائیں کہ کل پھر سے جی اٹھنا ہے 😴 رب کے ذکر کے ساتھ میٹھے سپنوں میں کھونا ہے 🌃"
];

let lastSentHour = null;

const sendHourlyMessages = async (api) => {
  try {
    const localTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const currentHour = localTime.getHours();
    const minutes = localTime.getMinutes();

    if (minutes !== 0 || lastSentHour === currentHour) return;
    lastSentHour = currentHour;

    const hour12 = currentHour % 12 || 12;
    const ampm = currentHour >= 12 ? "PM" : "AM";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const currentPoetry = shayariList[currentHour];

    const message = `❁ ━━━━━[ 𝑻𝑰𝑴𝑬 ]━━━━━ ❁\n\n` +
      `✰🌸 𝑻𝑰𝑴𝑬 ➪ ${hour12}:00 ${ampm} ⏰\n` +
      `✰🌸 𝑫𝑨𝑻𝑬 ➪ ${localTime.getDate()} ${months[localTime.getMonth()]} ${localTime.getFullYear()} 📆\n` +
      `✰🌸 𝑫𝑨𝒀 ➪ ${days[localTime.getDay()]} ⏳\n\n` +
      `${currentPoetry}\n\n` +
      `❁━━━━[ ♡♡❈♡♡ ]━━━━ ❁...!!\n` +
      `》˞𝐎𝐖𝐍𝐄𝐑 《\n` +
      `  ➥【🩷𓆩𝐒𝐇𝐀𝐀𝐍𓆪 🩷】\n\n` +
      `❁ ━━ ❃𝗦𝗛𝗔𝗔𝗡-𝗞𝗛𝗔𝗡❃ ━━ ❁`;

    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    const activeGroups = threadList.filter(t => (t.threadType === 2 || t.isGroup === true) && t.isSubscribed);

    for (const group of activeGroups) {
      try {
        await api.sendMessage(message, group.threadID);
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    }
  } catch (err) {
    console.log("Error: " + err.message);
  }
};

module.exports.handleEvent = async ({ api }) => {
  if (!global.isHourlyLoopStarted) {
    global.isHourlyLoopStarted = true;
    setInterval(() => sendHourlyMessages(api), 60000);
  }
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage("✅ Hourly System Updated with New Poetry & Look!", event.threadID);
};
