import TelegramBot from "node-telegram-bot-api";

const token = '7875248042:AAHuz_HjElePh68tmzQE2LG1P6UGc1zlsA8';
const bot = new TelegramBot(token, { polling: true });

export default bot;
