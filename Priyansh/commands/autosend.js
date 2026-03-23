const axios = require('axios');

module.exports.config = {
  name: "hourlytime",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "24-Hour New Urdu Poetry with Minimal Design.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 0,
};

const shayariList = [
  "آدھی رات اور تیرے خوابوں کی خوشبو 🌌 دل دھڑکتا ہے بس تیری آہٹ کے منتظر 🥀", // 00
  "اک سکون سا ملتا ہے تجھے یاد کر کے 🌠 ورنہ تنہائی تو ہمیں کب کی مار چکی ہوتی 💎", // 01
  "خوابوں کی بستی میں تیرا ہی بسیرا ہے 😴 نیند میں بھی بس تیرا ہی چہرہ ہے 💤", // 02
  "تہجد کا وقت اور آنکھوں میں نمی 🕯️ مانگا ہے رب سے تجھے کر کے سجدہ بندگی 🤲", // 03
  "ستارے ماند پڑ گئے تیری یاد کے سامنے ✨ سحر ہونے کو ہے اور ہم اب بھی جاگ رہے ہیں 🌅", // 04
  "صبح کی ٹھنڈی ہوا میں تیرا احساس ہے ☀️ جیسے تو میرے کہیں آس پاس ہے 🕋", // 05
  "نئی صبح اور نئی امید کا سفر 🌸 رب کرے کہ خوشیوں سے بھر جائے تیرا گھر 🌹", // 06
  "سورج کی پہلی کرن تجھے مبارک ہو ✨ تیرا ہر لمحہ رب کی رحمت کے نام ہو 🌻", // 07
  "چائے کا کپ اور کھڑکی سے آتی ٹھنڈی ہوا ☕ بس اک تیری کمی ہے باقی سب ہے بھلا 😊", // 08
  "دن کی روشنی میں کام کا ہجوم ہے 🌻 پر دل میں اب بھی تیری ہی دھوم ہے 🎻", // 09
  "تیری باتیں اور وہ پیاری سی مسکراہٹ 👸 یاد آتی ہے ہر پل تیری ہی آہٹ ☕", // 10
  "دھوپ کی شدت میں سایہ ہے تیری یاد 📜 تپتے دل پہ جیسے ٹھنڈی دعا ہے تیری یاد 🤲", // 11
  "دوپہر کی خاموشی اور تیری یاد کا سماں ☀️ تو نہیں پر تیرا خیال ہے میرا جہاں 🍱", // 12
  "مسکراتے رہا کرو ہر حال میں میاں 😊 زندگی مختصر ہے اسے جیو کمال میں 🌈", // 13
  "تقدیر کے لکھے پر یقین رکھتے ہیں 💍 ہم تو بس تیری وفا کی تمنا رکھتے ہیں 🔐", // 14
  "ڈھلتا سورج اور شام کا ملال 🎇 دل میں بس اک تیرا ہی خیال 💖", // 15
  "عصر کا وقت اور سکونِ قلب کا طالب ✨ جیسے تیرا ساتھ ہو میری زندگی کا حاصل 🔒", // 16
  "غروبِ آفتاب کا منظر کتنا حسین ہے 🌇 پر تیرے بنا یہ دل تھوڑا غمگین ہے ✨", // 17
  "مغرب کی پکار اور تیری یاد کا غلبہ 🥀 دل سے نکلتی ہے بس تیرے لیے دعا 🏹", // 18
  "شام کی تنہائی میں یادوں کے دیئے جلائے 🌕 ہم نے عمر گزاری ہے تیرے ہی سائے 💞", // 19
  "عشاء کا سکون اور رات کی خاموشی ✨ یا رب! سلامت رہے میری زندگی کی خوشی 👑", // 20
  "ستاروں بھری رات اور چاند کا ساتھ ✨ کاش تم بھی ہوتے تھام کر میرا ہاتھ 💎", // 21
  "وفا کی منزل اب دور نہیں لگتی 💖 جب سے تو میری زندگی میں شامل ہے 🗝️", // 22
  "اب سو جائیے کہ خوابوں میں ملنا ہے 😴 رب کے سپرد کر کے خود کو میٹھی نیند سونا ہے 🌃" // 23
];

let lastSentHour = null;

async function sendHourlyMessages(api) {
  try {
    const localTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const currentHour = localTime.getHours();
    const currentMinute = localTime.getMinutes();

    if (currentMinute === 0 && lastSentHour !== currentHour) {
      lastSentHour = currentHour;

      const hour12 = currentHour % 12 || 12;
      const ampm = currentHour >= 12 ? "PM" : "AM";
      const currentPoetry = shayariList[currentHour];

      const message = `❁ ━━━━━[ 𝙊𝙒𝙉𝙀𝙍 ]━━━━━ ❁\n\n` +
        `✰🌸 𝑻𝑰𝑴𝑬 ➪ ${hour12}:00 ${ampm} ⏰\n\n` +
        `${currentPoetry}\n\n` +
        `❁ ━━━━[ 𝙎𝙃𝘼𝘼𝙉 ]━━━━ ❁`;

      const threadList = await api.getThreadList(25, null, ["INBOX"]);
      const activeGroups = threadList.filter(t => t.isGroup && t.isSubscribed);

      for (const group of activeGroups) {
        await new Promise(resolve => setTimeout(resolve, 2000));
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
    console.log("✅ Hourly Poetry System Updated!");
    setInterval(() => sendHourlyMessages(api), 30000);
  }
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage("✅ Hourly System is Active! Time & Poetry will be sent automatically.", event.threadID);
};
