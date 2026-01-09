/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { Anthropic } from "@anthropic-ai/sdk";
import type { MessageCreateOptions } from "discord.js";

/**
 * Utility class for generating project information and images.
 */
export class Ai {
  private readonly anthropic: Anthropic;

  /**
   * Creates a new instance of the Ai class.
   * @param anthropicKey - The API key for the Anthropic API.
   */
  public constructor(anthropicKey: string) {
    this.anthropic = new Anthropic({
      apiKey: anthropicKey,
    });
  }

  /**
   * Generates a list of potential project names and a full body anime girl mascot for the project.
   * @param prompt - The user's prompt for the project.
   * @returns A message create options object containing the project name, description, and image.
   */
  public async generateProjectInfo(
    prompt: string,
  ): Promise<MessageCreateOptions> {
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
        }).join(", ")}`,
      prompt,
    );
    return {
      content: `Project Name: ${names}\nProject Description: ${prompt}`,
    };
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
}
