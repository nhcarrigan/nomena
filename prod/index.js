/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import { Logger } from "@nhcarrigan/logger";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { Ai } from "./classes/ai.js";
if (process.env.ANTHROPIC_API_KEY === undefined
    || process.env.GEMINI_API_KEY === undefined
    || process.env.LOG_TOKEN === undefined
    || process.env.DISCORD_TOKEN === undefined) {
    throw new Error(`ANTHROPIC_API_KEY, GEMINI_API_KEY, LOG_TOKEN, and DISCORD_TOKEN must be set.`);
}
const ai = new Ai(process.env.ANTHROPIC_API_KEY, process.env.GEMINI_API_KEY);
const logger = new Logger("Nomena", process.env.LOG_TOKEN);
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
bot.once("ready", () => {
    void logger.log("debug", "Nomena is online!");
});
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Lazy.
bot.on(Events.MessageCreate, async (message) => {
    if (!message.mentions.has("1433657054433771621", {
        ignoreEveryone: true,
        ignoreRepliedUser: true,
        ignoreRoles: true,
    })) {
        return;
    }
    if (message.author.id !== "465650873650118659") {
        await message.reply("Sorry, I can only generate project ideas for Naomi.");
    }
    await message.channel.sendTyping();
    const prompt = message.content.replace(/<@!?1433657054433771621>/, "").trim();
    const projectInfo = await ai.generateProjectInfo(prompt);
    await message.reply(projectInfo);
});
await bot.login(process.env.DISCORD_TOKEN);
