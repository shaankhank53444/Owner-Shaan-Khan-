const axios = require('axios');

module.exports.config = {
  name: "hourlytime",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "SHAAN SIR",
  description: "24-Hour Fixed Stylish Urdu Poetry for GROUPS ONLY.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 0,
};

const ownerTag = " -[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂";

// Note: Urdu stylish fonts can sometimes vary by device, 
// but using bold styling makes them stand out beautifully.
const shayariList = [
  /* 00 (12 AM) */ "رَات کی تَنہائی میں اکیلے تھے ہَم 🌌 دَرد کی مَحفلوں میں رو رہے تھے ہَم 🥀 آپ ہمارے بھلے ہی کچھ نہیں لگتے ✨ پِھر بھی آپ کو یاد کیے بَنا سوتے نہیں ہَم...!! 🌙💤" + ownerTag,
  /* 01 (1 AM)  */ "رَات کو جَب چاند ستارے کی یاد میں تڑپتے ہیں 🌠 آپ تو چلے جاتے ہو چھوڑ کر ہمیں 💔 ہَم رَات بَھر آپ سے مِلنے کو ترستے ہیں۔ 🏹💎" + ownerTag,
  /* 02 (2 AM)  */ "خوابوں کی دُنیا میں کھو جانے کا وَقت ہے 😴 میٹھی میٹھی نیند میں سو جانے کا وَقت ہے 💤 اللہ حافظ اب کَل ملاقات ہوگی۔ 🎇🌠" + ownerTag,
  /* 03 (3 AM)  */ "خاموشی کا عالم ہے اور چاروں طرف اندھیرا 🌑 یادوں کے چراغ جلا کر بیٹھے ہیں 🕯️ کاش آپ اِس وَقت ہمارے پاس ہوتے۔ 🥀🖤" + ownerTag,
  /* 04 (4 AM)  */ "سَحَر ہونے کو ہے اور تارے چھپنے والے ہیں ✨ ہَم اب بھی آپ کی یاد میں جاگ رہے ہیں ⏳ ایک نئی صُبح کا اِنتظار ہے۔ 🕊️🌅" + ownerTag,
  /* 05 (5 AM)  */ "رَات نے چادر سمیٹ لی ہے 🌌 سورج نے کِرنیں بکھیر دی ہیں ☀️ چلو اٹھو اور شکریہ کرو اپنے رَب کو 🤲 جس نے ہمیں یہ پیاری سی صُبح دی ہے...!! 🕋🌸" + ownerTag,
  /* 06 (6 AM)  */ "نہ مَندر 🛕 نہ بھگوان ✨ نہ پوجا 🤲 نہ اشنان 🌊 صُبح اٹھتے ہی پہلا کام ایک میسج آپ کے نام...!! ☕🌹" + ownerTag,
  /* 07 (7 AM)  */ "جتنی خوبصورت یہ گلابی صُبح ہے 🌸 اتنا ہی خوبصورت آپ کا ہر پَل ہو ✨ جتنی خوشیاں آج آپ کے پاس ہیں 💝 اس سے بھی زیادہ آنے والے کَل میں ہوں....!! 🌈🌷" + ownerTag,
  /* 08 (8 AM)  */ "صُبح صُبح آپ کی یادوں کا ساتھ ہو ☕ میٹھی میٹھی پرندوں کی آواز ہو 🦜 آپ کے چہرے پر ہمیشہ مسکراہٹ ہو 😊 اور ہماری زندگی میں صِرف آپ کا ساتھ ہو...!! 💖✨" + ownerTag,
  /* 09 (9 AM)  */ "پیاری سی میٹھی سی نیندیا کے بَعد 😴 رَات کے حَسین سپنوں کے بَعد ✨ صُبح کے کچھ نئے سپنوں کے ساتھ 🌻 آپ ہنستے رہیں اپنوں کے ساتھ۔ 👨‍👩‍👧‍👦💕" + ownerTag,
  /* 10 (10 AM) */ "رینا سنگھار، بھولی سی صورت 👸 ہر بَات پر سچی لگتی ہو ✨ ہاں تُم ہو بالکل میری چائے کے جیسی ☕ مجھے سانولی ہی اچھی لگتی ہو… ❤️🔥" + ownerTag,
  /* 11 (11 AM) */ "آج ایک دوپہر کی غزل تیرے نام ہو جائے 📜 میرا سویرا بَس تیرے نام ہو جائے ✨ لیتا رہوں تیرا ہی نام اور صُبح سے شام ہو جائے۔ ✍️💕" + ownerTag,
  /* 12 (12 PM) */ "سورج چاچو اوپر چَڑھ پڑے ہیں ☀️ اور تپتی گرمی سے ہمیں تڑپاتے ہیں 🔥 دوپہر کا کھانا اب پیٹ کو جانا ہے 🍱 پھر تکیہ پکڑ کر چین کی نیند سو جانا ہے۔ 😴🏡" + ownerTag,
  /* 13 (1 PM)  */ "بنداس مسکراؤ کیا غَم ہے 😊 زندگی میں ٹینشن کِس کو کَم ہیں 📉 اچھا یا بُرا تو کیول بھرم ہیں ✨ زندگی کا نام 💫 کبھی خوشی کبھی غَم ہیں۔ 🎭🌈" + ownerTag,
  /* 14 (2 PM)  */ "اپنے ہاتھوں سے تیری مانگ سجاؤں 💍 تجھے میں میری قسمت بناؤں ✨ ہوا بھی بیچ سے گزر نہ سکے 💨 ہو اجازت تو اتنے قریب آؤں ...!! 💕🔐" + ownerTag,
  /* 15 (3 PM)  */ "عرض کیا ہے.... 🎤 چائے کے کپ سے اٹھتے دھوئیں میں تیری شکل نظر آتی ہے ☕ ایسے کھو جاتے ہیں تیرے خیالوں میں کہ 💭 اکثر میری چائے ٹھنڈی ہو جاتی ہے…...!!! ❄️💔" + ownerTag,
  /* 16 (4 PM)  */ "ایک سپنے کی طرح سجا کر رکھوں 🎇 اپنے اِس دِل میں ہمیشہ چھپا کر رکھوں 💖 میری تقدیر میرے ساتھ نہیں ورنہ 🏹 زندگی بھر کے لیے اسے اپنا بنا کر رکھوں....!! 🔒👑" + ownerTag,
  /* 17 (5 PM)  */ "آندھی میں بھی دیئے جلا کرتے ہیں 🕯️ کانٹوں میں ہی گلاب کھلا کرتے ہیں 🌹 خوش نصیب ہوتی ہے وہ شام جس میں 🌇 آپ جیسے لوگ مِلا کرتے ہیں۔ ✨🤝" + ownerTag,
  /* 18 (6 PM)  */ "دِل سے دِل کی بَس یہی دُعا ہے 🤲 آج پھر سے ہَم کو کچھ ہوا ہے ✨ شام ڈھلتے ہی آتی ہے یاد آپ کی 🌇 لگتا ہے پیار آپ سے ہی ہوا ہے۔ 💕🏹" + ownerTag,
  /* 19 (7 PM)  */ "چاند سا چہرہ دیکھنے کی اجازت دے دو 🌕 مجھے یہ شام سجانے کی اجازت دے دو ✨ مجھے قید کر لو اپنے عِشق میں ⛓️ یا پھر مجھے عِشق کرنے کی اجازت دے دو۔ 💞🗝️" + ownerTag,
  /* 20 (8 PM)  */ "شکوہ کرو تو انہیں مذاق لگتا ہے 🤔 کتنی شدت سے ہَم انہیں یاد کرتے ہیں 💔 ایک وہ ہیں جنہیں یہ سَب کچھ مذاق لگتا ہے…!! 🎭😔" + ownerTag,
  /* 21 (9 PM)  */ "کوئی چاند ستارہ ہیں ✨ کوئی پھول سے بھی پیارا ہیں 🌹 جو ہر پَل یاد آئے 💭 وہ پَل پَل صِرف تمہارا ہیں....!! 💕💎" + ownerTag,
  /* 22 (10 PM) */ "بسا لے نظر میں صورت تمہاری ✨ دِن رَات اِسی پر ہَم مَرتے رہیں 🏹 خدا کرے جَب تک چلے یہ سانسیں ہماری 🫁 ہَم بَس تُم سے ہی پیار کرتے رہیں ॥ 💖👑" + ownerTag,
  /* 23 (11 PM) */ "زندگی میں کامیابی کی مَنزل کے لیے 🏆 خواب ضروری ہے 💤 اور خواب دیکھنے کے لیے نیند 😴 تو اپنی مَنزل کی پہلی سیڑھی چَڑھو اور سو جاؤ...!! گُڈ نائٹ 🌃🌠" + ownerTag
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
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const currentPoetry = shayariList[currentHour];

    const message = `❁ ━━━━━━━[ 𝗧𝗜𝗠𝗘 ]━━━━━━━ ❁\n\n` +
      `✰🌸 𝗧𝗜𝗠𝗘 ➪ ${hour12}:00 ${ampm} ⏰\n` +
      `✰🌸 𝗗𝗔𝗧𝗘 ➪ ${localTime.getDate()}✰${months[localTime.getMonth()]}✰${localTime.getFullYear()} 📆\n` +
      `✰🌸 𝗗𝗔𝗬 ➪ ${days[localTime.getDay()]} ⏳\n\n` +
      `${currentPoetry}\n\n` +
      `❁ ━━━━━ ❃𝐌𝐑★𝐒𝐇𝐀𝐀𝐍❃ ━━━━━ ❁`;

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
    setInterval(() => sendHourlyMessages(api), 60000);
  }
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage("✅ 𝐒𝐭𝐲𝐥𝐢𝐬𝐡 𝐔𝐫𝐝𝐮 𝐏𝐨𝐞𝐭𝐫𝐲 𝐒𝐲𝐬𝐭𝐞𝐦 𝐀𝐜𝐭𝐢𝐯𝐞!\nHar ghante poetry ke hisab se unique emojis aur bold text jayega.", event.threadID);
};
