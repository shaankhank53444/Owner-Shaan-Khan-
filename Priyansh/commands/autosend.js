1111const axios = require('axios');

module.exports.config = {
  name: "hourlytime",
  version: "7.2.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "24-Hour Urdu Poetry with Stylish Owner Tag.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 0,
};

// Stylish Owner Tag
const ownerTag = " -[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂";

const shayariList = [
  /* 00 (12 AM) */ "رات کی تنہائی میں اکیلے تھے ہم 🌌 درد کی محفلوں میں رو رہے تھے ہم 🥀 اپنے رب کو یاد کرنے کے بعد ✨ پھر بھی آپ کو یاد کیے بنا سوتے نہیں ہم...!! 🌙💤" + ownerTag,
  /* 01 (1 AM)  */ "رات کو جب چاند ستارے کی یاد میں تڑپتے ہیں 🌠 آپ تو چلے جاتے ہو چھوڑ کر ہمیں 💔 ہم رات بھر تہجد اور آپ سے ملنے کو ترستے ہیں۔ 🏹💎" + ownerTag,
  /* 02 (2 AM)  */ "خوابوں کی دنیا میں کھو جانے کا وقت ہے 😴 میٹھی میٹھی نیند میں سو جانے کا وقت ہے 💤 اللہ حافظ اب کل انشاء اللہ ملاقات ہوگی۔ 🎇🌠" + ownerTag,
  /* 03 (3 AM)  */ "خاموشی کا عالم ہے اور چاروں طرف اندھیرا 🌑 یادوں کے چراغ جلا کر بیٹھے ہیں 🕯️ رب سے مانگی ہر دعا میں آپ کا نام رکھتے ہیں۔ 🥀🖤" + ownerTag,
  /* 04 (4 AM)  */ "فجر ہونے کو ہے اور تارے چھپنے والے ہیں ✨ ہم اب بھی اللہ کی عبادت اور آپ کی یاد میں جاگ رہے ہیں ⏳ ایک نئی صبح کا انتظار ہے۔ 🕊️🌅" + ownerTag,
  /* 05 (5 AM)  */ "رات نے چادر سمیٹ لی ہے 🌌 سورج نے کرنیں بکھیر دی ہیں ☀️ چلو اٹھو اور شکریہ کرو اپنے رب کا 🤲 جس نے ہمیں یہ پیاری سی صبح دی ہے...!! 🕋🌸" + ownerTag,
  /* 06 (6 AM)  */ "نہ کوئی گلہ 🤲 نہ کوئی شکوہ ✨ نہ کوئی دکھ 🌙 نہ کوئی پریشانی 🌊 صبح اٹھتے ہی پہلا کام، اللہ کا نام اور ایک میسج آپ کے نام...!! ☕🌹" + ownerTag,
  /* 07 (7 AM)  */ "جتنی خوبصورت یہ گلابی صبح ہے 🌸 اتنا ہی خوبصورت آپ کا ہر پل ہو ✨ اللہ کرے جتنی خوشیاں آج آپ کے پاس ہیں 💝 اس سے بھی زیادہ آنے والے کل میں ہوں....!! 🌈🌷" + ownerTag,
  /* 08 (8 AM)  */ "صبح صبح آپ کی یادوں کا ساتھ ہو ☕ میٹھی میٹھی پرندوں کی آواز ہو 🦜 آپ کے چہرے پر ہمیشہ مسکراہٹ ہو 😊 اور ہماری زندگی میں ہمیشہ خدا کی رحمت ہو...!! 💖✨" + ownerTag,
  /* 09 (9 AM)  */ "پیاری سی میٹھی سی نیندیا کے بعد 😴 رات کے حسین سپنوں کے بعد ✨ صبح کے کچھ نئے ارادوں کے ساتھ 🌻 اللہ آپ کو ہمیشہ خوش رکھے اپنوں کے ساتھ۔ 👨‍👩‍👧‍👦💕" + ownerTag,
  /* 10 (10 AM) */ "ماشاللہ بھولی سی صورت 👸 ہر بات پر سچی لگتی ہو ✨ ہاں تم ہو بالکل میری چائے کے جیسی ☕ مجھے سانولی ہی اچھی لگتی ہو… ❤️🔥" + ownerTag,
  /* 11 (11 AM) */ "آج ایک دوپہر کی دعا تیرے نام ہو جائے 📜 میرا سویرا بس تیرے نام ہو جائے ✨ رب سے مانگتا ہوں تیری سلامتی 🤲 اور یہ دن تیرے نام ہو جائے۔ ✍️💕" + ownerTag,
  /* 12 (12 PM) */ "سورج چاچو اوپر چڑھ پڑے ہیں ☀️ ظہر کا وقت ہونے والا ہے 🔥 دوپہر کا کھانا اب پیٹ کو جانا ہے 🍱 پھر تھوڑی دیر آرام کر کے سکون پانا ہے۔ 😴🏡" + ownerTag,
  /* 13 (1 PM)  */ "بنداس مسکراؤ کیا غم ہے 😊 زندگی میں ٹینشن کس کو کم ہے 📉 اللہ پر توکل رکھو میرے دوست ✨ کیونکہ مشکل کے بعد ہی آسانی ہے۔ 🎭🌈" + ownerTag,
  /* 14 (2 PM)  */ "رب سے مانگی تھی ایک دعا 💍 تجھے اپنی قسمت بناؤں ✨ خدا کرے ہم کبھی جدا نہ ہوں 💨 اور ہمیشہ ایک دوسرے کا ساتھ نبھائیں...!! 💕🔐" + ownerTag,
  /* 15 (3 PM)  */ "عرض کیا ہے.... 🎤 چائے کے کپ سے اٹھتے دھوئیں میں تیری شکل نظر آتی ہے ☕ ایسے کھو جاتے ہیں تیرے خیالوں میں 💭 اکثر میری چائے ٹھنڈی ہو جاتی ہے…...!!! ❄️💔" + ownerTag,
  /* 16 (4 PM)  */ "عصر کا وقت سہانا ہے 🎇 تجھے دل میں ہمیشہ چھپا کر رکھوں 💖 اللہ سے تجھے مانگا... 🏹 زندگی بھر کے لیے تجھے اپنا بنا کر رکھوں....!! 🔒👑" + ownerTag,
  /* 17 (5 PM)  */ "آندھی میں بھی دیئے جلا کرتے ہیں 🕯️ کانٹوں میں ہی گلاب کھلا کرتے ہیں 🌹 خوش نصیب ہوتی ہے وہ شام جس میں آپ جیسے نیک لوگ ملا کرتے ہیں۔ ✨🤝" + ownerTag,
  /* 18 (6 PM)  */ "دل سے دل کی بس یہی دعا ہے 🤲 آج پھر سے ہم کو کچھ ہوا ہے ✨ مغرب کی اذان کے ساتھ آتی ہے یاد آپ کی 🌇 لگتا ہے سچا پیار آپ سے ہی ہوا ہے۔ 💕🏹" + ownerTag,
  /* 19 (7 PM)  */ "چاند سا چہرہ دیکھنے کی اجازت دے دو 🌕 مجھے یہ شام سجانے کی اجازت دے دو ✨ اللہ کی رضا سے مانگتا ہوں تجھے ⛓️ مجھے ہمیشہ کے لیے اپنا بننے کی اجازت دے دو۔ 💞🗝️" + ownerTag,
  /* 20 (8 PM)  */ "عشاء کی نماز کے بعد سکون ملتا ہے ✨ پر آپ کی یاد کا سلسلہ چلتا رہتا ہے 💔 لوگ کہتے ہیں یہ سب مذاق ہے 🎭 پر ہمیں تو اس میں خدا کی مرضی لگتی ہے…!! 🎭😔" + ownerTag,
  /* 21 (9 PM)  */ "کوئی چاند ستارہ ہے ✨ کوئی پھول سے بھی پیارا ہے 🌹 جو ہر پل دعاؤں میں یاد آئے 💭 وہ شخص صرف تمہارا ہے....!! 💕💎" + ownerTag,
  /* 22 (10 PM) */ "بسا لے نظر میں صورت تمہاری ✨ دن رات اسی پر ہم مرتے رہیں 🏹 خدا کرے جب تک چلے یہ سانسیں ہماری 🫁 ہم بس تم سے ہی وفا کرتے رہیں !! 💖👑" + ownerTag,
  /* 23 (11 PM) */ "زندگی میں کامیابی کی منزل کے لیے 🏆 خواب ضروری ہے 💤 اور سکون کی نیند کے لیے اللہ کا ذکر 😴 تو 'سبحان اللہ' پڑھو اور سو جاؤ...!! گڈ نائٹ 🌃🌠" + ownerTag
];

