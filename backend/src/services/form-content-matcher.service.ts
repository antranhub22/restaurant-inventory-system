import { PrismaClient } from '@prisma/client';
import enhancedMatcherService from './enhanced-matcher.service';
import { FormType } from '../types/form-template';

interface ExtractedContent {
  text: string;
  type: string;
  confidence: number;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

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

// Alias mapping cho các trường thông tin chung
const FIELD_ALIASES: Record<string, string[]> = {
  date: ['date', 'ngày', 'ngay', 'ngày nhập', 'ngày xuất', 'ngày hoàn', 'ngày điều chỉnh', 'ngày hóa đơn', 'invoice date', 'import date', 'export date', 'return date'],
  supplierId: ['supplier', 'nhà cung cấp', 'nha cung cap', 'supplier id', 'supplier name'],
  invoice_no: ['invoice_no', 'invoice-no', 'số hóa đơn', 'so hoa don', 'invoice number', 'ma hoa don'],
  total: ['total', 'tổng tiền', 'tong tien', 'thành tiền', 'thanh tien', 'total amount', 'amount'],
  notes: ['notes', 'ghi chú', 'ghi chu', 'note', 'remark', 'description', 'mô tả', 'mo ta']
};

export class FormContentMatcherService {
  private static instance: FormContentMatcherService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): FormContentMatcherService {
    if (!FormContentMatcherService.instance) {
      FormContentMatcherService.instance = new FormContentMatcherService();
    }
    return FormContentMatcherService.instance;
  }

  public async processOcrContent(
    extractedContents: ExtractedContent[],
    formType: FormType
  ): Promise<ProcessedForm> {
    try {
      console.log('[DEBUG] Bắt đầu processOcrContent', { formType, extractedCount: extractedContents.length });
      // 1. Lấy form template cứng (hardcoded) thay vì từ database
      const template = this.getHardcodedTemplate(formType);
      console.log('[DEBUG] Template sử dụng cho form', { template });

      // 2. Xử lý các trường thông tin chung
      const generalFields = await this.processGeneralFields(
        extractedContents,
        template
      );
      console.log('[DEBUG] Kết quả processGeneralFields', { generalFields });

      // 3. Xử lý danh sách items
      const items = await this.processItems(extractedContents);
      console.log('[DEBUG] Kết quả processItems', { items });

      // 4. Tính toán độ tin cậy tổng thể
      const confidence = this.calculateOverallConfidence(generalFields, items);
      console.log('[DEBUG] Tổng độ tin cậy form', { confidence });

      return {
        type: formType,
        confidence,
        fields: generalFields,
        items,
        needsReview: confidence < 0.85 || items.some(item => item.needsReview)
      };
    } catch (error) {
      console.error('Error processing OCR content:', error);
      throw error;
    }
  }

  private getHardcodedTemplate(formType: FormType): any {
    // Template cứng cho các loại form cơ bản
    const templates = {
      IMPORT: {
        sections: [
          {
            fields: [
              { name: 'date', type: 'date', label: 'Ngày nhập' },
              { name: 'supplierId', type: 'select', label: 'Nhà cung cấp' },
              { name: 'invoice_no', type: 'text', label: 'Số hóa đơn' },
              { name: 'total', type: 'currency', label: 'Tổng tiền' },
              { name: 'notes', type: 'text', label: 'Ghi chú' }
            ]
          }
        ]
      },
      EXPORT: {
        sections: [
          {
            fields: [
              { name: 'date', type: 'date', label: 'Ngày xuất' },
              { name: 'department', type: 'select', label: 'Phòng ban' },
              { name: 'purpose', type: 'select', label: 'Mục đích' },
              { name: 'total', type: 'currency', label: 'Tổng tiền' },
              { name: 'notes', type: 'text', label: 'Ghi chú' }
            ]
          }
        ]
      },
      RETURN: {
        sections: [
          {
            fields: [
              { name: 'date', type: 'date', label: 'Ngày hoàn' },
              { name: 'reason', type: 'select', label: 'Lý do hoàn' },
              { name: 'total', type: 'currency', label: 'Tổng tiền' },
              { name: 'notes', type: 'text', label: 'Ghi chú' }
            ]
          }
        ]
      },
      ADJUSTMENT: {
        sections: [
          {
            fields: [
              { name: 'date', type: 'date', label: 'Ngày điều chỉnh' },
              { name: 'reason', type: 'select', label: 'Lý do điều chỉnh' },
              { name: 'total', type: 'currency', label: 'Tổng tiền' },
              { name: 'notes', type: 'text', label: 'Ghi chú' }
            ]
          }
        ]
      }
    };

    return templates[formType] || templates.IMPORT;
  }

