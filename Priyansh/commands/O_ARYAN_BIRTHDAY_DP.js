module.exports.config = {
    name: "birthday",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SHAAN KHAN",
    description: "THIS BOT WAS MADE BY SHAAN KHAN",
    commandCategory: "birthday",
    cooldowns: 0
};

module.exports.run = async function({ event, api, args, client, Currencies, Users, utils, __GLOBAL, reminder }) {
    // Security Check: Agar koi naam change karega toh script ruk jayegi
    if (module.exports.config.credits !== "SHAAN KHAN") return;

    const fs = global.nodemodule["fs-extra"];
    const request = global.nodemodule["request"];
    const axios = global.nodemodule['axios'];
    
    const shayariList = ["𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐔𝐃𝐚𝐚𝐒 𝐇𝐮 𝐏𝐚𝐑 𝐓𝐮𝐉𝐡𝐒𝐞 𝐍𝐚𝐑𝐚𝐙 𝐍𝐚𝐇𝐢 𝐓𝐞𝐑𝐞 𝐏𝐚𝐒𝐬 𝐍𝐚𝐇𝐢 𝐉𝐡𝐨𝐨𝐓 𝐊𝐚𝐇𝐮 𝐓𝐨 𝐬𝐁 𝐊𝐮𝐜𝐇 𝐇 𝐌𝐞𝐑𝐞 𝐏𝐚𝐒𝐒 𝐎𝐫 𝐒𝐚𝐜𝐇 𝐊𝐚𝐇𝐚 𝐓𝐨 𝐓𝐞𝐑𝐞 𝐒𝐢𝐖𝐚 𝐊𝐮𝐂𝐡 𝐊𝐇𝐚𝐚𝐒 𝐍𝐚𝐇𝐢 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐖𝐨𝐇 𝐊𝐡𝐮𝐒𝐡 𝐇𝐀𝐢 𝐏𝐚𝐑 𝐒𝐡𝐚𝐘𝐚𝐝 𝐇𝐮𝐌 𝐒𝐞 𝐍𝐚𝐇𝐢 𝐖𝐨𝐇 𝐍𝐚𝐑𝐚𝐉 𝐇𝐚𝐢 𝐏𝐚𝐑 𝐒𝐡𝐚𝐘𝐚𝐝 𝐇𝐮𝐌 𝐒𝐞 𝐍𝐚𝐇𝐢 𝐊𝐨𝐍 𝐊𝐞𝐇𝐚𝐓𝐚 𝐇𝐚𝐢 𝐊𝐞 𝐔𝐧𝐊𝐞 𝐃𝐢𝐥𝐥 𝐌𝐞 𝐌𝐨𝐇𝐨𝐁𝐚𝐚𝐓 𝐍𝐚𝐇𝐢 𝐌𝐨𝐇𝐨𝐁𝐚𝐚𝐓 𝐇𝐚𝐢 𝐏𝐚𝐑 𝐒𝐡𝐚𝐘𝐚𝐝 𝐇𝐮𝐌 𝐒𝐞 𝐍𝐚𝐡𝐢  ＿】  ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐌𝐮𝐣𝐡𝐊𝐨 𝐀𝐢𝐒𝐚 𝐃𝐚𝐫𝐃 𝐌𝐢𝐋𝐚 𝐉𝐢𝐬𝐊𝐢 𝐃𝐚𝐖𝐀 𝐍𝐚𝐇𝐢 𝐏𝐚𝐢𝐑 𝐁𝐡𝐢 𝐊𝐡𝐮𝐒𝐡 𝐇𝐮𝐍 𝐌𝐮𝐣𝐇𝐞 𝐔𝐬 𝐒𝐞 𝐊𝐨𝐈 𝐆𝐢𝐥𝐀 𝐍𝐚𝐇𝐢 𝐀𝐮𝐑 𝐊𝐢𝐓𝐧𝐄 𝐀𝐚𝐧𝐒𝐮 𝐁𝐚𝐇𝐚𝐔𝐧 𝐀𝐛 𝐔𝐬 𝐊𝐞 𝐋𝐢𝐘𝐚 𝐉𝐢𝐬𝐊𝐨 𝐊𝐡𝐔𝐝𝐚 𝐍𝐞 𝐌𝐞𝐑𝐞 𝐍𝐚𝐬𝐄𝐄𝐛 𝐌𝐚𝐈𝐧 𝐋𝐢𝐤𝐇𝐚 𝐇𝐢𝐍𝐚𝐇𝐢 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐊𝐢𝐓𝐍𝐚 𝐏𝐲𝐚𝐚𝐑𝐚 𝐇𝐚𝐢 𝐖𝐨 𝐒𝐡𝐀𝐪𝐒 𝐉𝐨 𝐌𝐞𝐑𝐢 𝐇𝐚𝐑 𝐙𝐮𝐁𝐚𝐚𝐍 𝐏𝐞 𝐒𝐡𝐚𝐌𝐢𝐋 𝐇𝐚𝐢 𝐘𝐞 𝐊𝐚𝐈𝐬𝐚 𝐈𝐬𝐇𝐪 𝐌𝐚𝐢 𝐌𝐞𝐑𝐚 𝐉𝐨 𝐀𝐝𝐇𝐮𝐑𝐚 𝐇𝐨𝐊𝐞 𝐁𝐡𝐢 𝐊𝐚𝐚𝐌𝐢𝐥 𝐇𝐚𝐢  ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍\n\n\n ● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐓𝐞𝐑𝐢 𝐊𝐚𝐚𝐌𝐘𝐚𝐁𝐢 𝐏𝐚𝐑 𝐓𝐚𝐑𝐞𝐞𝐅 𝐓𝐞𝐑𝐢 𝐊𝐨𝐒𝐇𝐢𝐒𝐡 𝐏𝐫 𝐓𝐚𝐚𝐍𝐚 𝐇𝐨𝐠𝐚 𝐓𝐞𝐑𝐞 𝐃𝐮𝐤𝐇 𝐌𝐞 𝐊𝐮𝐂𝐡 𝐋𝐨𝐆 𝐓𝐞𝐑𝐞 𝐒𝐮𝐊𝐡 𝐌𝐞 𝐙𝐚𝐌𝐚𝐚𝐍𝐚 𝐇𝐨𝐆𝐚  ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐍𝐚𝐚 𝐑𝐚𝐬𝐓𝐨𝐍 𝐍𝐞 𝐒𝐚𝐚𝐓𝐡 𝐃𝐢𝐘𝐚 𝐍𝐚 𝐌𝐚𝐧𝐙𝐢𝐥 𝐍𝐞 𝐈𝐧𝐓𝐞𝐙𝐚𝐚𝐑 𝐊𝐢𝐘𝐚 𝐌𝐞𝐢𝐍 𝐊𝐲𝐀 𝐥𝐢𝐊𝐇𝐮 𝐀𝐩𝐍𝐢 𝐙𝐢𝐧𝐃𝐚𝐆𝐢 𝐏𝐚𝐑 𝐌𝐞𝐑𝐞 𝐒𝐚𝐚𝐓𝐡 𝐓𝐨 𝐔𝐦𝐞𝐞𝐃𝐨𝐧 𝐍𝐞 𝐁𝐡𝐈 𝐌𝐚𝐙𝐚𝐚𝐊 𝐊𝐢𝐘𝐚 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐊𝐚𝐈𝐬𝐚 𝐃𝐢𝐤𝐇𝐓𝐚 𝐇𝐮 𝐊𝐚𝐈𝐒𝐚 𝐋𝐚𝐆𝐓𝐚 𝐇𝐮 𝐊𝐲𝐀 𝐅𝐚𝐑𝐪 𝐏𝐚𝐑𝐓𝐚 𝐇𝐚𝐈 𝐓𝐞𝐑𝐞 𝐁𝐚𝐃 𝐊𝐢𝐒𝐢 𝐊𝐨 𝐀𝐚𝐜𝐇𝐚 𝐋𝐚𝐠𝐍𝐚 𝐁𝐡𝐈 𝐌𝐮𝐣𝐇𝐞 𝐀𝐚𝐜𝐇𝐚 𝐍𝐚𝐇𝐢 𝐋𝐚𝐠𝐓𝐚 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐍𝐚 𝐉𝐚𝐚𝐍𝐞 𝐊𝐢𝐒 𝐓𝐚𝐑𝐚𝐇 𝐊𝐚 𝐈𝐬𝐇𝐪 𝐊𝐚𝐑 𝐑𝐞𝐇𝐞 𝐇𝐚𝐈𝐧 𝐇𝐮𝐌 𝐉𝐢𝐒𝐤𝐄 𝐇𝐨 𝐍𝐚𝐇𝐢 𝐒𝐚𝐊𝐭𝐄 𝐔𝐬 𝐇𝐢 𝐊𝐞 𝐇𝐢 𝐊𝐞 𝐇𝐨 𝐑𝐞𝐡𝐄 𝐇𝐚𝐈 𝐇𝐮𝐌 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐓𝐞𝐑𝐢 𝐂𝐡𝐚𝐇𝐚𝐓 𝐌𝐞𝐢𝐍 𝐢𝐓𝐧𝐚 𝐂𝐡𝐚𝐇𝐧𝐄 𝐓𝐇𝐢 𝐊𝐢 𝐏𝐚𝐢𝐑 𝐊𝐢𝐒𝐢 𝐂𝐡𝐚𝐇𝐧𝐄 𝐊𝐢 𝐂𝐡𝐚𝐇𝐚𝐓 𝐊𝐢 𝐂𝐡𝐚𝐇𝐚𝐓 𝐍𝐚 𝐑𝐞𝐇𝐢 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐙𝐢𝐧𝐃𝐚𝐆𝐢 𝐌𝐞𝐢𝐧 𝐀𝐠𝐚𝐑 𝐊𝐮𝐜𝐇 𝐁𝐮𝐑𝐚 𝐇𝐨 𝐓𝐨𝐇 𝐒𝐚𝐁𝐚𝐑 𝐑𝐚𝐊𝐡𝐎 𝐊𝐲𝐔𝐧𝐊𝐢 𝐑𝐨𝐨 𝐊𝐚𝐑 𝐅𝐢𝐑 𝐇𝐚𝐒𝐧𝐄 𝐊𝐚 𝐌𝐚𝐙𝐚 𝐇𝐢 𝐚𝐥𝐀𝐠 𝐇𝐨𝐓𝐚 𝐇𝐚𝐢 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐈𝐦 𝐍𝐨𝐓 𝐎𝐤𝐚𝐘 𝐊𝐲𝐮𝐍 𝐊𝐢 𝐀𝐚𝐩𝐊𝐢 𝐘𝐚𝐚𝐃 𝐑𝐮𝐋𝐚𝐓𝐢 𝐇𝐚𝐢 𝐁𝐚𝐇𝐨𝐓 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n ●──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐓𝐮𝐣𝐇𝐞 𝐏𝐚𝐓𝐚 𝐊𝐲𝐔 𝐍𝐚𝐇𝐢 𝐂𝐡𝐚𝐥𝐓𝐚 ! 𝐤𝐢 𝐌𝐞𝐑𝐞 𝐓𝐞𝐑𝐚 𝐁𝐢𝐍𝐚 𝐃𝐢𝐥 𝐍𝐚𝐇𝐢 𝐋𝐠𝐓a ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍\n\n\n ● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿𝐆𝐮𝐬𝐬𝐀 𝐊𝐢𝐓𝐧𝐀 𝐁𝐡𝐢 𝐇𝐨 𝐏𝐲𝐚𝐚𝐑 𝐓𝐮𝐌 𝐇𝐢 𝐇𝐨 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐌𝐢𝐋𝐞 𝐓𝐡𝐄 𝐄𝐤 𝐀𝐉𝐧𝐚𝐁𝐢 𝐁𝐚𝐧𝐊𝐚𝐑 𝐀𝐚𝐣 𝐌𝐞𝐫𝐞 𝐃𝐢𝐥 𝐊𝐢 𝐙𝐚𝐑𝐨𝐨𝐑𝐚𝐓 𝐇𝐨 𝐓𝐮𝐌 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭.",
                         "𝐎𝐰𝐧𝐞𝐫 ➻  ────  𝐒𝐇𝐀𝐀𝐍  𝐊𝐇𝐀𝐍 \n\n\n● ──────────────────── ●\n\n\n𝐇𝐚𝐩𝐩𝐘 𝐁𝐢𝐫𝐓𝐡𝐃𝐚𝐘\n\n\n● ──────────────────── ●\n\n\n ⎯ⷨ͢⟵͇̽💗⃪꯭ⷯ༆⁂𝄄❘⍣ 【＿ 𝐓𝐞𝐑𝐚 𝐒𝐚𝐚𝐓𝐡 🙄 𝐓𝐞𝐑𝐢 𝐁𝐚𝐚𝐓𝐞𝐢𝐍 🥰 𝐓𝐞𝐑𝐢 𝐂𝐚𝐑𝐞 😘 𝐓𝐞𝐑𝐢 𝐑𝐞𝐬𝐏𝐞𝐜𝐓 😍 𝐭𝐞𝐑𝐚 𝐏𝐲𝐚𝐑 😶 𝐁𝐚𝐬 𝐘𝐚𝐇𝐢 𝐂𝐡𝐚𝐇𝐢𝐘𝐞 𝐌𝐮𝐣𝐇𝐞 🙈🙈 ＿】 ⎯᪵⎯꯭̽𝆺꯭𝅥🌿꯭."
    ];

    const randomShayari = shayariList[Math.floor(Math.random() * shayariList.length)];

    const sendShayariWithProfilePic = (shayari, picture) => {
        api.sendMessage({
            body: shayari,
            attachment: fs.createReadStream(picture)
        }, event.threadID, () => fs.unlinkSync(picture), event.messageID);
    };

    const sendProfilePic = (uid, shayari) => {
        const callback = () => sendShayariWithProfilePic(shayari, __dirname + "/cache/1.png");
        return request(encodeURI(`https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`))
            .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
            .on('close', callback);
    };

    const sendWarningMessage = () => {
        api.sendMessage("DON'T CHANGE CREDIT, SHAAN KHAN IS THE OWNER", event.threadID);
    };

    if (event.type == "message_reply") {
        let name = await Users.getNameUser(event.messageReply.senderID);
        const uid = event.messageReply.senderID;
        sendProfilePic(uid, randomShayari);
    } else {
        let uid;
        if (!args[0]) {
            uid = event.senderID;
        } else if (args[0].indexOf(".com/") !== -1) {
            const res_ID = await api.getUID(args[0]);
            uid = res_ID;
        } else if (args.join().indexOf('@') !== -1) {
            uid = Object.keys(event.mentions)[0];
        }
        sendProfilePic(uid, randomShayari);
    }

    if (event.name == "shayri" && args[0] == "credits") {
        sendWarningMessage();
    }
};
