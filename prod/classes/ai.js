/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { AttachmentBuilder } from "discord.js";
/**
 *
 */
export class Ai {
    anthropic;
    gemini;
    /**
     * @param anthropicKey
     * @param geminiKey
     */
    constructor(anthropicKey, geminiKey) {
        this.anthropic = new Anthropic({
            apiKey: anthropicKey,
        });
        this.gemini = new GoogleGenAI({
            apiKey: geminiKey,
        });
    }
    /**
     * @param prompt
     */
    async generateProjectInfo(prompt) {
        const projectRequest = await fetch("https://data.nhcarrigan.com/projects.json");
        const projectResponse 
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Fetch does not accept a generic.
        = (await projectRequest.json());
        const names = await this.generateText(`Your task is to generate a project name based on the user's description. Provide ONLY a list of 1-5 fitting names, and an explanation for why you chose them. Note that project names should be unique. Here's a list of all existing project names: ${projectResponse.
            map((p) => {
            return p.name;
        }).
            join(", ")}`, prompt);
        const image = await this.generateImage(`Your task is to generate a full body anime girl mascot for this project. The image should have a transparent background. Potential names: ${names}. The project description is: ${prompt}`);
        if (image === null) {
            return { content: `Project Name: ${names}\nProject Description: ${prompt}\nSorry, I was unable to generate an image for you.` };
        }
        return { content: `Project Name: ${names}\nProject Description: ${prompt}`,
            files: [new AttachmentBuilder(image, { name: "avatar.png" })] };
    }
    /**
     * @param system
     * @param prompt
     */
    async generateText(system, prompt) {
        const response = await this.anthropic.messages.create({
            max_tokens: 1000,
            messages: [
                {
                    content: prompt,
                    role: "user",
                },
            ],
            model: "claude-sonnet-4-5-20250929",
            system: system,
        });
        const text = response.content.
            filter((c) => {
            return c.type === "text";
        }).
            map((c) => {
            return c.text;
        }).
            join("");
        return text;
    }
    /**
     * @param prompt
     */
    async generateImage(prompt) {
        const response = await this.gemini.models.generateImages({
            config: {
                aspectRatio: "3:4",
                imageSize: "2K",
                numberOfImages: 1,
                outputMimeType: "image/png",
                personGeneration: PersonGeneration.ALLOW_ADULT,
            },
            model: "models/imagen-4.0-generate-001",
            prompt: prompt,
        });
        const base64 = response.generatedImages?.[0]?.image?.imageBytes;
        if (base64 === undefined) {
            return null;
        }
        return Buffer.from(base64, "base64");
    }
}
