import OpenAI from 'openai';
import axios from 'axios';
import { ExtractedContent } from '../types/ocr';
import { FormType } from '../types/form-template';
import logger from './logger.service';

// Import types từ form-content-matcher.service.ts
interface FormField {
  name: string;
  value: string | number;
  confidence: number;
  needsReview: boolean;
  alternatives?: string[];
}

interface ProcessedForm {
  type: FormType;
  confidence: number;
  fields: FormField[];
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price?: number;
    total?: number;
    confidence: number;
    needsReview: boolean;
  }>;
  needsReview: boolean;
}

interface AIProvider {
  analyzeContent(contents: ExtractedContent[], formType: FormType): Promise<AIFormAnalysis>;
}

interface AIFormAnalysis {
  fields: FormField[];
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price?: number;
    total?: number;
    confidence: number;
    needsReview: boolean;
  }>;
  confidence: number;
  reasoning: string;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyzeContent(contents: ExtractedContent[], formType: FormType): Promise<AIFormAnalysis> {
    try {
      const systemPrompt = this.buildSystemPrompt(formType);
      const userPrompt = this.buildUserPrompt(contents, formType);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAIResponse(result, formType);
    } catch (error) {
      logger.error('OpenAI analysis error:', error);
      throw error;
    }
  }

  private buildSystemPrompt(formType: FormType): string {
    const formTypeMap: Record<FormType, string> = {
      IMPORT: 'nhập kho',
      EXPORT: 'xuất kho', 
      RETURN: 'hoàn trả',
      ADJUSTMENT: 'điều chỉnh'
    };

    return `Bạn là một chuyên gia phân tích hóa đơn và biên lai cho hệ thống quản lý kho nhà hàng Việt Nam.

Nhiệm vụ của bạn là phân tích nội dung được trích xuất từ OCR và mapping vào form ${formTypeMap[formType] || 'nhập kho'}.

Yêu cầu:
1. Phân tích nội dung OCR một cách thông minh
2. Xác định các trường thông tin chính: ngày, nhà cung cấp, số hóa đơn, tổng tiền, ghi chú
3. Xác định danh sách mặt hàng với số lượng, đơn vị, giá
4. Đánh giá độ tin cậy cho từng trường
5. Trả về kết quả dưới dạng JSON theo format quy định

Lưu ý:
- Xử lý tốt tiếng Việt có dấu và không dấu
- Hiểu các alias phổ biến trong ngành nhà hàng
- Đánh giá độ tin cậy dựa trên chất lượng OCR và logic nghiệp vụ
- Nếu thông tin không rõ ràng, đánh dấu cần review`;
  }

  private buildUserPrompt(contents: ExtractedContent[], formType: FormType): string {
    const contentText = contents.map((content, index) => 
      `${index + 1}. "${content.text}" (độ tin cậy: ${Math.round(content.confidence * 100)}%)`
    ).join('\n');

    return `Phân tích nội dung OCR sau đây cho form ${formType}:

Nội dung OCR:
${contentText}

Trả về kết quả dưới dạng JSON với format:
{
  "fields": [
    {
      "name": "date",
      "value": "2024-01-15",
      "confidence": 0.95,
      "needsReview": false
    }
  ],
  "items": [
    {
      "name": "Thịt bò",
      "quantity": 5,
      "unit": "kg",
      "price": 200000,
      "total": 1000000,
      "confidence": 0.9,
      "needsReview": false
    }
  ],
  "confidence": 0.85,
  "reasoning": "Giải thích ngắn gọn về cách phân tích"
}`;
  }

  private parseAIResponse(response: string, formType: FormType): AIFormAnalysis {
    try {
      // Tìm JSON trong response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        fields: parsed.fields || [],
        items: parsed.items || [],
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'Không có giải thích'
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }
}

class DeepseekProvider implements AIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeContent(contents: ExtractedContent[], formType: FormType): Promise<AIFormAnalysis> {
    try {
      const systemPrompt = this.buildSystemPrompt(formType);
      const userPrompt = this.buildUserPrompt(contents, formType);

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from DeepSeek');
      }

