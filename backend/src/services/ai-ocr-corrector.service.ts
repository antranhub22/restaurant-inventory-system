import logger from './logger.service';
import axios from 'axios';

interface AIProvider {
  name: string;
  apiKey: string;
  endpoint: string;
  model: string;
}

interface OCRCorrectionResult {
  correctedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    confidence: number;
    reason: string;
  }>;
  confidence: number;
  provider: string;
}

class AIOcrCorrectorService {
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI provider
    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini'
      });
    }

    // DeepSeek provider  
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.push({
        name: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat'
      });
    }

    logger.info(`🤖 AI OCR Corrector initialized with ${this.providers.length} providers`);
  }

  public hasProvider(): boolean {
    return this.providers.length > 0;
  }

  /**
   * Correct OCR errors using AI with Vietnamese restaurant context
   */
  public async correctOCRErrors(rawOcrText: string, context?: any): Promise<OCRCorrectionResult> {
    if (!this.hasProvider()) {
      logger.warn('⚠️ No AI provider available for OCR correction');
      return {
        correctedText: rawOcrText,
        corrections: [],
        confidence: 0.5,
        provider: 'none'
      };
    }

    for (const provider of this.providers) {
      try {
        logger.info(`🤖 Attempting OCR correction with ${provider.name}...`);
        const result = await this.correctWithProvider(provider, rawOcrText, context);
        logger.info(`✅ OCR correction successful with ${provider.name}`);
        return result;
      } catch (error) {
        logger.warn(`⚠️ OCR correction failed with ${provider.name}:`, error);
        continue;
      }
    }

    // Fallback: return original text if all providers fail
    logger.error('❌ All AI providers failed for OCR correction');
    return {
      correctedText: rawOcrText,
      corrections: [],
      confidence: 0.3,
      provider: 'fallback'
    };
  }

  private async correctWithProvider(
    provider: AIProvider, 
    rawText: string, 
    context?: any
  ): Promise<OCRCorrectionResult> {
    const systemPrompt = `Bạn là chuyên gia sửa lỗi OCR cho hóa đơn nhà hàng Việt Nam. 

NHIỆM VỤ: Sửa lỗi OCR và trả về JSON với format chính xác.

NGUYÊN TẮC SỬA LỖI:
1. Tên món ăn Việt Nam phổ biến:
   - "Nedngot" → "Ngô ngọt"
   - "Giad" → "Giá đỗ" 
   - "cart" → "Cà rót"
   - "Ca chua" → "Cá chua"
   - "Rau muong" → "Rau muống"
   - "Cai ngot" → "Cải ngọt"
   - "Hanh la" → "Hành lá"
   - "La lot" → "Lá lót"
   - "Nam bo" → "Nam bò"

2. Các lỗi OCR thường gặp:
   - Chữ "ô" thành "o" hoặc "0"
   - Chữ "ư" thành "u"
   - Chữ "ă" thành "a"
   - Chữ "đ" thành "d"
   - Số "0" thành "o" hoặc "O"

3. Context món ăn nhà hàng:
   - Rau củ: Cà chua, Ngô ngọt, Rau muống, Cải ngọt, Hành lá, Giá đỗ, Lá lót, Cà rót
   - Thịt cá: Nam bò, Cá rô, Thịt heo, Gà
   - Gia vị: Muối, Đường, Nước mắm, Dầu ăn

RESPONSE FORMAT (JSON):
{
  "correctedText": "text đã được sửa",
  "corrections": [
    {
      "original": "text lỗi",
      "corrected": "text đã sửa", 
      "confidence": 0.95,
      "reason": "lý do sửa"
    }
  ],
  "confidence": 0.9
}`;

    const userPrompt = `OCR Text cần sửa:
"""
${rawText}
"""

Context thêm:
- Đây là phiếu nhập kho nhà hàng
- Có thể chứa bảng với: STT | Tên hàng | ĐVT | Số lượng | Đơn giá | Thành tiền
- Tổng tiền thường ở cuối
- Ngày tháng format: DD/MM/YYYY

Hãy sửa lỗi OCR và trả về JSON.`;

    const response = await axios.post(
      provider.endpoint,
      {
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    const parsedResult = JSON.parse(aiResponse);

    return {
      correctedText: parsedResult.correctedText || rawText,
      corrections: parsedResult.corrections || [],
      confidence: parsedResult.confidence || 0.8,
      provider: provider.name
    };
  }

  /**
   * Quick corrections without AI for common Vietnamese OCR errors
   */
  public applyQuickCorrections(text: string): {
    correctedText: string;
    corrections: Array<{ original: string; corrected: string; }>;
  } {
    const corrections: Array<{ original: string; corrected: string; }> = [];
    let correctedText = text;

    // Common Vietnamese food name corrections
    const vietnameseFoodCorrections = [
      // Common OCR mistakes for Vietnamese food names
      ['Nedngot', 'Ngô ngọt'],
      ['nedngot', 'ngô ngọt'], 
      ['Giad', 'Giá đỗ'],
      ['giad', 'giá đỗ'],
      ['cart', 'Cà rót'],
      ['Cart', 'Cà rót'],
      ['Ca chua', 'Cá chua'],
      ['ca chua', 'cá chua'],
      ['Rau muong', 'Rau muống'],
      ['rau muong', 'rau muống'],
      ['Cai ngot', 'Cải ngọt'],
      ['cai ngot', 'cải ngọt'],
      ['Hanh la', 'Hành lá'],
      ['hanh la', 'hành lá'],
      ['La lot', 'Lá lót'],
      ['la lot', 'lá lót'],
      ['Nam bo', 'Nam bò'],
      ['nam bo', 'nam bò'],
      
      // Character-level corrections
      ['Ngo ngot', 'Ngô ngọt'],
      ['ngo ngot', 'ngô ngọt'],
      ['Gia do', 'Giá đỗ'],
      ['gia do', 'giá đỗ'],
      ['Ca rot', 'Cà rót'],
      ['ca rot', 'cà rót'],
      
      // Common OCR character mistakes
      ['o ', 'ô '],
      ['u ', 'ư '],
      ['a ', 'ă '],
      ['d ', 'đ '],
      
      // Number corrections in Vietnamese context
      ['0OO', '000'],
      ['O00', '000'],
      ['OOO', '000']
    ];

    vietnameseFoodCorrections.forEach(([wrong, correct]) => {
      if (correctedText.includes(wrong)) {
        correctedText = correctedText.replace(new RegExp(wrong, 'g'), correct);
        corrections.push({ original: wrong, corrected: correct });
      }
    });

    return {
      correctedText,
      corrections
    };
  }
}

export default new AIOcrCorrectorService(); 