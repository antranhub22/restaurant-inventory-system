import OpenAI from 'openai';
import axios from 'axios';

export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[] | null>;
}

class OpenAIProvider implements EmbeddingProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async getEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      return null;
    }
  }
}

class DeepseekProvider implements EmbeddingProvider {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          model: 'deepseek-embed',
          input: text
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Deepseek embedding error:', error);
      return null;
    }
  }
}

class AIEmbeddingsService {
  private static instance: AIEmbeddingsService;
  private provider: EmbeddingProvider | null = null;

  private constructor() {
    // Khởi tạo provider dựa trên config
    const aiService = process.env.AI_SERVICE || 'openai';
    
    if (aiService === 'openai' && process.env.OPENAI_API_KEY) {
      this.provider = new OpenAIProvider(process.env.OPENAI_API_KEY);
      console.log('Using OpenAI for embeddings');
    } 
    else if (aiService === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
      this.provider = new DeepseekProvider(process.env.DEEPSEEK_API_KEY);
      console.log('Using Deepseek for embeddings');
    }
    else {
      console.warn('No AI service configured for embeddings');
    }
  }

  public static getInstance(): AIEmbeddingsService {
    if (!AIEmbeddingsService.instance) {
      AIEmbeddingsService.instance = new AIEmbeddingsService();
    }
    return AIEmbeddingsService.instance;
  }

  public async getEmbedding(text: string): Promise<number[] | null> {
    if (!this.provider) {
      return null;
    }
    return this.provider.getEmbedding(text);
  }

  public hasProvider(): boolean {
    return this.provider !== null;
  }
}

export default AIEmbeddingsService.getInstance(); 