import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async analyzeError(error: string, context: any) {
    const prompt = `
        Analyze this workflow error and provide:
        1. Possible causes
        2. Suggested fixes

        Error:
        ${error}

        Context:
        ${JSON.stringify(context)}

        Answer in JSON:
        {
        "analysis": [],
        "suggestion": []
        }
    `;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    return response.choices[0].message.content;
  }
}
