/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenAI, } from "@google/genai";
import { AttachmentBuilder } from "discord.js";
/**
 * Utility class for generating project information and images.
 */
export class Ai {
    anthropic;
    gemini;
    /**
     * Creates a new instance of the Ai class.
     * @param anthropicKey - The API key for the Anthropic API.
     * @param geminiKey - The API key for the Gemini API.
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
     * Generates a list of potential project names and a full body anime girl mascot for the project.
     * @param prompt - The user's prompt for the project.
     * @returns A message create options object containing the project name, description, and image.
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
        const image = await this.generateImage(prompt);
        if (image === null) {
            return {
                content: `Project Name: ${names}\nProject Description: ${prompt}\nSorry, I was unable to generate an image for you.`,
            };
        }
        return {
            content: `Project Name: ${names}\nProject Description: ${prompt}`,
            files: [new AttachmentBuilder(image, { name: "avatar.png" })],
        };
    }
    async generateText(system, prompt) {
        const response = await this.anthropic.messages.create({
            // eslint-disable-next-line @typescript-eslint/naming-convention -- SDK requirement.
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
    async generateImage(prompt) {
        const response = await this.gemini.models.generateContent({
            config: {
                imageConfig: { aspectRatio: "3:4" },
                systemInstruction: "Your task is to generate a full body anime girl mascot for this project. This means the full character should be visible. The image should have a white background. NEVER include text in the image, no text anywhere at all. The project description is provided by the user.",
            },
            contents: prompt,
            model: "gemini-2.5-flash-image",
        });
        const image = response.candidates?.[0]?.content?.parts?.find((p) => {
            return Boolean(p.inlineData);
        });
        const base64 = image?.inlineData?.data;
        if (base64 === undefined) {
            return null;
        }
        return Buffer.from(base64, "base64");
    }
}
