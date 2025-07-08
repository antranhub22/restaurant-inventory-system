import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

interface EmbeddingResult {
  text: string;
  embedding: number[];
  similarity: number;
}

interface SemanticMatch {
  text: string;
  similarity: number;
  confidence: number;
  alternatives: string[];
}

export class SemanticMatcherService {
  private openai: OpenAI;
  private prisma: PrismaClient;
  private redis: Redis;
  private static instance: SemanticMatcherService;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.prisma = new PrismaClient();
    
    // Khởi tạo Redis với options
    const redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    };
    this.redis = new Redis(redisOptions);
  }

  public static getInstance(): SemanticMatcherService {
    if (!SemanticMatcherService.instance) {
      SemanticMatcherService.instance = new SemanticMatcherService();
    }
    return SemanticMatcherService.instance;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${text}`;
    
    // Kiểm tra cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });

      const embedding = response.data[0].embedding;
      
      // Cache kết quả
      await this.redis.set(cacheKey, JSON.stringify(embedding), 'EX', 86400); // Cache 24h
      
      return embedding;
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }

  private cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  public async findSemanticMatches(
    input: string,
    candidates: string[],
    threshold: number = 0.7
  ): Promise<SemanticMatch> {
    try {
      const inputEmbedding = await this.getEmbedding(input);
      const results: EmbeddingResult[] = [];

      // Tính toán embeddings cho tất cả candidates
      for (const candidate of candidates) {
        const embedding = await this.getEmbedding(candidate);
        const similarity = this.cosineSimilarity(inputEmbedding, embedding);
        
        results.push({
          text: candidate,
          embedding,
          similarity
        });
      }

      // Sắp xếp theo độ tương đồng
      results.sort((a, b) => b.similarity - a.similarity);

      // Lấy kết quả tốt nhất và các alternatives
      const bestMatch = results[0];
      const alternatives = results
        .slice(1, 4)
        .filter(r => r.similarity > threshold)
        .map(r => r.text);

      return {
        text: bestMatch.text,
        similarity: bestMatch.similarity,
        confidence: bestMatch.similarity > threshold ? bestMatch.similarity : 0,
        alternatives
      };
    } catch (error) {
      console.error('Error in semantic matching:', error);
      throw error;
    }
  }

  public async updateEmbeddingCache(text: string, correctedText: string): Promise<void> {
    try {
      // Xóa cache cũ
      await this.redis.del(`embedding:${text}`);
      
      // Tạo embedding mới cho correctedText
      const embedding = await this.getEmbedding(correctedText);
      
      // Cache embedding mới
      await this.redis.set(
        `embedding:${correctedText}`,
        JSON.stringify(embedding),
        'EX',
        86400
      );
    } catch (error) {
      console.error('Error updating embedding cache:', error);
    }
  }
}

export default SemanticMatcherService.getInstance(); 