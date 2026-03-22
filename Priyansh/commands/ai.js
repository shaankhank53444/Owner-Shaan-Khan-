const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { resolveUserProfile } = global.gender || require("../../utils/gender");

const API_URL = "https://priyanshuapi.xyz/api/runner/priyanshu-ai";
const HISTORY_FILE = path.join(__dirname, "cache", "ai_history.json");
const HISTORY_LIMIT = 8;
const DEFAULT_PERSONA = "friendly";

// --- API KEY FIX ---
const PRIYANSHU_API_KEY = "apim_aMGZ6l2b_iRNov8Y7fGMdQw67mc7uj7XnkJLxYz-emw"; 
const SYSTEM_PROMPT = "Your name is Shaan Khan. You are from Bannu, KPK, Pakistan. You are a helpful AI.";

// --- START OF ORIGINAL OBFUSCATED CODE (UNCHANGED LOGIC) ---
function _0x2cc2(){const _0x19a030=['WAOQq','8UQdATu','ync','287551LcbXWF','344JBmEpf','56jTomuQ','437328yjViEK','497735tegqAW','writeFileS','mkdirSync','6804504wdVFhe','162645zxbHYP','existsSync','dirname','3271cXwWKF','utf8','10772568isPkUF','1570UcZRch'];_0x2cc2=function(){return _0x19a030;};return _0x2cc2();}function _0x2da8(_0xe1d43f,_0x514fdc){_0xe1d43f=_0xe1d43f-(0x223d+0x13d8+-0x34db);const _0x521550=_0x2cc2();let _0x323d5e=_0x521550[_0xe1d43f];return _0x323d5e;}(function(_0x164ed4,_0x40f441){const _0x1da188=_0x2da8,_0x193024=_0x164ed4();while(!![]){try{const _0x289dfc=parseInt(_0x1da188(0x14a))/(0x1fa1+-0x1eb*0xe+-0x2f*0x1a)*(-parseInt(_0x1da188(0x141))/(-0x16e2+-0x2ed*0x7+0x2b5f))+-parseInt(_0x1da188(0x142))/(0x26a7+0x2fd+0x1*-0x29a1)+-parseInt(_0x1da188(0x13d))/(-0x27a+0x3c1*0x3+-0x8c5)*(-parseInt(_0x1da188(0x143))/(-0x1*-0x2551+-0x26f*0x4+-0x1b90))+-parseInt(_0x1da188(0x146))/(0x3d*0x3e+0x20a3+-0x2f63)+-parseInt(_0x1da188(0x147))/(-0x177e*-0x1+-0x1*-0x30a+-0x1a81*0x1)*(parseInt(_0x1da188(0x140))/(0xcfe+0x50b*-0x2+0x5c*-0x8))+-parseInt(_0x1da188(0x13a))/(0x1ac+-0x18ef+0x1f1*0xc)+-parseInt(_0x1da188(0x13b))/(-0x1e7e*-0x1+0x19f5+-0x3869)*(-parseInt(_0x1da188(0x13f))/(-0x27*0xd+-0xd80+-0x7c3*-0x2));if(_0x289dfc===_0x40f441)break;else _0x193024['push'](_0x193024['shift']());}catch(_0x3861ba){_0x193024['push'](_0x193024['shift']());}}}(_0x2cc2,0x71*0x1d95+-0x21c06+-0x472f*-0x1));function ensureHistoryFile(){const _0x5c2ca8=_0x2da8,_0x4b2600={'WAOQq':_0x5c2ca8(0x14b)},_0x20b969=path[_0x5c2ca8(0x149)](HISTORY_FILE);!fs[_0x5c2ca8(0x148)](_0x20b969)&&fs[_0x5c2ca8(0x145)](_0x20b969,{'recursive':!![]}),!fs[_0x5c2ca8(0x148)](HISTORY_FILE)&&fs[_0x5c2ca8(0x144)+_0x5c2ca8(0x13e)](HISTORY_FILE,'{}',_0x4b2600[_0x5c2ca8(0x13c)]);}
function _0x5bd2(){const _0x2d6683=['pnmnH','5mgCEmr','[AI\x20HISTOR','to\x20read\x20hi','1BkFSxu','1599956KfjGWU','parse','story\x20stor','405fOWyoh','8526360EpMgwo','429JHHoAz','BJZul','130720CrYYCD','251410PatRyh','error','AiLrY','10112851NvQjJc','537902kCHwXD','utf8','Y]\x20Failed\x20','2673366GZkUAd','rzZup','readFileSy'];_0x5bd2=function(){return _0x2d6683;};return _0x5bd2();}(function(_0x4cd85b,_0x347c04){const _0x35b2e4=_0x3a03,_0xe35d5b=_0x4cd85b();while(!![]){try{const _0xe1638a=-parseInt(_0x35b2e4(0x7c))/(-0x5*0x5d1+-0x8*0x21d+0x2dfe)*(parseInt(_0x35b2e4(0x89))/(-0x1*-0x65f+0x99f+-0xffc))+-parseInt(_0x35b2e4(0x8c))/(-0x96a+-0x11c4+0x1b31)+-parseInt(_0x35b2e4(0x7d))/(-0x153+-0x461*0x8+-0x245f*-0x1)*(-parseInt(_0x35b2e4(0x79))/(-0xe3*-0x21+0x19b6+0x4*-0xdbd))+-parseInt(_0x35b2e4(0x81))/(-0x2ed*-0xd+0x148+0x3*-0xd19)+parseInt(_0x35b2e4(0x88))/(-0x978+0x1*0x26b3+-0x42c*0x7)+parseInt(_0x35b2e4(0x84))/(0x14c+-0xccd+-0xb89*-0x1)*(parseInt(_0x35b2e4(0x80))/(-0x7*-0xc9+0x1145+-0x16bb))+parseInt(_0x35b2e4(0x85))/(-0x16dd+-0x1c5d+0x3344)*(parseInt(_0x35b2e4(0x82))/(0x8*0x1ff+-0x86+-0xf67));if(_0xe1638a===_0x347c04)break;else _0xe35d5b['push'](_0xe35d5b['shift']());}catch(_0x353171){_0xe35d5b['push'](_0xe35d5b['shift']());}}}(_0x5bd2,-0x1989c3+-0x9735a*-0x1+0x1f07fd));function _0x3a03(_0x1862dd,_0x199ebd){_0x1862dd=_0x1862dd-(0x1*-0x13c6+-0x1*-0x1ad7+-0x69a);const _0x32b08d=_0x5bd2();let _0x415d03=_0x32b08d[_0x1862dd];return _0x415d03;}function readHistoryStore(){const _0x51abab=_0x3a03,_0x3184c1={'rzZup':function(_0x5c6551){return _0x5c6551();},'pnmnH':_0x51abab(0x8a),'AiLrY':function(_0xa17dc9,_0x4f73b0){return _0xa17dc9||_0x4f73b0;},'BJZul':_0x51abab(0x7a)+_0x51abab(0x8b)+_0x51abab(0x7b)+_0x51abab(0x7f)+'e:'};_0x3184c1[_0x51abab(0x8d)](ensureHistoryFile);try{const _0x582d9f=fs[_0x51abab(0x77)+'nc'](HISTORY_FILE,_0x3184c1[_0x51abab(0x78)]);return JSON[_0x51abab(0x7e)](_0x3184c1[_0x51abab(0x87)](_0x582d9f,'{}'));}catch(_0x523e42){return console[_0x51abab(0x86)](_0x3184c1[_0x51abab(0x83)],_0x523e42),{};}}
(function(_0x522c5d,_0x5906df){var _0x522c5d=_0x152b,_0x58f3fc=_0x20a1();while(!![]){try{var _0x36d2b3=parseInt(_0x522c5d(0x16f))/(-0x18ca+-0x10b1+0x297c)+parseInt(_0x522c5d(0x165))/(-0xb+0x8fd+0x8f0*-0x1)+-parseInt(_0x522c5d(0x167))/(0xa3c+-0x1*-0x21a7+-0x8*0x57c)*(-parseInt(_0x522c5d(0x15e))/(0x1*-0x54f+0x12e1+0xa*-0x15b))+parseInt(_0x522c5d(0x16d))/(0x357+0x2024+-0x2*0x11bb)+-parseInt(_0x522c5d(0x16e))/(-0x283+-0x1*-0x3d1+-0x148)+parseInt(_0x522c5d(0x16a))/(-0x1*0xaf1+0x1*-0x8b9+0x13b1)+parseInt(_0x522c5d(0x15b))/(0x3*0x589+-0x4c*-0x61+-0x1*0x2d5f)*(-parseInt(_0x522c5d(0x15d))/(-0x1fd9*0x1+0x17b*0x1+-0x1*-0x1e67));if(_0x36d2b3===_0x5906df)break;else _0x58f3fc['push'](_0x58f3fc['shift']());}catch(_0x1c53c6){_0x58f3fc['push'](_0x58f3fc['shift']());}}}(_0x20a1,0x20a1));function _0x20a1(){var _0x17e2c9=['2400006NWOgcK','stringify','vdGhp','3592640cAeznI','259464MlRLXo','492026jVTtfr','MOPxF','7576CaGxAD','Y]\x20Failed\x20','18054gQRXYO','4FASnTI','nOURA','error','istory\x20sto','writeFileS','re:','utf8','1195090HPajag','[AI\x20HISTOR','481287lcUOFN','ync','to\x20write\x20h'];_0x20a1=function(){return _0x17e2c9;};return _0x20a1();}function _0x152b(_0x62c511,_0x407200){_0x62c511=_0x62c511-(-0xed2+0x4f6+0xb37*0x1);var _0x21c2a7=_0x20a1();var _0x46ad13=_0x21c2a7[_0x62c511];return _0x46ad13;}function writeHistoryStore(_0x468948){var _0x4487e5=_0x152b,_0x3e6c6={'nOURA':function(_0x579511){return _0x579511();},'MOPxF':_0x4487e5(0x164),'vdGhp':_0x4487e5(0x166)+_0x4487e5(0x15c)+_0x4487e5(0x169)+_0x4487e5(0x161)+_0x4487e5(0x163)};try{_0x3e6c6[_0x4487e5(0x15f)](ensureHistoryFile),fs[_0x4487e5(0x162)+_0x4487e5(0x168)](HISTORY_FILE,JSON[_0x4487e5(0x16b)](_0x468948,null,-0x15de+0x2*-0x902+0x27e4),_0x3e6c6[_0x4487e5(0x170)]);}catch(_0x42fa0d){console[_0x4487e5(0x160)](_0x3e6c6[_0x4487e5(0x16c)],_0x42fa0d);}}
function _0x2f0c(){const _0x41c319=['isArray','slice','822285yQEbqy','1919208ScQhoi','100EzXlSp','17049qWTFFT','5376170FEHKcO','8jLBXKM','rMyUb','2244414xhiiyM','5018688fbfaxr','604814zjgTLl','36dySHdB'];_0x2f0c=function(){return _0x41c319;};return _0x2f0c();}function _0x1266(_0x5a81ca,_0x29cb2e){_0x5a81ca=_0x5a81ca-(-0xfe+-0x96+0x1f8);const _0x3d8be9=_0x2f0c();let _0x421bbb=_0x3d8be9[_0x5a81ca];return _0x421bbb;}function getUserHistory(_0x14716b){const _0x5f1970=_0x1266,_0xb012c5={'rMyUb':function(_0x1c7ba7){return _0x1c7ba7();}},_0x167b02=_0xb012c5[_0x5f1970(0x64)](readHistoryStore),_0x593b73=Array[_0x5f1970(0x69)](_0x167b02[_0x14716b])?_0x167b02[_0x14716b]:[];return _0x593b73[_0x5f1970(0x6a)](-HISTORY_LIMIT);}
function _0x45da(){const _0x4129f5=['16690AfjkDs','20229ZRZGAL','232smFsOc','VPBxg','fUPLL','6098435VbieZN','4hdOVYh','445604ZjcEca','484038yfpIsF','678VmkHaE','10460GxeSMV','slice','8192382wndBIA','6929840EBQFUi'];_0x45da=function(){return _0x4129f5;};return _0x45da();}function _0x580b(_0x52aa46,_0xb47815){_0x52aa46=_0x52aa46-(0x88d*0x1+-0x10a9+-0x36*-0x29);const _0x80df67=_0x45da();let _0x3c90f2=_0x80df67[_0x52aa46];return _0x3c90f2;}function saveUserHistory(_0x3cdec4,_0x21d0d2){const _0x2a300a=_0x580b,_0x372ce6={'VPBxg':function(_0x281f14){return _0x281f14();},'fUPLL':function(_0x9d31f,_0x56c007){return _0x9d31f(_0x56c007);}},_0x268715=_0x372ce6[_0x2a300a(0x91)](readHistoryStore);_0x268715[_0x3cdec4]=_0x21d0d2[_0x2a300a(0x8b)](-HISTORY_LIMIT),_0x372ce6[_0x2a300a(0x92)](writeHistoryStore,_0x268715);}

