const axios = require('axios');
const crypto = require('crypto');

module.exports.config = {
  name: "hourlytime",
  version: "4.2.0",
  hasPermssion: 0,
  credits: "SHAAN SIR",
  description: "Sends hourly announcements to GROUPS ONLY (Decrypted Version).",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 0,
};

// Shayri ki list
const shayariList = [
  "رات کو جب چاند ستارے کی یاد میں تڑپتے ہیں 💕 آپ تو چلے جاتے ہو چھوڑ کر ہمیں 💕 ہم رات بھر آپ سے ملنے کو ترستے ہیں۔💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "چاند سا چہرہ دیکھنے کی اجازت دے دو 💕 مجھے یہ شام سجانے کی اجازت دے دو 💕 مجھے قید کر لو اپنے عشق میں یا پھر مجھے عشق کرنے کی اجازت دے دو۔💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "دل سے دل کی بس یہی دعا ہے 💕 آج پھر سے ہم کو کچھ ہوا ہے 💕 شام ڈھلتے ہی آتی ہے یاد آپ کی 💕 لگتا ہے پیار آپ سے ہی ہوا ہے۔💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "بنداس مسکراؤ کیا غم ہے 💕 زندگی میں ٹینشن کس کو کم ہیں 💕 اچھا یا برا تو کیول بھرم ہیں 💕 زندگی کا نام 💕 کبھی خوشی کبھی غم ہیں۔💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "آندھی میں بھی دیئے جلا کرتے ہیں 💕 کانٹوں میں ہی گلاب کھلا کرتے ہیں 💕 خوش نصیب ہوتی ہے وہ شام جس میں آپ جیسے لوگ ملا کرتے ہیں۔🥀😌🌴-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "رینا سنگھار، بھولی سی صورت 💕 ہر بات پر سچی لگتی ہو 💕 ہاں تم ہو بالکل میری چائے کے جیسی 💕 مجھے سانولی ہی اچھی لگتی ہو… ❤️❤️❤️-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "اپنے ہاتھوں سے تیری مانگ سجاؤں 💕 تجھے میں میری قسمت بناؤں 💕 ہوا بھی بیچ سے گزر نہ سکے 💕 ہو اجازت تو اتنے قریب آؤں ...!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "سورج چاچو اوپر چڑھ پڑے ہیں 💕 اور تپتی گرمی سے ہمیں تڑپاتے ہیں 💕 دوپہر کا کھانا اب پیٹ کو جانا hai 💕 پھر تکیہ پکڑ کر چین کی نیند سو جانا ہے۔💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "آج ایک دوپہر کی غزل تیرے نام ہو جائے 💕 میرا سویرا بس تیرے نام ہو جائے 💕 لیتا رہوں تیرا ہی نام اور صبح سے شام ہو جائے۔💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "ایک سپنے کی طرح سجا کر رکھوں 💕 اپنے اس دل میں ہمیشہ چھپا کر رکھوں 💕 میری تقدیر میرے ساتھ نہیں ورنہ 💕 زندگی بھر کے لیے اسے اپنا بنا کر رکھوں....!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "کوئی چاند ستارہ ہیں 💕 کوئی پھول سے بھی پیارا ہیں 💕 جو ہر پل یاد آئے 💕وہ پل پل صرف تمہارا ہیں....!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "بسا لے نظر میں صورت تمہاری 💕 دن رات اسی پر ہم مرتے رہیں 💕 خدا کرے جب تک چلے یہ سانسیں ہماری 💕 ہم بس تم سے ہی پیار کرتے رہیں ॥💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "عرض کیا ہے.... 💕 چائے کے کپ سے اٹھتے دھوئیں میں تیری شکل نظر آتی ہے 💕 ایسے کھو جاتے ہیں تیرے خیالوں میں کہ 💕اکثر میری چائے ٹھنڈی ہو جاتی ہے…...!!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "جتنی خوبصورت یہ گلابی صبح ہے 💕 اتنا ہی خوبصورت آپ کا ہر پل ہو 💕 جتنی بھی خوشیاں آج آپ کے پاس ہیں 💕 اس سے بھی زیادہ آنے والے کل میں ہوں....!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "نہ مندر 💕 نہ بھگوان 💕 نہ پوجا 💕 نہ اشنان 💕 صبح اٹھتے ہی پہلا کام ایک SMS آپ کے نام...!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "پیاری سی میٹھی سی نیندیا کے بعد 💕 رات کے حسین سپنوں کے بعد 💕 صبح کے کچھ نئے سپنوں کے ساتھ 💕 آپ ہنستے رہیں اپنوں کے ساتھ۔💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "صبح صبح آپ کی یادوں کا ساتھ ہو 💕 میٹھی میٹھی پرندوں کی آواز ہو 💕 آپ کے چہرے پر ہمیشہ مسکراہٹ ہو 💕 اور ہماری زندگی میں صرف آپ کا ساتھ ہو...!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "رات نے چادر سمیٹ لی ہے 💕 سورج نے کرنیں بکھیر دی ہیں 💕 چلو اٹھو اور شکریہ کرو اپنے بھگوان کو 💕 جس نے ہمیں یہ پیاری سی صبح دی ہے...!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "رات کی تنہائی میں اکیلے تھے ہم 💕 درد کی محفلوں میں رو رہے تھے ہم 💕 آپ ہمارے بھلے ہی کچھ نہیں لگتے 💕 پھر بھی آپ کو یاد کیے بنا سوتے نہیں ہم...!!💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "زندگی میں کامیابی کی منزل کے لیے 💕 خواب ضروری ہے 💕 اور خواب دیکھنے کے لیے نیند 💕 تو اپنی منزل کی پہلی سیڑھی چڑھو اور سو جاؤ...!! گڈ نائٹ 💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "پاگل سا بچہ ہوں 💕 مگر دل کا سچا ہوں 💕 تھوڑا سا آوارہ ہوں💕 مگر تیرا ہی تو دیوانہ ہوں...!!💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "اے چاند تارو 💕 ذرا ان کو ایک لات مارو 💕 بستر سے ان کو نیچے اتارو 💕 کرو ان کے ساتھ فائٹ 💕 کیونکہ یہ سو گئے ہیں بنا بولے گڈ نائٹ 💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
  "یقیناً، حاضر ہوں۔ پیش خدمت ہے آپ کے پیغامات اردو میں، عین انہی ایموجیز کے ساتھ: 💕 شکوہ کرو تو انہیں مذاق لگتا ہے 💕 کتنی شدت سے ہم انہیں یاد کرتے ہیں 💕 ایک وہ ہیں جنہیں یہ سب کچھ مذاق لگتا ہے…!! 💝💝💝-[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂",
];