let lastSentHour = null;

const sendHourlyMessages = async (api) => {
  try {
    const localTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const currentHour = localTime.getHours();
    const minutes = localTime.getMinutes();

    // Check if it's the start of the hour and hasn't been sent yet
    if (minutes !== 0 || lastSentHour === currentHour) return;
    lastSentHour = currentHour;

    const hour12 = currentHour % 12 || 12;
    const ampm = currentHour >= 12 ? "PM" : "AM";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const currentPoetry = shayariList[currentHour];

    const message = `❁ ━━━━━━━[ 𝑻𝑰𝑴𝑬 ]━━━━━━━ ❁\n\n` +
      `✰🌸 𝑻𝑰𝑴𝑬 ➪ ${hour12}:00 ${ampm} ⏰\n` +
      `✰🌸 𝑫𝑨𝑻𝑬 ➪ ${localTime.getDate()}✰${months[localTime.getMonth()]}✰${localTime.getFullYear()} 📆\n` +
      `✰🌸 𝑫𝑨𝒀 ➪ ${days[localTime.getDay()]} ⏳\n\n` +
      `${currentPoetry}\n\n` +
      `❁ ━━━━━ ❃𝐒𝐇𝐀𝐀𝐍-𝐊𝐇𝐀𝐍❃ ━━━━━ ❁`;

    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    const activeGroups = threadList.filter(t => (t.threadType === 2 || t.isGroup === true) && t.isSubscribed);

    for (const group of activeGroups) {
      try {
        await api.sendMessage(message, group.threadID);
      } catch (e) {
        console.log(`Error sending to ${group.threadID}: ${e.message}`);
      }
    }
  } catch (err) {
    console.log("Main hourly error: " + err.message);
  }
};

module.exports.handleEvent = async ({ api }) => {
  if (!global.isHourlyLoopStarted) {
    global.isHourlyLoopStarted = true;
    // Har 1 minute baad check karega ke ghanta badla ya nahi
    setInterval(() => sendHourlyMessages(api), 60000);
  }
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage("✅ Hourly System Updated!\nPoetry ab Urdu script mein automatically har ghante send hogi.", event.threadID);
};
