const axios = require("axios");
const cheerio = require("cheerio");

module.exports.config = {
  name: "emojimean",
  version: "1.4-fixed",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Find the meaning of an emoji",
  commandCategory: "wiki",
  usages: "[emoji]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const emoji = args[0];

  if (!emoji) return api.sendMessage("⚠️ Please enter an emoji.", threadID, messageID);

  // Mirai mein default lang 'en' rakhte hain ya system se le sakte hain
  const lang = "en"; 

  try {
    const data = await getEmojiMeaning(emoji, lang);
    if (!data) return api.sendMessage("❌ Could not get emoji meaning.", threadID, messageID);

    const { meaning, moreMeaning, wikiText, meaningOfWikipedia, shortcode, source } = data;

    const msg = `📌 Meaning of ${emoji}\n\n` +
                `📄 First meaning:\n${meaning || "Not available"}\n\n` +
                `📑 More meaning:\n${moreMeaning || "Not available"}\n\n` +
                `📄 Shortcode: ${shortcode || "Not available"}\n\n` +
                `©️ Source: ${source}` +
                (wikiText ? "\n\n📝 Reply to this message with 'wiki' to view Wikipedia meaning" : "");

    return api.sendMessage(msg, threadID, (err, info) => {
      if (!err && wikiText) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          emoji,
          meaningOfWikipedia
        });
      }
    }, messageID);
  } catch (e) {
    return api.sendMessage("❌ Error fetching data.", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { body, threadID, messageID, senderID } = event;
  if (senderID !== handleReply.author) return;

  if (body.toLowerCase() === "wiki") {
    api.sendMessage(`📑 Wikipedia meaning of "${handleReply.emoji}":\n${handleReply.meaningOfWikipedia}`, threadID, messageID);
  }
};

async function getEmojiMeaning(emoji, lang) {
  try {
    const url = `https://www.emojiall.com/${lang}/emoji/${encodeURI(emoji)}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const meanings = $(".emoji_card_content.px-4.py-3");
    const meaning = meanings.eq(0).text().trim();
    const moreMeaning = meanings.eq(1).text().trim();

    const wikiBlock = $(".emoji_card_content.pointer").text().trim();
    const wikiText = wikiBlock.includes(emoji) ? wikiBlock : null;
    const wikiMeaning = $(".emoji_card_content.border_top.small").text().trim();

    const shortcodeMatch = $("table tr").text().match(/(:.*?:)/);

    if (!meaning && !moreMeaning) return null;

    return {
      meaning,
      moreMeaning,
      wikiText,
      meaningOfWikipedia: wikiMeaning || null,
      shortcode: shortcodeMatch?.[1] || null,
      source: url
    };
  } catch (e) {
    return null;
  }
}