// --- MODIFIED API CALL FOR SHAAN KHAN identity ---
async function callPriyanshuApi(_0x4e761b,_0x37936b){
  const response = await axios.post(API_URL, {
    prompt: _0x4e761b,
    model: "priyansh-ai",
    messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ..._0x37936b.slice(-HISTORY_LIMIT)
    ],
    persona: DEFAULT_PERSONA
  }, {
    headers: {
      "Authorization": "Bearer " + PRIYANSHU_API_KEY,
      "Content-Type": "application/json"
    }
  });
  return response.data.data.choices[0].message.content.trim();
}

async function getAiReply(_0x7d69d9,_0x4a6764){
  const history = getUserHistory(_0x7d69d9);
  const currentMsg = [...history, { role: "user", content: _0x4a6764 }];
  const aiResponse = await callPriyanshuApi(_0x4a6764, currentMsg);
  const updatedHistory = [...currentMsg, { role: "assistant", content: aiResponse }];
  saveUserHistory(_0x7d69d9, updatedHistory);
  return aiResponse;
}
// --- END OF ORIGINAL OBFUSCATED CODE ---

module.exports = {
  config: {
    name: "ai",
    aliases: ["ask", "chat", "bot"],
    description: "Talk to AI with Smart Intent Sensing (Shaan Khan Edition)",
    usage: "{prefix}ai <your message>",
    credit: "Shaan Khan",
    hasPrefix: false,
    permission: 'PUBLIC',
    cooldown: 5,
    category: 'AI'
  },

  run: async function({ api, message, args, client }) {
    const { threadID, messageID, senderID } = message;

    if (!args.length) {
       return api.sendMessage("🥀 Salaam! Main Shaan Khan hoon Bannu (KPK) se. Kuch poochna hai toh message likhein.", threadID, messageID);
    }

    const promptText = args.join(" ").trim();
    const lowerText = promptText.toLowerCase();

    // --- 🤖 SMART INTENT LOGIC (Wahi original wala) ---
    const orderWords = ["bhejo", "dikhana", "suna", "play", "send", "download", "search", "dhoondho", "chahiye"];
    const mediaWords = ["gana", "song", "video", "music", "reel"];
    
    const hasOrder = orderWords.some(w => lowerText.includes(w));
    const hasMedia = mediaWords.some(w => lowerText.includes(w));

    if (hasOrder && hasMedia) {
        const query = promptText.replace(/(bot|ai|bhejo|dikhana|suna|play|send|download|search|dhoondho|chahiye|gana|song|video|music|reel)/gi, "").trim();
        if (query.length > 2) {
            api.sendMessage(`✨ Finding "${query}" for you...`, threadID);
            const cmd = (lowerText.includes("video") || lowerText.includes("reel")) ? "video" : "song";
            if (global.client.commands.has(cmd)) {
                return global.client.commands.get(cmd).run({ api, message, args: [query], client });
            }
        }
    }

    try {
      const aiResponse = await getAiReply(senderID, promptText);
      api.sendMessage(`🤖 ${aiResponse}`, threadID, (err, info) => {
        if (err) return;
        const replies = global.client.replies.get(threadID) || [];
        replies.push({ command: this.config.name, messageID: info.messageID, expectedSender: senderID, data: {} });
        global.client.replies.set(threadID, replies);
      }, messageID);
    } catch (error) {
      return api.sendMessage("❌ AI API Error. Key check karein.", threadID, messageID);
    }
  },

  handleReply: async function({ api, message, client }) {
    if (!message.messageReply) return;
    const { threadID, messageID, senderID, body } = message;
    if (!body) return;

    try {
      const aiResponse = await getAiReply(senderID, body);
      api.sendMessage(`🤖 ${aiResponse}`, threadID, (err, info) => {
        const replies = global.client.replies.get(threadID) || [];
        const updated = replies.filter(r => r.messageID !== message.messageReply.messageID);
        updated.push({ command: this.config.name, messageID: info.messageID, expectedSender: senderID, data: {} });
        global.client.replies.set(threadID, updated);
      }, messageID);
    } catch (e) { console.error(e); }
  }
};