  private async processGeneralFields(
    contents: ExtractedContent[],
    template: any
  ): Promise<FormField[]> {
    const fields: FormField[] = [];
    console.log('[DEBUG] Bắt đầu processGeneralFields', { templateFields: template.sections.map((s: any) => s.fields) });
    // Xử lý từng trường trong template
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.type !== 'array') { // Bỏ qua trường items
          const matchedContent = await this.findBestContentMatch(
            contents,
            field
          );
          console.log('[DEBUG] Kết quả findBestContentMatch', { field, matchedContent });
          if (matchedContent) {
            fields.push({
              name: field.name,
              value: this.normalizeFieldValue(matchedContent.text, field.type),
              confidence: matchedContent.confidence,
              needsReview: matchedContent.confidence < 0.85
            });
          }
        }
      }
    }
    return fields;
  }

  private async processItems(
    contents: ExtractedContent[]
  ): Promise<ProcessedForm['items']> {
    const items: ProcessedForm['items'] = [];
    const itemGroups = this.groupItemContents(contents);
    console.log('[DEBUG] Nhóm itemGroups', { itemGroups });
    for (const group of itemGroups) {
      // Tìm tên sản phẩm
      const nameMatch = await enhancedMatcherService.findBestMatch(
        group.name,
        await this.getItemNames()
      );
      console.log('[DEBUG] Kết quả findBestMatch cho item name', { groupName: group.name, nameMatch });
      // Xử lý số lượng và đơn vị
      const { quantity, unit } = this.extractQuantityAndUnit(group.quantity);
      items.push({
        name: nameMatch.text,
        quantity,
        unit,
        price: group.price,
        total: group.total,
        confidence: Math.min(nameMatch.confidence, group.confidence),
        needsReview: nameMatch.confidence < 0.85
      });
    }
    return items;
  }

  private async findBestContentMatch(
    contents: ExtractedContent[],
    field: any
  ): Promise<ExtractedContent & { confidence: number } | null> {
    try {
      // 0. Nếu trường có alias, thử match alias trước
      const aliases = FIELD_ALIASES[field.name] || [field.name];
      // Tìm content có text match alias tốt nhất
      let bestAliasMatch: { content: ExtractedContent; similarity: number } | null = null;
      for (const content of contents) {
        for (const alias of aliases) {
          const match = await enhancedMatcherService.findBestMatch(content.text, [alias]);
          if (!bestAliasMatch || match.similarity > bestAliasMatch.similarity) {
            bestAliasMatch = { content, similarity: match.similarity };
          }
        }
      }
      if (bestAliasMatch && bestAliasMatch.similarity > 0.7) {
        return {
          ...bestAliasMatch.content,
          confidence: bestAliasMatch.similarity
        };
      }

      // 1. Lọc contents theo type phù hợp với field
      let relevantContents = contents.filter(content => {
        switch (field.type) {
          case 'date':
            return content.type === 'date';
          case 'number':
            return content.type === 'number' || content.type === 'currency';
          case 'select':
            return content.type === 'text';
          default:
            return true;
        }
      });

      // 2. Nếu là trường select, tìm match với options
      if (field.type === 'select' && field.options) {
        const optionValues = field.options.map((opt: any) => opt.label);
        const bestMatches = await Promise.all(
          relevantContents.map(async content => {
            const match = await enhancedMatcherService.findBestMatch(
              content.text,
              optionValues
            );
            return {
              ...content,
              matchedText: match.text,
              matchConfidence: match.confidence
            };
          })
        );

        // Lấy match tốt nhất
        const bestMatch = bestMatches.reduce<typeof bestMatches[0] | null>((best, current) => {
          if (!best) return current;
          return (current.matchConfidence > best.matchConfidence) ? current : best;
        }, null);

        if (bestMatch && bestMatch.matchConfidence > 0.7) {
          return {
            ...bestMatch,
            confidence: bestMatch.matchConfidence
          };
        }
      }

      // 3. Xếp hạng contents theo vị trí và độ tin cậy
      const scoredContents = relevantContents.map(content => {
        let positionScore = 0;

        // Tính điểm dựa trên vị trí tương đối
        switch (field.name) {
          case 'date':
            // Ngày thường ở trên cùng
            positionScore = 1 - (content.position.top / 1000);
            break;
          case 'total':
            // Tổng tiền thường ở dưới cùng
            positionScore = content.position.top / 1000;
            break;
          case 'notes':
            // Ghi chú thường ở dưới cùng
            positionScore = content.position.top / 1000;
            break;
          default:
            // Các trường khác ưu tiên theo độ tin cậy OCR
            positionScore = 0.5;
        }

        // Kết hợp điểm vị trí và độ tin cậy OCR
        const score = (positionScore * 0.3) + (content.confidence * 0.7);

        return {
          ...content,
          score
        };
      });

      // 4. Sắp xếp và lấy content có điểm cao nhất
      scoredContents.sort((a, b) => b.score - a.score);
      const bestContent = scoredContents[0];

      if (bestContent && bestContent.score > 0.6) {
        return {
          ...bestContent,
          confidence: bestContent.score
        };
      }

      return null;
    } catch (error) {
      console.error('Error in findBestContentMatch:', error);
      return null;
    }
  }

  private normalizeFieldValue(value: string, type: string): string | number {
    switch (type) {
      case 'number':
        return parseFloat(value.replace(/[^0-9.-]/g, ''));
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          // Nếu không parse được ngày, trả về chuỗi gốc
          return value;
        }
        return date.toISOString();
      default:
        return value;
    }
  }

  private groupItemContents(
    contents: ExtractedContent[]
  ): Array<{
    name: string;
    quantity: string;
    price?: number;
    total?: number;
    confidence: number;
  }> {
    try {
      // 1. Sắp xếp contents theo vị trí (từ trên xuống, trái sang phải)
      const sortedContents = [...contents].sort((a, b) => {
        const rowDiff = Math.abs(a.position.top - b.position.top);
        // Nếu cùng hàng (chênh lệch < 10px)
        if (rowDiff < 10) {
          return a.position.left - b.position.left;
        }
        return a.position.top - b.position.top;
      });

      // 2. Nhóm các content theo hàng
      const rows: ExtractedContent[][] = [];
      let currentRow: ExtractedContent[] = [];
      let lastTop = -1;

      sortedContents.forEach(content => {
        if (lastTop === -1 || Math.abs(content.position.top - lastTop) < 10) {
          // Cùng hàng
          currentRow.push(content);
        } else {
          // Hàng mới
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }
          currentRow = [content];
        }
        lastTop = content.position.top;
      });
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      // 3. Phân tích từng hàng thành item
      const items: Array<{
        name: string;
        quantity: string;
        price?: number;
        total?: number;
        confidence: number;
      }> = [];

      rows.forEach(row => {
        // Bỏ qua các hàng không đủ thông tin
        if (row.length < 2) return;

        // Tìm các thành phần trong hàng
        let name = '';
        let quantity = '';
        let price: number | undefined;
        let total: number | undefined;
        let minConfidence = 1;

        row.forEach(content => {
          minConfidence = Math.min(minConfidence, content.confidence);

          switch (content.type) {
            case 'text':
              // Nếu chưa có tên hoặc content này dài hơn
              if (!name || content.text.length > name.length) {
                name = content.text;
              }
              break;
            case 'number':
              // Số nhỏ thường là số lượng
              const num = parseFloat(content.text.replace(/[^0-9.-]/g, ''));
              if (!quantity && num < 1000) {
                quantity = content.text;
              }
              break;
            case 'currency':
              // Số lớn thường là giá
              const amount = parseFloat(content.text.replace(/[^0-9.-]/g, ''));
              if (amount >= 1000) {
                if (!price) {
                  price = amount;
                } else {
                  // Nếu đã có price, số lớn hơn là total
                  total = Math.max(amount, price);
                  price = Math.min(amount, price);
                }
              }
              break;
          }
        });

        // Thêm item nếu có đủ thông tin cơ bản
        if (name && quantity) {
          items.push({
            name,
            quantity,
            price,
            total,
            confidence: minConfidence
          });
        }
      });

      return items;
    } catch (error) {
      console.error('Error in groupItemContents:', error);
      return [];
    }
  }

  private async getItemNames(): Promise<string[]> {
    const items = await this.prisma.item.findMany({
      where: { isActive: true },
      select: { name: true }
    });
    return items.map((item: { name: string }) => item.name);
  }

  private extractQuantityAndUnit(
    quantityString: string
  ): { quantity: number; unit: string } {
    try {
      // 1. Chuẩn hóa string
      const normalized = quantityString.toLowerCase().trim();
      
      // 2. Tách số và text
      const numberMatch = normalized.match(/^([\d,.]+)/);
      if (!numberMatch) {
        return { quantity: 0, unit: '' };
      }

      // 3. Chuyển đổi số
      const quantity = parseFloat(
        numberMatch[1].replace(/,/g, '')
      );

      // 4. Tìm đơn vị
      const remainingText = normalized.slice(numberMatch[0].length).trim();
      
      // Map các đơn vị phổ biến
      const unitMap: { [key: string]: string } = {
        'kg': 'kg',
        'k.g': 'kg',
        'kgs': 'kg',
        'kilos': 'kg',
        'kilo': 'kg',
        'g': 'g',
        'gram': 'g',
        'gam': 'g',
        'lit': 'l',
        'liter': 'l',
        'l': 'l',
        'ml': 'ml',
        'chai': 'chai',
        'lon': 'lon',
        'hop': 'hộp',
        'hộp': 'hộp',
        'box': 'hộp',
        'thùng': 'thùng',
        'thung': 'thùng',
        'carton': 'thùng',
        'gói': 'gói',
        'goi': 'gói',
        'pack': 'gói',
        'cái': 'cái',
        'cai': 'cái',
        'chiếc': 'cái',
        'chiec': 'cái',
        'piece': 'cái'
      };

      // Tìm đơn vị phù hợp nhất
      let bestUnit = '';
      let bestLength = 0;

      for (const [key, value] of Object.entries(unitMap)) {
        if (remainingText.includes(key) && key.length > bestLength) {
          bestUnit = value;
          bestLength = key.length;
        }
      }

      // Nếu không tìm thấy đơn vị, thử tìm trong toàn bộ string
      if (!bestUnit) {
        for (const [key, value] of Object.entries(unitMap)) {
          if (normalized.includes(key) && key.length > bestLength) {
            bestUnit = value;
            bestLength = key.length;
          }
        }
      }

      return {
        quantity: isNaN(quantity) ? 0 : quantity,
        unit: bestUnit
      };
    } catch (error) {
      console.error('Error in extractQuantityAndUnit:', error);
      return { quantity: 0, unit: '' };
    }
  }

  private calculateOverallConfidence(
    fields: FormField[],
    items: ProcessedForm['items']
  ): number {
    const fieldConfidences = fields.map(f => f.confidence);
    const itemConfidences = items.map(i => i.confidence);
    const allConfidences = [...fieldConfidences, ...itemConfidences];

    return allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length;
  }
}

export default FormContentMatcherService.getInstance(); 