const imgLinks = [
  "https://i.ibb.co/SDPVKCHk/received-1658902918087737.jpg",
  "https://i.ibb.co/DPCjNvCn/received-1372477247338330.jpg",
  "https://i.ibb.co/ZzB513BD/received-1199306371647867.jpg",
  "https://i.ibb.co/S7vb9bNt/received-992977839702824.jpg",
  "https://i.ibb.co/CKyTr6K6/received-690751813426718.jpg",
  "https://i.ibb.co/NnJFrzLZ/received-660293663440253.jpg",
  "https://i.ibb.co/LhspSYbB/received-552668450906408.jpg",
];

let lastSentHour = null;

const sendHourlyMessages = async (api) => {
  try {
    const now = new Date();
    // Pakistan Time Zone (Asia/Karachi)
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const currentHour = localTime.getHours();
    const minutes = localTime.getMinutes();

    // Sirf tabhi bheje jab minute 00 ho aur us ghante pehle na bheja gaya ho
    if (minutes !== 0 || lastSentHour === currentHour) return;
    lastSentHour = currentHour;

    const hour12 = currentHour % 12 || 12;
    const ampm = currentHour >= 12 ? "PM" : "AM";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const date = localTime.getDate();
    const month = months[localTime.getMonth()];
    const year = localTime.getFullYear();
    const day = days[localTime.getDay()];

    const randomShayari = shayariList[Math.floor(Math.random() * shayariList.length)];
    const randomImage = imgLinks[Math.floor(Math.random() * imgLinks.length)];

    const message = `❁ ━━━━━━━[ 𝗧𝗜𝗠𝗘 ]━━━━━━━ ❁\n\n` +
      `✰🌸 𝗧𝗜𝗠𝗘 ➪ ${hour12}:00 ${ampm} ⏰\n` +
      `✰🌸 𝗗𝗔𝗧𝗘 ➪ ${date}✰${month}✰${year} 📆\n` +
      `✰🌸 𝗗𝗔𝗬 ➪ ${day} ⏳\n\n` +
      `${randomShayari}\n\n` +
      `❁ ━━━━━ ❃𝐌𝐑★𝐒𝐇𝐀𝐀𝐍❃ ━━━━━ ❁`;

    // Sabhi chats fetch karein
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    
    // Filter: Sirf wo threads jo GROUPS hain (isGroup: true)
    const activeGroups = threadList.filter(thread => thread.isGroup === true && thread.isSubscribed);

    if (activeGroups.length === 0) return;

    // Image ko stream mein convert karein
    const response = await axios.get(randomImage, { responseType: "stream" });

    for (const group of activeGroups) {
      await api.sendMessage({
        body: message,
        attachment: response.data
      }, group.threadID);
    }

    console.log(`[Hourly Report] Message sent to ${activeGroups.length} groups.`);
  } catch (error) {
    console.error("Hourly announcement error:", error.message);
  }
};

module.exports.handleEvent = async ({ api }) => {
  // Interval ko sirf ek baar start karne ke liye
  if (!global.isHourlyLoopStarted) {
    global.isHourlyLoopStarted = true;
    setInterval(() => {
      sendHourlyMessages(api);
    }, 60000); // Har minute check karega
  }
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage("Hourly Group-only auto-sender is active. (Decrypted)", event.threadID);
};
