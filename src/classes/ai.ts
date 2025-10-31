/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { AttachmentBuilder, type MessageCreateOptions } from "discord.js";

/**
 * Utility class for generating project information and images.
 */
export class Ai {
  private readonly anthropic: Anthropic;
  private readonly gemini:    GoogleGenAI;

  /**
   * Creates a new instance of the Ai class.
   * @param anthropicKey - The API key for the Anthropic API.
   * @param geminiKey - The API key for the Gemini API.
   */
  public constructor(anthropicKey: string, geminiKey: string) {
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
  public async generateProjectInfo(prompt: string):
  Promise<MessageCreateOptions> {
    const projectRequest = await fetch(
      "https://data.nhcarrigan.com/projects.json",
    );
    const projectResponse
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Fetch does not accept a generic.
     = (await projectRequest.json()) as Array<{ name: string }>;
    const names = await this.generateText(
      `Your task is to generate a project name based on the user's description. Provide ONLY a list of 1-5 fitting names, and an explanation for why you chose them. Note that project names should be unique. Here's a list of all existing project names: ${projectResponse.
        map((p) => {
          return p.name;
        }).
        join(", ")}`,
      prompt,
    );
    const image = await this.generateImage(`Your task is to generate a full body anime girl mascot for this project. The image should have a transparent background. The project description is: ${prompt}`);
    if (image === null) {
      return { content: `Project Name: ${names}\nProject Description: ${prompt}\nSorry, I was unable to generate an image for you.` };
    }
    return { content: `Project Name: ${names}\nProject Description: ${prompt}`,
      files:   [ new AttachmentBuilder(image, { name: "avatar.png" }) ] };
  }

  private async generateText(system: string, prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      // eslint-disable-next-line @typescript-eslint/naming-convention -- SDK requirement.
      max_tokens: 1000,
      messages:   [
        {
          content: prompt,
          role:    "user",
        },
      ],
      model:  "claude-sonnet-4-5-20250929",
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

  private async generateImage(prompt: string): Promise<Buffer | null> {
    const response = await this.gemini.models.generateImages({
      config: {
        aspectRatio:      "3:4",
        imageSize:        "2K",
        numberOfImages:   1,
        outputMimeType:   "image/png",
        personGeneration: PersonGeneration.ALLOW_ADULT,
      },
      model:  "models/imagen-4.0-generate-001",
      prompt: prompt,
    });
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64 === undefined) {
      return null;
    }
    return Buffer.from(base64, "base64");
  }
}