      return this.parseAIResponse(result, formType);
    } catch (error) {
      logger.error('DeepSeek analysis error:', error);
      throw error;
    }
  }

  private buildSystemPrompt(formType: FormType): string {
    const formTypeMap: Record<FormType, string> = {
      IMPORT: 'nhập kho',
      EXPORT: 'xuất kho', 
      RETURN: 'hoàn trả',
      ADJUSTMENT: 'điều chỉnh'
    };

    return `Bạn là một chuyên gia phân tích hóa đơn và biên lai cho hệ thống quản lý kho nhà hàng Việt Nam.

Nhiệm vụ của bạn là phân tích nội dung được trích xuất từ OCR và mapping vào form ${formTypeMap[formType] || 'nhập kho'}.

Yêu cầu:
1. Phân tích nội dung OCR một cách thông minh
2. Xác định các trường thông tin chính: ngày, nhà cung cấp, số hóa đơn, tổng tiền, ghi chú
3. Xác định danh sách mặt hàng với số lượng, đơn vị, giá
4. Đánh giá độ tin cậy cho từng trường
5. Trả về kết quả dưới dạng JSON theo format quy định

Lưu ý:
- Xử lý tốt tiếng Việt có dấu và không dấu
- Hiểu các alias phổ biến trong ngành nhà hàng
- Đánh giá độ tin cậy dựa trên chất lượng OCR và logic nghiệp vụ
- Nếu thông tin không rõ ràng, đánh dấu cần review`;
  }

  private buildUserPrompt(contents: ExtractedContent[], formType: FormType): string {
    const contentText = contents.map((content, index) => 
      `${index + 1}. "${content.text}" (độ tin cậy: ${Math.round(content.confidence * 100)}%)`
    ).join('\n');

    return `Phân tích nội dung OCR sau đây cho form ${formType}:

Nội dung OCR:
${contentText}

Trả về kết quả dưới dạng JSON với format:
{
  "fields": [
    {
      "name": "date",
      "value": "2024-01-15",
      "confidence": 0.95,
      "needsReview": false
    }
  ],
  "items": [
    {
      "name": "Thịt bò",
      "quantity": 5,
      "unit": "kg",
      "price": 200000,
      "total": 1000000,
      "confidence": 0.9,
      "needsReview": false
    }
  ],
  "confidence": 0.85,
  "reasoning": "Giải thích ngắn gọn về cách phân tích"
}`;
  }

  private parseAIResponse(response: string, formType: FormType): AIFormAnalysis {
    try {
      // Tìm JSON trong response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        fields: parsed.fields || [],
        items: parsed.items || [],
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'Không có giải thích'
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }
}

class AIFormMapperService {
  private static instance: AIFormMapperService;
  private provider: AIProvider | null = null;

  private constructor() {
    // Khởi tạo provider dựa trên config
    const aiService = process.env.AI_SERVICE || 'openai';
    
    if (aiService === 'openai' && process.env.OPENAI_API_KEY) {
      this.provider = new OpenAIProvider(process.env.OPENAI_API_KEY);
      logger.info('Using OpenAI for form mapping');
    } 
    else if (aiService === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
      this.provider = new DeepseekProvider(process.env.DEEPSEEK_API_KEY);
      logger.info('Using DeepSeek for form mapping');
    }
    else {
      logger.warn('No AI service configured for form mapping');
    }
  }

  public static getInstance(): AIFormMapperService {
    if (!AIFormMapperService.instance) {
      AIFormMapperService.instance = new AIFormMapperService();
    }
    return AIFormMapperService.instance;
  }

  public async processOcrContent(
    extractedContents: ExtractedContent[],
    formType: FormType
  ): Promise<ProcessedForm> {
    try {
      logger.info('[AI Form Mapper] Bắt đầu xử lý với AI', { 
        formType, 
        extractedCount: extractedContents.length,
        hasProvider: !!this.provider 
      });

      if (!this.provider) {
        throw new Error('No AI provider configured');
      }

      // Sử dụng AI để phân tích
      const aiAnalysis = await this.provider.analyzeContent(extractedContents, formType);
      
      logger.info('[AI Form Mapper] Kết quả phân tích AI', { 
        fieldsCount: aiAnalysis.fields.length,
        itemsCount: aiAnalysis.items.length,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning
      });

      // Chuyển đổi kết quả AI sang format ProcessedForm
      const processedForm: ProcessedForm = {
        type: formType,
        confidence: aiAnalysis.confidence,
        fields: aiAnalysis.fields,
        items: aiAnalysis.items,
        needsReview: aiAnalysis.confidence < 0.85 || 
                    aiAnalysis.fields.some(f => f.needsReview) ||
                    aiAnalysis.items.some(i => i.needsReview)
      };

      logger.info('[AI Form Mapper] Kết quả cuối cùng', { 
        processedForm,
        needsReview: processedForm.needsReview
      });

      return processedForm;
    } catch (error) {
      logger.error('[AI Form Mapper] Lỗi xử lý:', error);
      throw error;
    }
  }

  public hasProvider(): boolean {
    return this.provider !== null;
  }
}

export default AIFormMapperService.getInstance();