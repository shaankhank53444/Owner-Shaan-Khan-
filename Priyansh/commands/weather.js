const axios = require('axios');

const weatherTranslations = {
  'sunny': 'Sunny',
  'mostly sunny': 'Mostly Sunny',
  'partly sunny': 'Partly Sunny',
  'rain showers': 'Rain Showers',
  't-storms': 'Thunderstorms',
  'light rain': 'Light Rain',
  'mostly cloudy': 'Mostly Cloudy',
  'rain': 'Rainy',
  'heavy t-storms': 'Severe Thunderstorms',
  'partly cloudy': 'Partly Cloudy',
  'mostly clear': 'Mostly Clear',
  'cloudy': 'Cloudy',
  'clear': 'Clear Sky'
};

const translateWeather = (weather) => {
  if (!weather) return "N/A";
  const normalizedWeather = weather.toLowerCase();
  return weatherTranslations[normalizedWeather] || weather;
};

const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

module.exports.config = {
  name: 'weather',
  version: '1.0.1',
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Check weather for any city globally.",
  commandCategory: 'Members',
  usages: '[city name]',
  cooldowns: 3,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  try {
    const location = args.join(" ");
    if (!location) return api.sendMessage("༻﹡﹡﹡﹡﹡﹡﹡༺\n\n**Enter the city/province to check the weather.**\n\n༻﹡﹡﹡﹡﹡﹡﹡༺", threadID, messageID);

    const res = await axios.get(`https://api.popcat.xyz/weather?q=${encodeURIComponent(location)}`);
    
    // Popcat API returns an array or an error object
    if (!res.data || res.data.length === 0 || res.data.error) {
      return api.sendMessage("≿━━━━༺❀༻━━━━≾\n\n**No weather data found for this location.**\n\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
    }

    const data = res.data[0];
    const { location: loc, current, forecast } = data;

    let message = `≿━━━━༺❀༻━━━━≾\n\n**Current weather in ${loc.name}:**\n` +
                  `🌡 **Temperature:** ${current.temperature}°C\n` +
                  `🤲 **Feels Like:** ${current.feelslike}°C\n` +
                  `🗺️ **Condition:** ${translateWeather(current.skytext)}\n` +
                  `♒ **Humidity:** ${current.humidity}%\n` +
                  `💨 **Wind:** ${current.winddisplay}\n\n` +
                  `❤ **React with heart to view the 5-day forecast.**\n\n≿━━━━༺❀༻━━━━≾`;

    api.sendMessage(message, threadID, (err, info) => {
      if (err) return;
      global.client.handleReaction.push({
        name: this.config.name,
        messageID: info.messageID,
        location: loc.name,
        forecast: forecast,
        author: senderID
      });
    }, messageID);

  } catch (err) {
    api.sendMessage(`༻﹡﹡﹡﹡﹡﹡﹡༺\n\n**Error:** ${err.message}\n\n༻﹡﹡﹡﹡﹡﹡﹡༺`, threadID, messageID);
  }
};

module.exports.handleReaction = async function({ event, api, handleReaction }) {
  const { threadID, messageID, userID, reaction } = event;
  if (userID != handleReaction.author) return;
  if (reaction != "❤") return; 

  const { location, forecast } = handleReaction;

  if (!forecast || forecast.length === 0) {
    return api.sendMessage("No forecast data available.", threadID, messageID);
  }

  let message = `≿━━━━༺❀༻━━━━≾\n\n**Weather Forecast for ${location}:**\n\n`;

  // Taking up to 5 days
  const limit = Math.min(forecast.length, 5);
  for (let i = 0; i < limit; i++) {
    const dayName = forecast[i].day;
    const weather = translateWeather(forecast[i].skytextday);
    const date = formatDate(forecast[i].date);

    message += `${i + 1}. **${dayName} - ${date}**\n` +
               `🌡 **Temp:** ${forecast[i].low}°C - ${forecast[i].high}°C\n` +
               `🗺️ **Sky:** ${weather}\n` +
               `🌧 **Rain:** ${forecast[i].precip}%\n\n`;
  }

  message += "≿━━━━༺❀༻━━━━≾";

  api.sendMessage(message, threadID, () => {
    // Purana message delete karne ke liye
    api.unsendMessage(handleReaction.messageID);
  }, messageID);
};
