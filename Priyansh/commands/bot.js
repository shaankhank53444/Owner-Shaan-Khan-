const fs = global.nodemodule["fs-extra"];
module.exports.config = {
  name: "goibot",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Mod by Shaan",
  description: "goibot",
  commandCategory: "Noprefix",
  usages: "noprefix",
  cooldowns: 5,
};
module.exports.handleEvent = async function({ api, event, args, Threads, Users }) {
  var { threadID, messageID, reason } = event;
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Karachi").format("hh:mm:s");
  const hours = moment.tz("Asia/Karachi").format("hh");
  var idgr = `${event.threadID}`;
  var id = event.senderID;
  var name = await Users.getNameUser(event.senderID);

  var tl = ["kali kali zulfon k phandy na dalo Heer burka smbhalo, bhai stand utha lo🙂🚶", "Lips  kissing is not Romance It's sharing Bacteria>>>🙂", "💸💚🖇️Tm Propose kr k to dekho qabul  krny ki zimedari merii - 🙂🫣_", "~ Piyawr Hameshw Aalsii InsaN sw kwr0 mUjhei aby neend  ary hai baki Kl Bta0 gw 🙂🔪", "𝙀𝙠 𝙗𝙖𝙖𝙧 𝙨𝙝𝙖𝙙𝙞 𝙝𝙤𝙟𝙖𝙚 𝙥𝙝𝙞𝙧 𝙬𝙞𝙛𝙚 𝙠𝙞 𝙜𝙝𝙪𝙡𝙖𝙢𝙞 🧸🙂", "*Ghr məıın - عـــزت noi werna Admii thy hum bhi kam kə'w -' ♡🖇️😞*😒", "🦋🍒____________🙂🎀پتہ لگا تینوں شوق لتراں دا🤝🏻🔐🫰🏻", "Suno Jawn DiL کرتا ha ہر Waqt تمہاری Chumiya لیتا Raho😌🙈", "Khud ko single keh kr Apne khufiya janu ka janaza na nikala kro.😀🤞😓", "Love me 💕 like Mubi love's kavya♥️", "Hi mujY Rana Mubii chokra ne baNaYa hY 🙂", "Kᴀʜᴀɴɪ Sᴜɴᴏ !😔 Zᴜʙᴀɴɪ sᴜɴᴏ !😔Mᴜᴊʜʏ Bᴜᴋʜᴀʀ Hᴏᴡᴀ Tʜᴀ'ᴡ 😔 )Eᴋ sᴏ Cʜᴀᴀʀ Hᴏᴡᴀ Tʜᴀ'ᴡ 🥺💔:)", "- 𝙩𝙪𝙢 𝙢𝙚𝙧𝙖 𝙙𝙞𝙡 𝙩𝙤 𝘾𝙝𝙪𝙧𝙖 𝙣𝙝𝙞 𝙥𝙖𝙮 𝙠𝙞𝙖 𝙛𝙖𝙞𝙙𝙖 𝙩𝙢𝙝𝙖𝙧𝙞 𝘾𝙝𝙤𝙤𝙧 𝙟𝙚𝙨𝙞 𝙨𝙝𝙠𝙖𝙡 𝙠𝙖!! 🙂", "𝐄𝐤 𝐛𝐚𝐚𝐫 𝐈 𝐋𝐨𝐯𝐞 𝐘𝐎𝐲 𝐁𝐨𝐥 𝐃𝐨 𝐍𝐚 𝐌𝐚𝐫 𝐓𝐡𝐨𝐫𝐢 𝐉𝐚𝐮𝐠𝐢 🙄😕)( 👑🍒", "SharaM kr0'w LarKiy0' mujhe aaj AnTii ne propose Kar Diiy4'w ___/////😞🍁☠️🌸", "Imagine I am your Ex 🥲say whatever you want to say", "-😁🎗_ZeHer banaNa sikH raHiii hUn😂👀 BuS iskO trY karnY waLa cHaHiye _💔🙄😹", "I love You Madiha♥️ ,fatima,Ayesha, Maryam,and 299 others 🙂", "Hye ye Cute Cute DpiYa  Unke peeche'w Chhupii MoTii Kalii AnTiiYa 🙂🍁", "°Mein واقعی Piyaara Hun Ya Log چونا Lagaty hain-🙂💔","Ittuu🤏 si shram ker Lya kro bot bot krty wqt 🙂 💔✨⚠️†", "Ary Yahin Hon Jan😗", "jiee Shona 😍", "Love you", "Miss YoU NaW Inna sara👌🏻👌🏻", "To mera putar chutti kr", "OkkaY Babbu", "😁Smile I am Taking Selfy✌️🤳", "🥺Jan nahi kehna to men naraz ho jana he", "Jesay Yaad Karne Se Hi Mood Kharab Hojaye Ek Aisa Fazool Khayal Ho Tum", "Main ap ki ami ko btaou ga ap Facebook use kerty ho 😂", "#__LaLa__LaLa__Lori #__Koi___Chori__Set__Ni__HoRRI", ,"Bhai Wese Ldki Patane Ka Trick Btao Na Bada Din Ho Gya Single Hu ;🙂" ,"Ufff aap Ki اداٸیں😗 Chaly Shabas Apna'w munh Dho kY aye'w..]] . 🙂✨//. 🦋🍒)" ,"Suno Jawn DiL کرتا ha ہر Waqt تمہاری Chumiya لیتا Raho😌🙈","𝐄𝐤 𝐛𝐚𝐚𝐫 𝐈 𝐋𝐨𝐯𝐞 𝐘𝐎𝐲 𝐁𝐨𝐥 𝐃𝐨 𝐍𝐚 𝐌𝐚𝐫 𝐓𝐡𝐨𝐫𝐢 𝐉𝐚𝐮𝐠𝐢 🙄😕)( 👑🍒",";", "𝘗𝘩𝘢𝘴 𝘨𝘢𝘺𝘢 𝘮𝘯 𝘣𝘩𝘪 𝘵𝘦𝘳𝘺 𝘉𝘦𝘢𝘶𝘵𝘺 𝘛𝘳𝘢𝘱 𝘮𝘯 🥺💝", "Kash siNGLe HONY k paisy MILTY to mn sab sY ameer HOTA😓", "غلامــــی صـٓــــرف بیگـــَــم دی  🚶-", "Jawn❤️I'm waiting for your text..🙂🙉", "Ek bestie to ma b deserve karta Hun ❤😁🙉",  "بات عزت کی تھی ورنہ آج سڑک پہ پڑا دس کا نوٹ بلکل اصلی تھا🥺🌿", "فاصلہ رکھیں👀\n\nپیار تو ہونا نہیں خوامخواہ لڑائی ہو جائے گی😒😬", "محبت کرو تو انباکس میں اکیلے اکیلے🙄\n\nاور رونا دھونا  پورے Facebook میں۔۔۔واہ رے پلاسٹک کے عاشقو🙁", "•سنو لڑکیو🙋\n\nسفید ڈریس پر لال لپ اسٹک لگاتی ہو💄 قسم سے ایمبولینس لگتی ہو😂", "اگر یہ❤️   ہے\n\nتو پھر یہ 🫀 کیا ہے.", "وہ روز کہتی تھی ہم بھاگ جائیں گے🙈\n\nاور پھر وہ بھاگ گئ مجھے لے جانا بھول گئ😥", " غیر کی دِل میں اگر اُترنا تھا  تو میرے دِل سے اُتر گئے ہوتے ۔ 💔🙂", "makeup kya hai mard hi k paiso se mard hi ko bewakoof banane ki sazish🤝🙂", "𝘚𝘜𝘕𝘖 𝘒𝘕 𝘚𝘈 𝘔𝘖𝘋𝘌𝘓 𝘏𝘖 \n𝘔𝘌 :2002🦋🥴🖤", "عورت بڑا سا بڑا دُکھ بھول سکتی ہے\n\nلیکِن پڑوس میں گیا برتن نہیں 💯😁", "💫✨💙Tazab Piyo Zindagi Jiyo✍️🙂","لفظوں میں اتنا زہر کہا سے لاتے ہو لگتا ہے سانپ کا زہر پی کے آتے ہو","وہ ہمیں بے شرم کہتے ہے تو کہتے رہے فراز امی کہتی ہی جو کہتا ہے وہ ہی ہوتا ہے🤣","دل کرتا ہے تمھے دعا میں مانگو پر ڈر لگتا ہے کہی سچی میں نہ پلے پر جاؤ🤣","","دل کرتا ہے سب کو چوڑیاں لادوں🙊پر فیر تسی ٹھرکی سمجھ لینا اے 🤣😔😜","اُستاد: وہ کون سا باز ہے جو اڑ نہیں سکتا ..؟میں : لونڈے باز 🙂","*بھینس🐂 سےانڈے🥚 کی امید رکھ لو لیکن کراچی کی لڑکی سے Wafa کی امید نا رکھنا😏☹️💔*","‎وہ لڑکی اور آنٹی میسج کرے  جس نے آج تک فائزہ بیوٹی کریم استعمال نہ کی ہو دیکھنا اب کوئی نہیں آئے گی‎","‏تمہاری چمی شمی لیلوں کوئی مسئلہ تو نہیں۔۔۔؟🤭"," Teacher: any questions? Me: Kyun kisi ko wafa ke badly waafa nahi milti",];
  var rand = tl[Math.floor(Math.random() * tl.length)]

  if ((event.body.toLowerCase() == "by") || (event.body.toLowerCase() == "bye")) {return api.sendMessage("ChaL NiKaL 🙄", threadID);
   };
  if ((event.body.toLowerCase() == "👻") || (event.body.toLowerCase() == "👽")) {return api.sendMessage("𝒀𝑬 𝑫𝑬𝑲𝑯 𝑮𝑨𝑹𝑬𝑬𝑩𝑶 𝑲𝑨 𝑩𝑶𝑻𝑯🤣🤣😅", threadID);
   };

  if ((event.body.toLowerCase() == "inbox") || (event.body.toLowerCase() == "ib")) {
     return api.sendMessage("️ KYa IB IB 👿 Idher BOL MeRe SaMny ", threadID);
   };

   
   if ((event.body.toLowerCase() == "baby") || (event.body.toLowerCase() == "babu")) {
     return api.sendMessage("️🙈🙉🙊", threadID);
   };
  
   if ((event.body.toLowerCase() == "owner") || (event.body.toLowerCase() == "admin")) {
     return api.sendMessage("༻𝐎𝐖𝐍𝐄𝐑:- ☞ ༻☞[𝐎𝐖𝐍𝐄𝐑:☞➸⃝🐼⃝⃞⃟𝙎𝙝𝙖𝙖𝙣 𝙠𝙝𝙖𝙣🎸  ☜ 𝚈𝚘𝚞 𝙲𝚊𝚗 𝙲𝚊𝚕𝚕 𝙷𝚒𝚖 𝙎𝙝𝙖𝙖𝙣𝙞. ☜ ༺༒ ༒𝐇𝐢𝐬 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐢𝐝༒:- https://www.facebook.com/profile.php?id=100016828397863☞    his insta id @Shankhank345 ☜ ༺༒ ༒", threadID);
   };
if ((event.body.toLowerCase() == "sim") || (event.body.toLowerCase() == "simi")) {
     return api.sendMessage("Sim Sim Na KRr IjjaT Sy MeRa Prefix LaGa 0or Bt kRr ITna Free Nhi kRta Me 😎🤞", threadID);
   };

   if ((event.body.toLowerCase() == "amy") || (event.body.toLowerCase() == "amyy")) {
     return api.sendMessage("Amy Amy Na KRr IjjaT Sy MeRa Prefix LaGa 0or Bt kRr ITna Free Nhi kRta Me 😎🤞", threadID);
   };

   if ((event.body.toLowerCase() == "tharki bot") || (event.body.toLowerCase() == "Bot tharki")) {
     return api.sendMessage("Tu TharKi Tra Bap TharKi TeRa DaDa TharKi 🤬🤗", threadID);
   };

   if ((event.body.toLowerCase() == "lanti bot") || (event.body.toLowerCase() == "lanti hai")) {
     return api.sendMessage("Aby Chuuu Tu LanTi Le KaB0ol kRr 🖐️🐾👣", threadID);
   };

   if ((event.body.toLowerCase() == "bc") || (event.body.toLowerCase() == "bhenchod")) {
     return api.sendMessage("Tu Hai Bc 🙂 Main T0o BoT Hun 😂😂😂 ", threadID);
   };

   if ((event.body.toLowerCase() == "ja rha") || (event.body.toLowerCase() == "ja rhi")) {
     return api.sendMessage("Are Tu Ja Na Ree ", threadID);
   };

   if ((event.body.toLowerCase() == "nikal") || (event.body.toLowerCase() == "nikl")) {
     return api.sendMessage("ChaL ChaL Tu NiKaL", threadID);
   };

   if ((event.body.toLowerCase() == "jan") || (event.body.toLowerCase() == "janu")) {
     return api.sendMessage("Aww🥰 Yes My LoVe", threadID);
   };

if ((event.body.toLowerCase() == "🥰") || (event.body.toLowerCase() == "🫣")) {
     return api.sendMessage("𝐈𝐒 𝐍𝐀𝐙𝐀𝐑 𝐒𝐈𝐑𝐀𝐅 𝐌𝐔𝐉𝐇𝐄 𝐍𝐀𝐈𝐑𝐀𝐀 𝐃𝐄𝐊𝐇 𝐒𝐀𝐊 𝐓𝐇𝐈 𝐇𝐀𝐈", threadID);
   };
   
   if ((event.body.toLowerCase() == "😃") || (event.body.toLowerCase() == "😃😃")) {
     return api.sendMessage("ChuhY JasA MuH Na DekHa 😆", threadID);
   };
   
   if ((event.body.toLowerCase() == "😂") || (event.body.toLowerCase() == "😂😂")) {
     return api.sendMessage("Ye HanS RahY H0o Yaa ROo RahY Hoo 🤔 ", threadID);
   };
   
   if ((event.body.toLowerCase() == "😁") || (event.body.toLowerCase() == "😁😁")) {
     return api.sendMessage("TrRi Shakal Sy Tu ZiaDa Dant Chmak RhYy 🫡", threadID);
   };
   
   if ((event.body.toLowerCase() == "😆") || (event.body.toLowerCase() == "😆😆")) {
     return api.sendMessage("Muh OpeN ankhY Band Ye koNsa Magic Ha ThaRki🙄", threadID);
   };
   
   if ((event.body.toLowerCase() == "😅") || (event.body.toLowerCase() == "😅😅")) {
     return api.sendMessage("Tri TinD Sy PaNi KYun TaPak Rha 😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤣") || (event.body.toLowerCase() == "🤣🤣")) {
     return api.sendMessage("AsY Kon HansTa Hai BesHram insaN", threadID);
   };
   
   if ((event.body.toLowerCase() == "😭") || (event.body.toLowerCase() == "😭😭")) {
     return api.sendMessage("Awww Meko V LoooNa Aa RaHa 🥹🥺", threadID);
   };
   
   if ((event.body.toLowerCase() == "😉") || (event.body.toLowerCase() == "😉😉")) {
     return api.sendMessage("GanDi NaZar Sy AnKh Na Mar 😂😂😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "😗") || (event.body.toLowerCase() == "😗😗")) {
     return api.sendMessage("😚😚😚", threadID);
   };
   
   if ((event.body.toLowerCase() == "😙") || (event.body.toLowerCase() == "😙😙")) {
     return api.sendMessage("😗😗😗", threadID);
   };
   
   if ((event.body.toLowerCase() == "😚") || (event.body.toLowerCase() == "😚😚")) {
     return api.sendMessage("😗😙😚", threadID);
   };
   
   if ((event.body.toLowerCase() == "😘") || (event.body.toLowerCase() == "😘😘")) {
     return api.sendMessage("MeKo BHi kR L0o Naw Pappi 🥹", threadID);
   };
   
   if ((event.body.toLowerCase() == "🥰") || (event.body.toLowerCase() == "🥰🥰")) {
     return api.sendMessage("Aww Love You Naw Jaan 😘", threadID);
   };
   
   if ((event.body.toLowerCase() == "😍") || (event.body.toLowerCase() == "😍😍")) {
     return api.sendMessage("ChaLl Hatt ThaRki", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤩") || (event.body.toLowerCase() == "🤩🤩")) {
     return api.sendMessage("InSano Ki Ankhe HoTi Uh Ke Star Hain 😂😂😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🥳") || (event.body.toLowerCase() == "🥳🥳")) {
     return api.sendMessage("0oo0o TeRa HaPpy BirthDay", threadID);
   };
   
   
   if ((event.body.toLowerCase() == "🙃") || (event.body.toLowerCase() == "🙃🙃")) {
     return api.sendMessage("HaYe Rabba ☹️", threadID);
   };
   
   if ((event.body.toLowerCase() == "🙂") || (event.body.toLowerCase() == "🙂🙂")) {
     return api.sendMessage("Awww Fake Smile Na Do Me Hu Naw Baby 🥺🥹🥹", threadID);
   };
   
   if ((event.body.toLowerCase() == "🥲") || (event.body.toLowerCase() == "🥲🥲")) {
     return api.sendMessage("Ase Muu BaNa KRr MT R0o 😒", threadID);
   };
   
   if ((event.body.toLowerCase() == "😊") || (event.body.toLowerCase() == "😊😊")) {
     return api.sendMessage("AaJ Tuu BahUt KhuSh Ho 🫡", threadID);
   };
   
   if ((event.body.toLowerCase() == "☺️") || (event.body.toLowerCase() == "☺️☺️")) {
     return api.sendMessage("Ye Smile Na D0o Naw🥺", threadID);
   };
   
   if ((event.body.toLowerCase() == "😌") || (event.body.toLowerCase() == "😌😌")) {
     return api.sendMessage("HaYe Mas0om", threadID);
   };
   
   if ((event.body.toLowerCase() == "😏") || (event.body.toLowerCase() == "😏😏")) {
     return api.sendMessage("SasTa AttiTude Mtt dekHya kR MerY SamNy 😒😐", threadID);
   };
   
   if ((event.body.toLowerCase() == "😴") || (event.body.toLowerCase() == "😴😴")) {
     return api.sendMessage("ChaL Ja NaHa kRr Aa", threadID);
   };
   
   if ((event.body.toLowerCase() == "😪") || (event.body.toLowerCase() == "😪😪")) {
     return api.sendMessage("Ye kYa kR rahY Apni  Nose Sth🤔😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤤") || (event.body.toLowerCase() == "🤤🤤")) {
     return api.sendMessage("Ral Mat Tapka MeKo ulTi Aa Rhi 🤮🤢", threadID);
   };
   
   if ((event.body.toLowerCase() == "😋") || (event.body.toLowerCase() == "😋😋")) {
     return api.sendMessage("Yah ToTay Jesi Zuban Mt DiKha 😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "😛") || (event.body.toLowerCase() == "😛😛")) {
     return api.sendMessage("Aww Gandyy 😂😂😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "😝") || (event.body.toLowerCase() == "😝😝")) {
     return api.sendMessage("ABy Ankhe KhoL 0or ZuBan Ander kRr WRna KaT DunGa", threadID);
   };
   
   if ((event.body.toLowerCase() == "😜") || (event.body.toLowerCase() == "😜😜")) {
     return api.sendMessage("BaRi MasTi ChaRi Chai TeRy Ko 1 Ankh Band KRrke ZuBan Bhir Aagyi 😂😂😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤪") || (event.body.toLowerCase() == "🤪🤪")) {
     return api.sendMessage("Ye Ajeeb_0_GaReeb Muu Na BaNa 😂 CarT0on 🤣", threadID);
   };
   
   if ((event.body.toLowerCase() == "🥴") || (event.body.toLowerCase() == "🥴🥴")) {
     return api.sendMessage("SasTa Nasha KRr LiYa LagTa Hai 😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "😔") || (event.body.toLowerCase() == "😔😔")) {
     return api.sendMessage("JanU ChoR Gyaw Kya 😒😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🥺") || (event.body.toLowerCase() == "🥺🥺")) {
     return api.sendMessage("Hayye BabY Looty Ni Naw ye loo pioo 🍼🥺", threadID);
   };
   
   if ((event.body.toLowerCase() == "😬") || (event.body.toLowerCase() == "😬😬")) {
     return api.sendMessage("Kis Ki Baja Di 🤨🧐", threadID);
   };
   
   if ((event.body.toLowerCase() == "😑") || (event.body.toLowerCase() == "😑😑")) {
     return api.sendMessage("Wha Muu Ke SaTh Ankhe Be Band H0o GYi 😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "😐") || (event.body.toLowerCase() == "😐😐")) {
     return api.sendMessage("TeRyy Muhh Py Elfiii Lgaw Di kYa ksi ny 😹", threadID);
   };
   
   if ((event.body.toLowerCase() == "😶") || (event.body.toLowerCase() == "😶😶")) {
     return api.sendMessage("Nak T0o Thi Nhi Muu Be Gyb H0o GYa TeRa 😂😂😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤐") || (event.body.toLowerCase() == "🤐🤐")) {
     return api.sendMessage("Ab Tri Awaz Ai Na T0o Me Alfi Sy Band Krunga 😒", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤔") || (event.body.toLowerCase() == "🤔🤔")) {
     return api.sendMessage("KashmiR AZaaD KrwanY Ka SocH RahY Tyaa 🙄🤔", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤫") || (event.body.toLowerCase() == "🤫🤫")) {
     return api.sendMessage("Tri Yeh Ungli Tri He Nak Me DyDeni MaiNy 😒😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤭") || (event.body.toLowerCase() == "🤭🤭")) {
     return api.sendMessage("😂😂😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🥱") || (event.body.toLowerCase() == "🥱")) {
     return api.sendMessage("Aa ja BaBy MeLy Pas So Jaa😜", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤗") || (event.body.toLowerCase() == "🤗🤗")) {
     return api.sendMessage("PhLe NaHa kRr Aa 😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "😱") || (event.body.toLowerCase() == "😱😱")) {
     return api.sendMessage("KYa HuWa 😱 SheSha DeKh LiYa KYa 😳", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤨") || (event.body.toLowerCase() == "🤨🤨")) {
     return api.sendMessage("Tu Hushyar Ban kRr Na Dekh Main Hun Naw 😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "🧐") || (event.body.toLowerCase() == "🧐🧐")) {
     return api.sendMessage("Tu HaT Main DekhTa Hun 🧐🧐🧐", threadID);
   };
   
   if ((event.body.toLowerCase() == "😒") || (event.body.toLowerCase() == "😒😒")) {
     return api.sendMessage("AsY DekH Rahy Ho MujHe Mas0om ki Jan leNi Hai Tyaa 🥺", threadID);
   };
   
   if ((event.body.toLowerCase() == "🙄") || (event.body.toLowerCase() == "🙄🙄")) {
     return api.sendMessage("UpeR KyA DekH ReHe Ho 🙄", threadID);
   };
   
   if ((event.body.toLowerCase() == "😤") || (event.body.toLowerCase() == "😤😤")) {
     return api.sendMessage("AbbY Ye kYa kR raHa hai 😂", threadID);
   };
   
   if ((event.body.toLowerCase() == "😠") || (event.body.toLowerCase() == "😠😠")) {
     return api.sendMessage("Ma nY Taaa tiYa Jo GhuSsa KRr RahY 🥺😢", threadID);
   };
   
   if ((event.body.toLowerCase() == "😡") || (event.body.toLowerCase() == "😡😡")) {
     return api.sendMessage("Ma nY Taaa tiYa Jo GhuSsa KRr RahY 🥺😢", threadID);
   };
   
   if ((event.body.toLowerCase() == "🤬") || (event.body.toLowerCase() == "🤬🤬")) {
     return api.sendMessage("Aww 😐", threadID);
   };
   
   if ((event.body.toLowerCase() == "😞") || (event.body.toLowerCase() == "😞😞")) {
     return api.sendMessage("Aww My lOve UpR UtHao Muh", threadID);
   };
   
      if ((event.body.toLowerCase() == "😓") || (event.body.toLowerCase() == "😓😓")) {
     return api.sendMessage("☹️", threadID);
   };
   
      if ((event.body.toLowerCase() == "😢") || (event.body.toLowerCase() == "😢😢")) {
     return api.sendMessage("Looo Ni Melii Jàwn", threadID);
   };
   
      if ((event.body.toLowerCase() == "☹️") || (event.body.toLowerCase() == "☹️☹️")) {
     return api.sendMessage("awww baby🥺", threadID);
   };
   
      if ((event.body.toLowerCase() == "🙁") || (event.body.toLowerCase() == "🙁🙁")) {
     return api.sendMessage("Aww taa Huwa☹️", threadID);
   };
   
      if ((event.body.toLowerCase() == "😕") || (event.body.toLowerCase() == "😕😕")) {
     return api.sendMessage("🙁🙁🙁", threadID);
   };
   
      if ((event.body.toLowerCase() == "😰") || (event.body.toLowerCase() == "😰😰")) {
     return api.sendMessage("Aww 😨", threadID);
   };
   
   
      if ((event.body.toLowerCase() == "😨") || (event.body.toLowerCase() == "😨😨")) {
     return api.sendMessage("😰😰😰", threadID);
   };
   
      if ((event.body.toLowerCase() == "😧") || (event.body.toLowerCase() == "😧😧")) {
     return api.sendMessage("😳", threadID);
   };
   
      if ((event.body.toLowerCase() == "😦") || (event.body.toLowerCase() == "😦😦")) {
     return api.sendMessage("😧", threadID);
   };
   
      if ((event.body.toLowerCase() == "😮") || (event.body.toLowerCase() == "😮😮")) {
     return api.sendMessage("OYyye MuuH BanD KRr WrNa MakHi Chali JaNi Hai😂😂😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "😯") || (event.body.toLowerCase() == "😯😯")) {
     return api.sendMessage("😲", threadID);
   };
   
      if ((event.body.toLowerCase() == "😲") || (event.body.toLowerCase() == "😲😲")) {
     return api.sendMessage("😯", threadID);
   };
   
      if ((event.body.toLowerCase() == "😳") || (event.body.toLowerCase() == "😳😳")) {
     return api.sendMessage("Kya hOgYa Inna AnkhY PhaR pHar k MujhY ku Dekh Rahy Ho 😳😳😳", threadID);
   };
   
      if ((event.body.toLowerCase() == "🤯") || (event.body.toLowerCase() == "🤯🤯")) {
     return api.sendMessage("TeRy Sar Me BumB Kis Ny PhoRa 😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "😖") || (event.body.toLowerCase() == "😖😖")) {
     return api.sendMessage("ShaDeed Sad Ho kAaa BabY😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "😣") || (event.body.toLowerCase() == "😣😣")) {
     return api.sendMessage("😣😣😣", threadID);
   };
   
      if ((event.body.toLowerCase() == "😩") || (event.body.toLowerCase() == "😫")) {
     return api.sendMessage("ChaL HaT NoTanKii😫😂😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "😵") || (event.body.toLowerCase() == "😵😵")) {
     return api.sendMessage("TeRi Eyes kiDr Gyye😟", threadID);
   };
   
      if ((event.body.toLowerCase() == "🥶") || (event.body.toLowerCase() == "sardi")) {
     return api.sendMessage("Aww BaBe  SarDi Lag Rhi T0o MeRe PaSs Ajao 🙈😜", threadID);
   };
   
      if ((event.body.toLowerCase() == "🥵") || (event.body.toLowerCase() == "🥵🥵")) {
     return api.sendMessage("NaHa Le 😂🥶", threadID);
   };
   
      if ((event.body.toLowerCase() == "🤢") || (event.body.toLowerCase() == "🤮")) {
     return api.sendMessage("Aaaaa Tho0oo", threadID);
   };
   
      if ((event.body.toLowerCase() == "🤧") || (event.body.toLowerCase() == "😷")) {
     return api.sendMessage("Aryy BhaG Ja0o MeKo bHi BeemaR kR0o gaY 🥺", threadID);
   };
   
      if ((event.body.toLowerCase() == "🤒") || (event.body.toLowerCase() == "🤕")) {
     return api.sendMessage("Aww BaBe K0o Ta HuWa Idher Aow ThoRa Pyal L0o 😜💉💉💉", threadID);
   };
   
      if ((event.body.toLowerCase() == "😎") || (event.body.toLowerCase() == "😎😎")) {
     return api.sendMessage("ChaSHma BHi New Lelo ab 🙂", threadID);
   };
   
      if ((event.body.toLowerCase() == "😇") || (event.body.toLowerCase() == "😇😇")) {
     return api.sendMessage("😇😇😇", threadID);
   };
   
      if ((event.body.toLowerCase() == "🥸") || (event.body.toLowerCase() == "🤓")) {
     return api.sendMessage("AiNeK WaLa JiN😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "🤡") || (event.body.toLowerCase() == "🤡🤡")) {
     return api.sendMessage("Aww S0o SweeT 😂 CarT0on", threadID);
   };
   
      if ((event.body.toLowerCase() == "😈") || (event.body.toLowerCase() == "👿")) {
     return api.sendMessage("👽👽👽", threadID);
   };
   
      if ((event.body.toLowerCase() == "😹") || (event.body.toLowerCase() == "😹😹")) {
     return api.sendMessage("AbbY BiLli 😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "😺") || (event.body.toLowerCase() == "😸")) {
     return api.sendMessage("😼😼😼", threadID);
   };
   
      if ((event.body.toLowerCase() == "😼") || (event.body.toLowerCase() == "😼😼")) {
     return api.sendMessage("Ye SaSTa AttiTuDe EdR MtT DekHa😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "💋") || (event.body.toLowerCase() == "💋💋💋")) {
     return api.sendMessage("Yah PapPiYa Nhi kRr Kxh Kxh Nhi Bht KxH HoTa Hai 😂😂😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "❤️") || (event.body.toLowerCase() == "💚")) {
     return api.sendMessage("🖤🧡💜💙🤎🤍", threadID);
   };
   
      if ((event.body.toLowerCase() == "🧡") || (event.body.toLowerCase() == "🤎")) {
     return api.sendMessage("❤️🖤🤍🤎💚💜", threadID);
   };
   
      if ((event.body.toLowerCase() == "💜") || (event.body.toLowerCase() == "💙")) {
     return api.sendMessage("💚🤎🤍🖤❤️🧡", threadID);
   };
   
         if ((event.body.toLowerCase() == "🖤") || (event.body.toLowerCase() == "🤍")) {
     return api.sendMessage("❤️🧡💛💚💙💜🤎", threadID);
   };
   
      if ((event.body.toLowerCase() == "👻") || (event.body.toLowerCase() == "👻👻")) {
     return api.sendMessage("Bh0oT Hi H0o", threadID);
   };
   
      if ((event.body.toLowerCase() == "🖕") || (event.body.toLowerCase() == "🖕🖕")) {
     return api.sendMessage("Bund Me LeLe ApNi Bhens Chor 😂😂😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "💉") || (event.body.toLowerCase() == "💊")) {
     return api.sendMessage("TumHy isKi ZaiDa Zarurat Hai 🤣", threadID);
   };
   
      if ((event.body.toLowerCase() == "🙈") || (event.body.toLowerCase() == "🙊")) {
     return api.sendMessage("Sch Me Bander He Hai 😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "Chutia") || (event.body.toLowerCase() == "chutiya")) {
     return api.sendMessage("Tu Hai ChuTiya 🙂 Main T0o BoT Hun Naw🥺😂", threadID);
   };
   
      if ((event.body.toLowerCase() == "oye") || (event.body.toLowerCase() == "oyee")) {
     return api.sendMessage("0ye HoYe 😈", threadID);
   };
  
   if ((event.body.toLowerCase() == "Kkkkkk") || (event.body.toLowerCase() == "jjj")) {
     return api.sendMessage("KYa ", threadID);
   };

   if ((event.body.toLowerCase() == "Kkkkk") || (event.body.toLowerCase() == "Buraaa")) {
     return api.sendMessage(" H I J K L M N O P Q R S T U V W X Y Z 🙄", threadID);
   };

   if ((event.body.toLowerCase() == "huh") || (event.body.toLowerCase() == "hmm")) {
     return api.sendMessage("Kya Hmm 🙄ThaRki", threadID);
   };

   if ((event.body.toLowerCase() == "acha") || (event.body.toLowerCase() == "acha g")) {
     return api.sendMessage("Han Ji 🙄 Jaan", threadID);
   };

   if ((event.body.toLowerCase() == "Janu") || (event.body.toLowerCase() == "jan")) {
     return api.sendMessage("Bolo Naw MeRi JaN🥰💙", threadID);
   };

   if ((event.body.toLowerCase() == "bot goes to sleep") || (event.body.toLowerCase() == "bot goes to sleep")) {
     return api.sendMessage("I'm a bot, you're the one who should go to sleep <3", threadID);
   };

   if ((event.body.toLowerCase() == "has the bot eaten yet") || (event.body.toLowerCase() == "bot an comrade")) {
     return api.sendMessage("I'm full when I see you eat <3", threadID);
   };

   if ((event.body.toLowerCase() == "does the bot love me") || (event.body.toLowerCase() == "does the bot love me")) {
     return api.sendMessage("Yes <3", threadID);
   };

   if ((event.body.toLowerCase() == "does the bot have a brand") || (event.body.toLowerCase() == "does the bot fall")) {
     return api.sendMessage("Yes <3", threadID);
   };
   mess = "{name}"
  
  if (event.body.indexOf("Bot") == 0 || (event.body.indexOf("bot") == 0)) {
    var msg = {
      body: `「 𓆩⃝${name}𓆩๏𓆪 」,  \n
❥──────────────❥     ${rand}\n\n┏━━ೋ•  •ೋ━━┓
     𓆩𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍𓆩๏𓆪
┗━━ೋ•  •ೋ━━┛ \n
❥──────────────❥Time:\n          ${time}`
        }
    return api.sendMessage(msg, threadID, messageID);
  };

}

module.exports.run = function({ api, event, client, __GLOBAL }) { }