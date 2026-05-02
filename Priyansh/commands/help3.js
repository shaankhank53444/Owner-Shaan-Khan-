module.exports.config = {
  name: "help3",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
  description: "Commands list aur word search",
  commandCategory: "system",
  usages: "[word/command]",
  cooldowns: 1
};

module.exports.run = function({ api, event, args }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;

  if (args[0]) {
    const input = args[0].toLowerCase();
    
    if (commands.has(input)) {
      const command = commands.get(input);
      const msg = `───── 『 ${command.config.name.toUpperCase()} 』 ─────\n\n📝 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧: ${command.config.description}\n⚙️ 𝐔𝐬𝐚𝐠𝐞: ${prefix}${command.config.name} ${command.config.usages || ""}\n📂 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${command.config.commandCategory}\n✍️ 𝐂𝐫𝐞𝐝𝐢𝐭𝐬: ${command.config.credits}`;
      return api.sendMessage(msg, threadID, messageID);
    } 
    
    else {
      const filtered = [];
      for (const [name] of commands) {
        if (name.startsWith(input)) filtered.push(name);
      }

      if (filtered.length > 0) {
        let list = `🔎 '${input.toUpperCase()}' 𝐒𝐞 𝐒𝐡𝐮𝐫𝐮 𝐇𝐨𝐧𝐞 𝐖𝐚𝐥𝐞 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:\n\n`;
        list += filtered.map(c => `  » ${prefix}${c}`).join("\n");
        return api.sendMessage(list, threadID, messageID);
      } else {
        return api.sendMessage(`❌ 𝐊𝐨𝐢 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐧𝐚𝐡𝐢 𝐦𝐢𝐥𝐚!`, threadID, messageID);
      }
    }
  }

  let msg = "✨ ━━━━━━━ 𝖢𝖮𝖬𝖬𝖠𝖭𝖣 𝖫𝖨𝖲𝖳 ━━━━━━━ ✨\n\n";
  const categories = {};

  for (const [name, value] of commands) {
    const cat = value.config.commandCategory || "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(name);
  }

  for (const cat in categories) {
    msg += `📁 【 ${cat.toUpperCase()} 】\n  ╰┈➤ ${categories[cat].join(" • ")}\n\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓𝐨𝐭𝐚𝐥 𝐂𝐦𝐝𝐬: ${commands.size}\n👤 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍`;
  
  return api.sendMessage(msg, threadID, messageID);
};
