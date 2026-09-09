module.exports.config = {
  name: "poetry",
  version: "1.0.1",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Urdu aur Roman poetry categories ke sath bhejta hai",
  commandCategory: "fun",
  usages: "[love / sad / attitude / dosti / motivation]",
  cooldowns: 2
};

const poetryDatabase = {
  love: [
    "Tere bina ye zindagi ek adhuri dastan lagti hai,\nTu paas na ho toh mehfil bhi veeran lagti hai. ❤️",
    "Dil karta hai bas tumhein dekhte rahein,\nTumhari muskaan mein apni duniya dhoondte rahein. ✨",
    "Mohabbat wo nahi jo alfaaz mein bayaan ho,\nMohabbat wo hai jo khamoshi mein samajh aaye. 💕",
    "Log kehte hain ke ishq ek baar hota hai,\nMagar humein toh tumse har roz hota hai. 🌹",
    "Teri aankhon ke sukoon ko dhoondta hoon,\nMain aksar teri zulfon ki chaon dhoondta hoon. ✨",
    "Tum mil gaye toh har khushi mil gayi hai,\nJaise veeran dil ko nayi zindagi mil gayi hai. 💖"
  ],
  sad: [
    "Dard jab had se guzarta hai toh gane lagta hai,\nDil ki baatein ab kisi ko batana accha nahi lagta. 💔",
    "Humne socha tha ke bayaan karenge apna dukh,\nMagar unhone toh haal poochna bhi munasib na samjha. 😔",
    "Khamoshi ka matlab inkaar nahi hota,\nHar dukh ka hal azaar nahi hota. 🥀",
    "Ab kisi se koi shikayat nahi rahi,\nJo mila wo bhi apna na raha. 💔",
    "Kuch zakhm aise hotey hain jo bhar toh jaate hain,\nPar unke daag kabhi nahi jaate. 🥀",
    "Wo jo kabhi dil ke qareeb hua karte the,\nAaj unke hi badalne ke gham rulate hain. 💔"
  ],
  attitude: [
    "Aag lagana meri fitrat mein nahi,\nMera wajood hi aisi shaan rakhta hai ke log khud jal jaate hain. 🔥",
    "Khel wohi khelo jisme jeet saf ho,\nPar baazi wohi jeeto jisme dushman ko hairani ho. 😎",
    "Pehchan kya hoti hai humse mat poocho,\nHum jahan khade hote hain, saf khud hi lag jaati hai. 👑",
    "Apna muqaddar hum khud likhte hain,\nKisi ke reham-o-karam par jeena humari aadat nahi. ⚡",
    "Humein parakhne ki ghalti mat karna,\nHum wo hain jo kabhi kisi ke aage jhukte nahi. 🔥",
    "Naam aur kaam dono aisa banao ke,\nLog sunte hi kahein: 'Ye Shaan Khan ka daur hai!' 👑"
  ],
  dosti: [
    "Dosti wo rishta hai jo khuda banata hai,\nAcche dost milna kismat ki baat hoti hai. 🤝",
    "Zindagi ke safar mein dost sachay ho toh,\nKanton bhara rasta bhi phool ban jata hai. ✨",
    "Dost wo nahi jo khushi mein saath de,\nDost wo hai jo gham mein kabhi tanha na chode. 🫂",
    "Har pal ki dosti ka irada hai aap se,\nApnepan ka kuch zyaada hi vaada hai aap se. ✨"
  ],
  motivation: [
    "Manzil unhi ko milti hai jin ke sapno mein jaan hoti hai,\nPankh se kuch nahi hota, hoslon se udaan hoti hai! 🚀",
    "Gir kar uthna, uth kar chalna ye hi zindagi ka asool hai,\nKoshish karne walon ki kabhi haar nahi hoti. 💪",
    "Mushkilein toh aayengi safar mein, par tum rukna mat,\nApne khwab poore kiye bina tum jhukna mat. 🔥",
    "Safar jitna mushkil hoga,\nKamyaabi utni hi shandar hogi! 🏆"
  ]
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    const categoryInput = (args && args[0]) ? args[0].toLowerCase() : 'random';

    let selectedCategory = "R A N D O M  ✨";
    let list = [];

    if (['love', 'mohabbat', 'pyar'].includes(categoryInput)) {
      list = poetryDatabase.love;
      selectedCategory = "L O V E  💕";
    } else if (['sad', 'dukh', 'gham'].includes(categoryInput)) {
      list = poetryDatabase.sad;
      selectedCategory = "S A D  💔";
    } else if (['attitude', 'shaan', 'royal'].includes(categoryInput)) {
      list = poetryDatabase.attitude;
      selectedCategory = "A T T I T U D E  🔥";
    } else if (['dosti', 'friend', 'friends'].includes(categoryInput)) {
      list = poetryDatabase.dosti;
      selectedCategory = "D O S T I  🤝";
    } else if (['motivation', 'himmat'].includes(categoryInput)) {
      list = poetryDatabase.motivation;
      selectedCategory = "M O T I V A T I O N  🚀";
    } else {
      list = Object.values(poetryDatabase).flat();
    }

    const randomShayari = list[Math.floor(Math.random() * list.length)];

    const msg = `──── •📜 URDU POETRY (${selectedCategory}) 📜• ────\n\n` +
      `${randomShayari}\n\n` +
      `💡 Options: .poetry love, .poetry sad, .poetry attitude, .poetry dosti, .poetry motivation\n\n` +
      `──── •💜• ────»»𝐎𝐖𝐍𝐄𝐑««★𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍★`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error('[ POETRY ERROR ]:', err);
    return api.sendMessage("❌ Poetry load karne mein error aaya hai!", threadID, messageID);
  }
};
