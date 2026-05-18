module.exports = {
  config: {
    name: "sticker",
    version: "18.5.0",
    hasPermssion: 0,
    credits: "Shaan Khan", 
    description: "Search and manage Facebook stickers via config.json Priyansh API key",
    commandCategory: "UTILITY",
    usages: "[search/packs/pack/ai/store/add] [query/packID]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔴 DIRECT CONFIG.JSON KEY CHECK SYSTEM:
    // Yeh automatic global.config se "PriyanshApiKey" ko check karega
    const priyanshKey = global.config.PriyanshApiKey;

    if (!priyanshKey || priyanshKey.trim() === "") {
      return api.sendMessage('⚠️ Access Denied: config.json mein "PriyanshApiKey" nahi mili ya khali hai. Kripya config.json check karein.', threadID, messageID);
    }

    if (!api.stickers) {
      return api.sendMessage('❌ Stickers API (Priyansh Core) available nahi hai. Kripya check karein ki fca-updated/src/ me stickers.js mojood hai.', threadID, messageID);
    }

    if (args.length === 0) {
      const helpMessage = `🎨 Stickers Command (Priyansh API Core)\n\n` +
        `📌 Usages:\n` +
        `• sticker search <query> - Search for stickers\n` +
        `• sticker packs - List your sticker packs\n` +
        `• sticker pack <packID> - Get stickers in a pack\n` +
        `• sticker ai - Get AI-generated stickers\n` +
        `• sticker store - List all store packs\n` +
        `• sticker add <packID> - Add a sticker pack to your profile\n\n` +
        `💡 Examples:\n` +
        `sticker search love\n` +
        `sticker ai`;

      return api.sendMessage(helpMessage, threadID, messageID);
    }

    const action = args[0].toLowerCase();

    try {
      switch (action) {
        case 'search': {
          const query = args.slice(1).join(' ');
          if (!query) {
            return api.sendMessage('❌ Kripya search query dein.\nExample: sticker search love', threadID, messageID);
          }

          api.sendMessage('🔍 Searching for stickers...', threadID, messageID);

          api.stickers.search(query, (err, stickers) => {
            if (err) {
              console.error('Stickers search error:', err);
              return api.sendMessage('❌ Error: ' + (err.error || err.message || 'Unknown error'), threadID, messageID);
            }

            if (!stickers || stickers.length === 0) {
              return api.sendMessage(`❌ "${query}" ke liye koi sticker nahi mila.`, threadID, messageID);
            }

            let resultMsg = `✅ Found ${stickers.length} sticker(s) for "${query}":\n\n`;
            stickers.slice(0, 5).forEach((sticker, index) => {
              resultMsg += `${index + 1}. ${sticker.label || 'Sticker'}\n`;
              resultMsg += `   ID: ${sticker.stickerID}\n`;
              resultMsg += `   URL: ${sticker.url}\n`;
              if (sticker.animatedUrl) resultMsg += `   Animated: Yes\n`;
              resultMsg += `\n`;
            });

            if (stickers.length > 5) resultMsg += `\n... and ${stickers.length - 5} more stickers`;
            api.sendMessage(resultMsg, threadID, messageID);

            if (stickers[0] && stickers[0].stickerID) {
              api.sendMessage({ sticker: stickers[0].stickerID }, threadID);
            }
          });
          break;
        }

        case 'packs': {
          api.sendMessage('📦 Loading your sticker packs...', threadID, messageID);

          api.stickers.listPacks((err, packs) => {
            if (err) {
              console.error('Stickers listPacks error:', err);
              return api.sendMessage('❌ Error: ' + (err.error || err.message || 'Unknown error'), threadID, messageID);
            }

            if (!packs || packs.length === 0) {
              return api.sendMessage('❌ Aapke paas koi sticker packs nahi hain.', threadID, messageID);
            }

            let packsMsg = `✅ Your Sticker Packs (${packs.length}):\n\n`;
            packs.slice(0, 10).forEach((pack, index) => {
              packsMsg += `${index + 1}. ${pack.name}\n`;
              packsMsg += `   ID: ${pack.id}\n\n`;
            });

            if (packs.length > 10) packsMsg += `\n... and ${packs.length - 10} more packs`;
            packsMsg += `\n💡 Use: sticker pack <packID>`;
            api.sendMessage(packsMsg, threadID, messageID);
          });
          break;
        }

        case 'pack': {
          const packID = args[1];
          if (!packID) {
            return api.sendMessage('❌ Kripya pack ID dein.\nExample: sticker pack 123456789', threadID, messageID);
          }

          api.sendMessage(`📦 Loading stickers from pack ${packID}...`, threadID, messageID);

          api.stickers.getStickersInPack(packID, (err, stickers) => {
            if (err) {
              console.error('Stickers getStickersInPack error:', err);
              return api.sendMessage('❌ Error: ' + (err.error || err.message || 'Unknown error'), threadID, messageID);
            }

            if (!stickers || stickers.length === 0) {
              return api.sendMessage(`❌ Pack ID ${packID} me koi sticker nahi mila.`, threadID, messageID);
            }

            let packMsg = `✅ Found ${stickers.length} sticker(s) in pack:\n\n`;
            stickers.slice(0, 5).forEach((sticker, index) => {
              packMsg += `${index + 1}. ${sticker.label || 'Sticker'}\n`;
              packMsg += `   ID: ${sticker.stickerID}\n`;
            });

            api.sendMessage(packMsg, threadID, messageID);

            for (let i = 0; i < Math.min(3, stickers.length); i++) {
              if (stickers[i] && stickers[i].stickerID) {
                api.sendMessage({ sticker: stickers[i].stickerID }, threadID);
              }
            }
          });
          break;
        }

        case 'ai': {
          api.sendMessage('🤖 Loading AI-generated stickers...', threadID, messageID);

          api.stickers.getAiStickers({ limit: 10 }, (err, stickers) => {
            if (err) {
              console.error('Stickers getAiStickers error:', err);
              return api.sendMessage('❌ Error: ' + (err.error || err.message || 'Unknown error'), threadID, messageID);
            }

            if (!stickers || stickers.length === 0) {
              return api.sendMessage('❌ Is waqt AI stickers available nahi hain.', threadID, messageID);
            }

            let aiMsg = `🤖 Found ${stickers.length} AI-generated sticker(s):\n\n`;
            stickers.slice(0, 5).forEach((sticker, index) => {
              aiMsg += `${index + 1}. ${sticker.label || 'AI Sticker'}\n`;
              aiMsg += `   ID: ${sticker.stickerID}\n`;
            });

            api.sendMessage(aiMsg, threadID, messageID);

            for (let i = 0; i < Math.min(3, stickers.length); i++) {
              if (stickers[i] && stickers[i].stickerID) {
                api.sendMessage({ sticker: stickers[i].stickerID }, threadID);
              }
            }
          });
          break;
        }

        case 'store': {
          api.sendMessage('🏪 Loading store sticker packs...', threadID, messageID);

          api.stickers.getStorePacks((err, packs) => {
            if (err) {
              console.error('Stickers getStorePacks error:', err);
              return api.sendMessage('❌ Error: ' + (err.error || err.message || 'Unknown error'), threadID, messageID);
            }

            if (!packs || packs.length === 0) {
              return api.sendMessage('❌ Store packs khali hain.', threadID, messageID);
            }

            let storeMsg = `🏪 Store Sticker Packs (${packs.length} total):\n\n`;
            packs.slice(0, 15).forEach((pack, index) => {
              storeMsg += `${index + 1}. ${pack.name}\n`;
              storeMsg += `   ID: ${pack.id}\n`;
            });

            if (packs.length > 15) storeMsg += `\n... and ${packs.length - 15} more packs`;
            api.sendMessage(storeMsg, threadID, messageID);
          });
          break;
        }

        case 'add': {
          const packID = args[1];
          if (!packID) {
            return api.sendMessage('❌ Kripya pack ID dein jise add karna hai.', threadID, messageID);
          }

          api.sendMessage(`➕ Adding sticker pack ${packID}...`, threadID, messageID);

          api.stickers.addPack(packID, (err, pack) => {
            if (err) {
              console.error('Stickers addPack error:', err);
              return api.sendMessage('❌ Error: ' + (err.error || err.message || 'Unknown error'), threadID, messageID);
            }

            api.sendMessage(`✅ Sticker pack successfully add ho gaya!`, threadID, messageID);
          });
          break;
        }

        default: {
          return api.sendMessage(`❌ Unknown action: ${action}\nAvailable: search, packs, pack, ai, store, add`, threadID, messageID);
        }
      }
    } catch (error) {
      console.error('Stickers main runner error:', error);
      return api.sendMessage('❌ Command processing fail ho gayi: ' + error.message, threadID, messageID);
    }
  }
};
