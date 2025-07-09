import logger from './logger.service';

interface VietnameseOCRConfig {
  languageHints: string[];
  receiptKeywords: string[];
  currencyPatterns: RegExp[];
  datePatterns: RegExp[];
  quantityPatterns: RegExp[];
  pricePatterns: RegExp[];
}

class VietnameseOCROptimizerService {
  private readonly config: VietnameseOCRConfig = {
    languageHints: ['vi', 'en'],
    receiptKeywords: [
      'hóa đơn', 'invoice', 'receipt', 'bill', 'tổng cộng', 'total',
      'thanh toán', 'payment', 'tiền', 'money', 'giá', 'price',
      'số lượng', 'quantity', 'qty', 'sl', 'đơn giá', 'unit price'
    ],
    currencyPatterns: [
      /^\d+([,.]\d+)?\s*(đ|vnd|vnđ|₫)$/i,
      /^\d+([,.]\d+)?\s*(đồng|dong)$/i,
      /^\d+([,.]\d+)?\s*(nghìn|ngàn|k)$/i,
      /^\d+([,.]\d+)?\s*(triệu|million|m)$/i
    ],
    datePatterns: [
      /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/,
      /^\d{1,2}\.\d{1,2}\.\d{2,4}$/,
      /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/
    ],
    quantityPatterns: [
      /^\d+([,.]\d+)?\s*(cái|chiếc|bộ|kg|g|ml|l)$/i,
      /^\d+([,.]\d+)?\s*(piece|unit|kg|g|ml|l)$/i
    ],
    pricePatterns: [
      /^\d+([,.]\d+)?\s*(đ|vnd|vnđ|₫)\/\w+$/i,
      /^\d+([,.]\d+)?\s*(đồng|dong)\/\w+$/i
    ]
  };

  /**
   * Tối ưu hóa cấu hình Vision API cho tiếng Việt
   */
  public getOptimizedVisionConfig() {
    return {
      languageHints: this.config.languageHints,
      productSearchParams: {
        productCategories: ['receipt', 'invoice', 'document'],
        filter: 'category=receipt'
      },
      // Tối ưu hóa cho text detection
      textDetectionParams: {
        enableTextDetectionConfidenceScore: true,
        advancedOcrOptions: {
          useAdvancedOcr: true
        }
      }
    };
  }

  /**
   * Tối ưu hóa cấu hình Tesseract cho tiếng Việt
   */
  public getOptimizedTesseractConfig() {
    return {
      lang: 'vie+eng',
      oem: 3, // OCR Engine Mode: Default
      psm: 6, // Page Segmentation Mode: Uniform block of text
      // Whitelist cho tiếng Việt
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ.,:;!?@#$%&*()_+-=[]{}|\\/"\'<>~` ',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0'
    };
  }

  /**
   * Phân tích và cải thiện kết quả OCR cho tiếng Việt
   */
  public enhanceVietnameseOCRResult(rawText: string): {
    enhancedText: string;
    confidence: number;
    detectedElements: {
      dates: string[];
      currencies: string[];
      quantities: string[];
      prices: string[];
      receiptHeaders: string[];
    };
  } {
    const enhancedText = this.normalizeVietnameseText(rawText);
    const detectedElements = this.detectVietnameseElements(enhancedText);
    const confidence = this.calculateVietnameseConfidence(enhancedText, detectedElements);

    return {
      enhancedText,
      confidence,
      detectedElements
    };
  }

