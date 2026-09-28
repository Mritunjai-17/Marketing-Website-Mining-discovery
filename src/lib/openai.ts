import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "placeholder-key",
});

export const MODEL = "gpt-4.1-mini";