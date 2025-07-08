import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import enhancedVietnameseService from './enhanced-vietnamese.service';
import aiEmbeddingsService from './ai-embeddings.service';

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
  private prisma: PrismaClient;
  private redis: Redis;
  private static instance: SemanticMatcherService;

  private constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
  }

  public static getInstance(): SemanticMatcherService {
    if (!SemanticMatcherService.instance) {
      SemanticMatcherService.instance = new SemanticMatcherService();
    }
    return SemanticMatcherService.instance;
  }

  private async getEmbedding(text: string): Promise<number[] | null> {
    const cacheKey = `embedding:${text}`;
    
    // Kiểm tra cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const embedding = await aiEmbeddingsService.getEmbedding(text);
      
      if (embedding) {
        // Cache kết quả
        await this.redis.set(cacheKey, JSON.stringify(embedding), 'EX', 86400); // Cache 24h
      }
      
      return embedding;
    } catch (error) {
      console.error('Error getting embedding:', error);
      return null;
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
      // Kiểm tra xem có AI service không
      if (!aiEmbeddingsService.hasProvider()) {
        // Fallback to text matching
        const textMatch = enhancedVietnameseService.findBestMatch(input, candidates);
        return {
          text: textMatch.text,
          similarity: textMatch.similarity,
          confidence: textMatch.similarity,
          alternatives: []
        };
      }

      const inputEmbedding = await this.getEmbedding(input);
      
      // Nếu không lấy được embedding, dùng text matching
      if (!inputEmbedding) {
        const textMatch = enhancedVietnameseService.findBestMatch(input, candidates);
        return {
          text: textMatch.text,
          similarity: textMatch.similarity,
          confidence: textMatch.similarity,
          alternatives: []
        };
      }

      const results: EmbeddingResult[] = [];

      // Tính toán embeddings cho tất cả candidates
      for (const candidate of candidates) {
        const embedding = await this.getEmbedding(candidate);
        if (embedding) {
          const similarity = this.cosineSimilarity(inputEmbedding, embedding);
          results.push({
            text: candidate,
            embedding,
            similarity
          });
        }
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
      
      // Fallback to text matching
      const textMatch = enhancedVietnameseService.findBestMatch(input, candidates);
      return {
        text: textMatch.text,
        similarity: textMatch.similarity,
        confidence: textMatch.similarity,
        alternatives: []
      };
    }
  }

  public async updateEmbeddingCache(text: string, correctedText: string): Promise<void> {
    try {
      // Xóa cache cũ
      await this.redis.del(`embedding:${text}`);
      
      // Nếu có AI service, tạo embedding mới
      if (aiEmbeddingsService.hasProvider()) {
        const embedding = await this.getEmbedding(correctedText);
        if (embedding) {
          // Cache embedding mới
          await this.redis.set(
            `embedding:${correctedText}`,
            JSON.stringify(embedding),
            'EX',
            86400
          );
        }
      }
    } catch (error) {
      console.error('Error updating embedding cache:', error);
    }
  }
}

export default SemanticMatcherService.getInstance(); 