const axios = require('axios');

module.exports.config = {
  name: "hourlytime",
  version: "7.2.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "24-Hour Normal Poetry with Stylish Owner Tag (CAPITAL MUSLIM FONT).",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 0,
};

// Stylish Owner Tag restored
const ownerTag = " -[𝐎𝐖𝐍𝐄𝐑 :- ꧁❀𓃮 𓆩𝐒𝐇𝐀𝐀𝐍𓆪 𓃮❀꧂";

const shayariList = [
  /* 00 (12 AM) */ "RAAT KI TANHAI MEIN AKELE THAY HUM 🌌 DARD KI MEHFILON MEIN RO RAHE THAY HUM 🥀 APNE RAB KO YAAD KARNE KE BAAD ✨ PHIR BHI AAP KO YAAD KIYE BINA SOTE NAHI HUM...!! 🌙💤" + ownerTag,
  /* 01 (1 AM)  */ "RAAT KO JAB CHAND SITARE KI YAAD MEIN TADAPTE HAIN 🌠 AAP TO CHALE JATE HO CHHOR KAR HUMEIN 💔 HUM RAAT BHAR TAHAJJUD AUR AAP SE MILNE KO TARASTE HAIN. 🏹💎" + ownerTag,
  /* 02 (2 AM)  */ "KHWABON KI DUNIYA MEIN KHO JANE KA WAQT HAI 😴 MEETI MEETI NEEND MEIN SO JANE KA WAQT HAI 💤 ALLAH HAFIZ AB KAL INSHAALLAH MULAQAT HOGI. 🎇🌠" + ownerTag,
  /* 03 (3 AM)  */ "KHAMOSHI KA AALAM HAI AUR CHARON TARAF ANDHERA 🌑 YAADON KE CHIRAG JALA KAR BAITHE HAIN 🕯️ RAB SE MANGI HAR DUA MEIN AAP KA NAAM RAKHTE HAIN. 🥀🖤" + ownerTag,
  /* 04 (4 AM)  */ "FAJR HONE KO HAI AUR TARE CHUPNE WALE HAIN ✨ HUM AB BHI ALLAH KI IBADAT AUR AAP KI YAAD MEIN JAAG RAHE HAIN ⏳ EK NAYI SUBHA KA INTEZAR HAI. 🕊️🌅" + ownerTag,
  /* 05 (5 AM)  */ "RAAT NE CHADAR SAMAIT LI HAI 🌌 SURAJ NE KIRNEIN BIKHAIR DI HAIN ☀️ CHALO UTHO AUR SHUKRIYA KARO APNE RAB KA 🤲 JIS NE HUMEIN YE PYARI SI SUBHA DI HAI...!! 🕋🌸" + ownerTag,
  /* 06 (6 AM)  */ "NA KOI GILA 🤲 NA KOI SHIKWA ✨ NA KOI DUKH 🌙 NA KOI PARESHANI 🌊 SUBHA UTHTE HI PEHLA KAAM, ALLAH KA NAAM AUR EK MESSAGE AAP KE NAAM...!! ☕🌹" + ownerTag,
  /* 07 (7 AM)  */ "JITNI KHOOBSURAT YE GULABI SUBHA HAI 🌸 UTNA HI KHOOBSURAT AAP KA HAR PAL HO ✨ ALLAH KARE JITNI KHUSHIYAN AAJ AAP KE PAAS HAIN 💝 US SE BHI ZYADA AANE WALE KAL MEIN HON....!! 🌈🌷" + ownerTag,
  /* 08 (8 AM)  */ "SUBHA SUBHA AAP KI YAADON KA SATH HO ☕ MEETI MEETI PARINDON KI AWAZ HO 🦜 AAP KE CHEHRE PAR HAMESHA MUSKURAHAT HO 😊 AUR HAMARI ZINDAGI MEIN HAMESHA KHUDA KI REHMAT HO...!! 💖✨" + ownerTag,
  /* 09 (9 AM)  */ "PYARI SI MEETI SI NEENDIYA KE BAAD 😴 RAAT KE HASEEN SAPNON KE BAAD ✨ SUBHA KE KUCH NAYE IRADON KE SATH 🌻 ALLAH AAP KO HAMESHA KHUSH RAKHE APNO KE SATH. 👨‍👩‍👧‍👦💕" + ownerTag,
  /* 10 (10 AM) */ "MASHALLAH BHOLI SI SURAT 👸 HAR BAAT PAR SACHI LAGTI HO ✨ HAAN TUM HO BILKUL MERI CHAI KE JAISI ☕ MUJHE SANWALI HI ACHI LAGTI HO… ❤️🔥" + ownerTag,
  /* 11 (11 AM) */ "AAJ EK DOPAHAR KI DUA TERE NAAM HO JAGE 📜 MERA SAVERA BAS TERE NAAM HO JAYE ✨ RAB SE MANGTA HOON TERI SALAMTI 🤲 AUR YE DIN TERE NAAM HO JAYE. ✍️💕" + ownerTag,
  /* 12 (12 PM) */ "SURAJ CHACHO UPAR CHARH PARE HAIN ☀️ ZOHAR KA WAQT HONE WALA HAI 🔥 DOPAHAR KA KHANA AB PAIT KO JANA HAI 🍱 PHIR THORI DER ARAAM KAR KE SUKOON PANA HAI. 😴🏡" + ownerTag,
  /* 13 (1 PM)  */ "BINDAS MUSKURAO KYA GHAM HAI 😊 ZINDAGI MEIN TENSION KIS KO KAM HAI 📉 ALLAH PAR TAWAKKUL RAKHO MERE DOST ✨ KYUNKE MUSHKIL KE BAAD HI AASANI HAI. 🎭🌈" + ownerTag,
  /* 14 (2 PM)  */ "RAB SE MAANGI THI EK DUA 💍 TUJHE APNI KISMAT BANAON ✨ KHUDA KARE HUM KABHI JUDA NA HON 💨 AUR HAMESHA EK DOOSTRE KA SATH NIBHAYEIN...!! 💕🔐" + ownerTag,
  /* 15 (3 PM)  */ "ARZ KIYA HAI.... 🎤 CHAI KE CUP SE UTHTE DHUAIN MEIN TERI SHAKAL NAZAR AATI HAI ☕ AISE KHO JATE HAIN TERE KHAYALON MEIN 💭 AKSAR MERI CHAI THANDI HO JATI HAI…...!!! ❄️💔" + ownerTag,
  /* 16 (4 PM)  */ "ASAR KA WAQT SUHANA HAI 🎇 TUJHE DIL MEIN HAMESHA CHHUPA KAR RAKHON 💖 ALLAH SE TUJHE MA... 🏹 ZINDAGI BHAR KE LIYE TUJHE APNA BANA KAR RAKHON....!! 🔒👑" + ownerTag,
  /* 17 (5 PM)  */ "AANDHI MEIN BHI DIYE JALA KARTE HAIN 🕯️ KANTON MEIN HI GULAB KHILA KARTE HAIN 🌹 KHUSH NASEEB HOTI HAI WO SHAAM JIS MEIN AAP JAISE NEK LOG MILA KARTE HAIN. ✨🤝" + ownerTag,
  /* 18 (6 PM)  */ "DIL SE DIL KI BAS YAHI DUA HAI 🤲 AAJ PHIR SE HUM KO KUCH HUA HAI ✨ MAGHRIB KI AZAN KE SATH AATI HAI YAAD AAP KI 🌇 LAGTA HAI SACHA PYAR AAP SE HI HUA HAI. 💕🏹" + ownerTag,
  /* 19 (7 PM)  */ "CHAND SA CHEHRE DEKHNE KI IJAZAT DE DO 🌕 MUJHE YE SHAAM SAJANE KI IJAZAT DE DO ✨ ALLAH KI RAZA SE MAANGTA HOON TUJHE ⛓️ MUJHE HAMESHA KE LIYE APNA BANNE KI IJAZAT DE DO. 💞🗝️" + ownerTag,
  /* 20 (8 PM)  */ "ESHA KI NAMAZ KE BAAD SUKOON MILTA HAI ✨ PAR AAP KI YAAD KA SILSILA CHALTA REHTA HAI 💔 LOG KEHTE HAIN YE SAB MAZAQ HAI 🎭 PAR HUMEIN TO IS MEIN KHUDA KI MARZI LAGTI HAI…!! 🎭😔" + ownerTag,
  /* 21 (9 PM)  */ "KOI CHAND SITARA HAI ✨ KOI PHOOL SE BHI PYARA HAI 🌹 JO HAR PAL DUAON MEIN YAAD AAYE 💭 WO SHAKHS SIRF TUMHARA HAI....!! 💕💎" + ownerTag,
  /* 22 (10 PM) */ "BASA LE NAZAR MEIN SURAT TUMHARI ✨ DIN RAAT ISI PAR HUM MARTE RAHEIN 🏹 KHUDA KARE JAB TAK CHALE YE SAANSEIN HAMARI 🫁 HUM BAS TUM SE HI WAFA KARTE RAHEIN !! 💖👑" + ownerTag,
  /* 23 (11 PM) */ "ZINDAGI MEIN KAMYABI KI MANZIL KE LIYE 🏆 KHWAB ZAROORI HAI 💤 AUR SUKOON KI NEEND KE LIYE ALLAH KA ZIKR 😴 TO 'SUBHANALLAH' PARHO AUR SO JAU...!! GOOD NIGHT 🌃🌠" + ownerTag
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
    setInterval(() => sendHourlyMessages(api), 60000);
  }
};

module.exports.run = async ({ api, event }) => {
  api.sendMessage("✅ System Updated!\nPoetry normal text mein hai, magar Owner name aur main headers stylish font mein hain.", event.threadID);
};