  /**
   * Chuẩn hóa text tiếng Việt
   */
  private normalizeVietnameseText(text: string): string {
    return text
      // Chuẩn hóa dấu tiếng Việt
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/[đ]/g, 'd')
      .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
      .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
      .replace(/[ÌÍỊỈĨ]/g, 'I')
      .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
      .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
      .replace(/[ỲÝỴỶỸ]/g, 'Y')
      .replace(/[Đ]/g, 'D')
      // Chuẩn hóa khoảng trắng
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Phát hiện các phần tử tiếng Việt trong text
   */
  private detectVietnameseElements(text: string): {
    dates: string[];
    currencies: string[];
    quantities: string[];
    prices: string[];
    receiptHeaders: string[];
  } {
    const lines = text.split('\n');
    const detectedElements = {
      dates: [] as string[],
      currencies: [] as string[],
      quantities: [] as string[],
      prices: [] as string[],
      receiptHeaders: [] as string[]
    };

    lines.forEach(line => {
      const cleanLine = line.trim().toLowerCase();
      
      // Phát hiện ngày tháng
      this.config.datePatterns.forEach(pattern => {
        const matches = cleanLine.match(pattern);
        if (matches) {
          detectedElements.dates.push(...matches);
        }
      });

      // Phát hiện tiền tệ
      this.config.currencyPatterns.forEach(pattern => {
        const matches = cleanLine.match(pattern);
        if (matches) {
          detectedElements.currencies.push(...matches);
        }
      });

      // Phát hiện số lượng
      this.config.quantityPatterns.forEach(pattern => {
        const matches = cleanLine.match(pattern);
        if (matches) {
          detectedElements.quantities.push(...matches);
        }
      });

      // Phát hiện đơn giá
      this.config.pricePatterns.forEach(pattern => {
        const matches = cleanLine.match(pattern);
        if (matches) {
          detectedElements.prices.push(...matches);
        }
      });

      // Phát hiện header hóa đơn
      this.config.receiptKeywords.forEach(keyword => {
        if (cleanLine.includes(keyword)) {
          detectedElements.receiptHeaders.push(line.trim());
        }
      });
    });

    return detectedElements;
  }

  /**
   * Tính toán độ tin cậy cho text tiếng Việt
   */
  private calculateVietnameseConfidence(text: string, detectedElements: any): number {
    let confidence = 0.5; // Base confidence

    // Tăng confidence dựa trên số lượng phần tử phát hiện được
    const totalElements = Object.values(detectedElements).flat().length;
    confidence += Math.min(totalElements * 0.1, 0.3);

    // Tăng confidence nếu có header hóa đơn
    if (detectedElements.receiptHeaders.length > 0) {
      confidence += 0.2;
    }

    // Tăng confidence nếu có ngày tháng
    if (detectedElements.dates.length > 0) {
      confidence += 0.1;
    }

    // Tăng confidence nếu có tiền tệ
    if (detectedElements.currencies.length > 0) {
      confidence += 0.1;
    }

    // Giảm confidence nếu text quá ngắn
    if (text.length < 50) {
      confidence -= 0.2;
    }

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  /**
   * Tạo gợi ý cải thiện cho OCR
   */
  public generateOCRImprovementSuggestions(detectedElements: any, confidence: number): string[] {
    const suggestions: string[] = [];

    if (confidence < 0.7) {
      suggestions.push('Độ tin cậy thấp - cần kiểm tra thủ công');
    }

    if (detectedElements.dates.length === 0) {
      suggestions.push('Không phát hiện được ngày tháng - kiểm tra lại');
    }

    if (detectedElements.currencies.length === 0) {
      suggestions.push('Không phát hiện được tiền tệ - kiểm tra lại');
    }

    if (detectedElements.receiptHeaders.length === 0) {
      suggestions.push('Không phát hiện được header hóa đơn - có thể không phải hóa đơn');
    }

    if (detectedElements.quantities.length === 0) {
      suggestions.push('Không phát hiện được số lượng - kiểm tra lại');
    }

    return suggestions;
  }

  /**
   * Tối ưu hóa prompt cho AI matching
   */
  public getOptimizedAIPrompt(extractedText: string, detectedElements: any): string {
    let prompt = `Phân tích hóa đơn nhà hàng tiếng Việt:\n\n`;
    prompt += `Text trích xuất: ${extractedText}\n\n`;
    
    if (detectedElements.dates.length > 0) {
      prompt += `Ngày tháng: ${detectedElements.dates.join(', ')}\n`;
    }
    
    if (detectedElements.currencies.length > 0) {
      prompt += `Tiền tệ: ${detectedElements.currencies.join(', ')}\n`;
    }
    
    if (detectedElements.receiptHeaders.length > 0) {
      prompt += `Header: ${detectedElements.receiptHeaders.join(', ')}\n`;
    }
    
    prompt += `\nHãy trích xuất thông tin sau:\n`;
    prompt += `1. Ngày hóa đơn\n`;
    prompt += `2. Số hóa đơn\n`;
    prompt += `3. Nhà cung cấp\n`;
    prompt += `4. Danh sách mặt hàng (tên, số lượng, đơn giá, thành tiền)\n`;
    prompt += `5. Tổng tiền\n`;
    prompt += `6. Ghi chú (nếu có)\n\n`;
    prompt += `Trả về kết quả dưới dạng JSON.`;

    return prompt;
  }
}

export default new VietnameseOCROptimizerService();