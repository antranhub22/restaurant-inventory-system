import enhancedVietnameseService from './enhanced-vietnamese.service';
import semanticMatcherService from './semantic-matcher.service';

interface MatchResult {
  text: string;
  similarity: number;
  confidence: number;
  method: 'text' | 'semantic' | 'combined';
  alternatives: string[];
  needsReview: boolean;
}

interface MatchWeights {
  text: number;
  semantic: number;
}

export class EnhancedMatcherService {
  private static instance: EnhancedMatcherService;
  private readonly DEFAULT_WEIGHTS: MatchWeights = {
    text: 0.6,
    semantic: 0.4
  };

  private constructor() {}

  public static getInstance(): EnhancedMatcherService {
    if (!EnhancedMatcherService.instance) {
      EnhancedMatcherService.instance = new EnhancedMatcherService();
    }
    return EnhancedMatcherService.instance;
  }

  public async findBestMatch(
    input: string,
    candidates: string[],
    weights: MatchWeights = this.DEFAULT_WEIGHTS
  ): Promise<MatchResult> {
    try {
      // 1. Text matching
      const textMatch = enhancedVietnameseService.findBestMatch(input, candidates);
      
      // 2. Semantic matching
      const semanticMatch = await semanticMatcherService.findSemanticMatches(
        input,
        candidates,
        0.7
      );

      // 3. Kết hợp kết quả
      const combinedScore = this.combineScores(
        textMatch.similarity,
        semanticMatch.similarity,
        weights
      );

      // 4. Quyết định phương pháp tốt nhất
      let bestMethod: 'text' | 'semantic' | 'combined' = 'combined';
      let finalScore = combinedScore;
      let selectedText = textMatch.text;
      let alternatives = semanticMatch.alternatives;

      if (textMatch.similarity > 0.9) {
        bestMethod = 'text';
        finalScore = textMatch.similarity;
        selectedText = textMatch.text;
      } else if (semanticMatch.similarity > 0.85) {
        bestMethod = 'semantic';
        finalScore = semanticMatch.similarity;
        selectedText = semanticMatch.text;
        alternatives = semanticMatch.alternatives;
      }

      // 5. Xác định mức độ tin cậy và nhu cầu review
      const confidence = this.calculateConfidence(
        textMatch.similarity,
        semanticMatch.similarity,
        finalScore
      );

      return {
        text: selectedText,
        similarity: finalScore,
        confidence,
        method: bestMethod,
        alternatives,
        needsReview: confidence < 0.85
      };
    } catch (error) {
      console.error('Error in enhanced matching:', error);
      throw error;
    }
  }

  private combineScores(
    textScore: number,
    semanticScore: number,
    weights: MatchWeights
  ): number {
    return (textScore * weights.text) + (semanticScore * weights.semantic);
  }

  private calculateConfidence(
    textScore: number,
    semanticScore: number,
    combinedScore: number
  ): number {
    // Tính confidence dựa trên:
    // 1. Độ cao của điểm số
    // 2. Độ tương đồng giữa các phương pháp
    const scoreDifference = Math.abs(textScore - semanticScore);
    const methodAgreement = 1 - (scoreDifference / 2);
    
    return Math.min(
      combinedScore,
      methodAgreement,
      Math.max(textScore, semanticScore)
    );
  }

  public async findBestMatches(
    inputs: string[],
    candidates: string[],
    weights: MatchWeights = this.DEFAULT_WEIGHTS
  ): Promise<MatchResult[]> {
    return Promise.all(
      inputs.map(input => this.findBestMatch(input, candidates, weights))
    );
  }

  public async updateMatchingCache(
    originalText: string,
    correctedText: string
  ): Promise<void> {
    // Cập nhật cache cho semantic matching
    await semanticMatcherService.updateEmbeddingCache(
      originalText,
      correctedText
    );
  }
}

export default EnhancedMatcherService.getInstance(); 