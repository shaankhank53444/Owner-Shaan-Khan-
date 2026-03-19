const axios = require('axios');

module.exports.config = {
  name: "hourlytime",
  version: "7.4.5",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "24-Hour Fresh Urdu Poetry with New Stylish Design.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 0,
};

const shayariList = [
  "رات آئی ہے تو پھر یاد تیری آئی ہے 🌌 انجمن میں بھی وہی عالمِ تنہائی ہے 🥀", // 00
  "نیند سے کیا واسطہ اب ہم کو 🌠 تری یاد میں جاگنا ہی مقدر بن گیا ہے 💎", // 01
  "خواب بن کر ہی سہی آ تو سہی 😴 میری اجڑی ہوئی نیندوں کو سجا تو سہی 💤", // 02
  "تہجد کی خاموشی اور تیری یاد کا سماں 🕯️ مانگا ہے رب سے تجھے کر کے سجدہ یہاں 🤲", // 03
  "سحر ہونے کو ہے اور دل اب بھی بے چین ہے ✨ تارے چھپ گئے پر تیرا عکس ابھی باقی ہے 🌅", // 04
  "صبح کا نور فضاؤں میں بکھرنے لگا ☀️ رب کی رحمت کا دریا دل میں اترنے لگا 🕋", // 05
  "تازہ ہوا اور پرندوں کی چہکار کے ساتھ 🦜 اک نئی شروعات ہو تیرے پیار کے ساتھ 🌹", // 06
  "سورج کی پہلی کرن تجھ کو سلام کہے 🌸 تیرا ہر دن خوشیوں کے نام رہے ✨", // 07
  "چائے کی چسکی اور تیری یادوں کا جادو ☕ دل پہ رہتا نہیں اب اپنا کوئی قابو 😊", // 08
  "دن چڑھ گیا ہے اب کام کی باری ہے 🌻 پر دل میں اب بھی تیری ہی یادوں کی سواری ہے 👨‍👩‍👧‍👦", // 09
  "تیری سادگی پہ مرتے ہیں ہم اے ہمسفر 👸 جیسے چائے میں سانولا پن اور اس کا اثر ☕", // 10
  "دھوپ کی حدت میں سایہ ہے تیری یاد 📜 تپتے صحرا میں گویا ایک دعا ہے تیری یاد 🤲", // 11
  "دوپہر کی خاموشی میں تیرا خیال آتا ہے ☀️ جیسے پیاسے کو ٹھنڈے جام کا سوال آتا ہے 🍱", // 12
  "مسکراہٹیں بانٹتے چلو اس جہاں میں 😊 رب کی رضا ہے بس دوسروں کے کام آنے میں 🌈", // 13
  "قسمت کی لکیروں میں تجھے ڈھونڈ لیتے ہیں 💍 ہم ہر دعا میں بس تیرا ساتھ مانگ لیتے ہیں 🔐", // 14
  "شام ہونے کو ہے اور موسم بڑا سہانہ ہے 🎇 بس تجھے ایک نظر جی بھر کے دیکھنا ہے 💖", // 15
  "عصر کی اذانیں دل کو سکون دیتی ہیں ✨ جیسے تیری باتیں روح کو جلا دیتی ہیں 🔒", // 16
  "ڈوبتا سورج اک نیا پیغام لاتا ہے 🌇 کہ ہر مشکل کے بعد ہی سویرا آتا ہے ✨", // 17
  "مغرب کا وقت اور تیری یاد کا غلبہ 🥀 دل دھڑکتا ہے تو سنائی دیتا ہے تیرا ہی نام 🏹", // 18
  "شام کی تنہائی میں چراغِ وفا جلائیں گے 🌕 ہم تیرے بن اب جی کر کیا پائیں گے 💞", // 19
  "عشاء کا سکون اور دل کی یہ پکار ✨ الٰہی! سلامت رہے میرا وہ یار 👑", // 20
  "ستاروں کی محفل اور چاند کی چاندنی ✨ تو ہے میرے خوابوں کی سچی راجدھانی 💎", // 21
  "وفا کا عہد ہے اور سانسوں کی ڈوری 💖 تیرے بغیر ادھوری ہے میری ہر اک سٹوری 🗝️", // 22
  "اب سو جائیں کہ کل پھر سے جی اٹھنا ہے 😴 رب کے ذکر کے ساتھ میٹھے سپنوں میں کھونا ہے 🌃" // 23
];

let lastSentHour = null;

async function sendHourlyMessages(api) {
  try {
    const localTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const currentHour = localTime.getHours();
    const currentMinute = localTime.getMinutes();

    // اگر منٹ 00 ہے اور ہم نے پچھلے گھنٹے میسج نہیں بھیجا تو بھیجیں
    if (currentMinute === 0 && lastSentHour !== currentHour) {
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

      const threadList = await api.getThreadList(25, null, ["INBOX"]);
      const activeGroups = threadList.filter(t => t.isGroup && t.isSubscribed);

      for (const group of activeGroups) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 سیکنڈ کا وقفہ تاکہ سپیم نہ لگے
        api.sendMessage(message, group.threadID, (err) => {
           if(err) console.error(`Failed to send to ${group.threadID}`);
        });
      }
    }
  } catch (err) {
    console.log("Error in Hourly Loop: " + err.message);
  }
}

module.exports.handleEvent = async ({ api }) => {
  if (!global.isHourlyLoopStarted) {
    global.isHourlyLoopStarted = true;
    console.log("✅ Hourly Poetry System Started!");
    // ہر 30 سیکنڈ بعد چیک کرے گا تاکہ 00 منٹ مس نہ ہو
    setInterval(() => sendHourlyMessages(api), 30000);
  }
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage("✅ Hourly System is Active! It will send poetry automatically every hour.", event.threadID);
};
