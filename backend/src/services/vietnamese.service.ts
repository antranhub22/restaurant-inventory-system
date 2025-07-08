import { distance } from 'fastest-levenshtein';

interface VietnameseNormalizationMap {
  [key: string]: string[];
}

class VietnameseTextService {
  private static readonly VIETNAMESE_CHARS: VietnameseNormalizationMap = {
    'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
    'ă': ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
    'â': ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
    'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
    'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
    'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
    'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
    'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
    'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
    'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
    'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
    'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
    'd': ['d', 'đ']
  };

  private static readonly COMMON_TYPOS: { [key: string]: string[] } = {
    'kilogram': ['kgs', 'kilo', 'kilos', 'kilogram', 'kí', 'ký', 'ki', 'ky'],
    'g': ['gr', 'gram'],
    'l': ['lit', 'liter'],
    'ml': ['mlit', 'millit'],
    'chai': ['lo', 'lọ', 'hộp'],
    'thùng': ['thung', 'hop'],
    'gói': ['goi', 'túi', 'tui'],
    'hộp': ['hop', 'box'],
    'cái': ['cai', 'chiếc', 'chiec']
  };

  // Chuyển đổi text thành dạng không dấu
  public removeAccents(text: string): string {
    const chars = [...text];
    return chars.map(char => {
      for (const [base, variants] of Object.entries(VietnameseTextService.VIETNAMESE_CHARS)) {
        if (variants.includes(char.toLowerCase())) {
          return base;
        }
      }
      return char;
    }).join('');
  }

  // Chuẩn hóa text tiếng Việt
  public normalizeVietnameseText(text: string): string {
    // Chuyển về chữ thường
    let normalized = text.toLowerCase();
    
    // Xóa các ký tự đặc biệt
    normalized = normalized.replace(/[^a-zA-Z0-9\s\u0080-\uFFFF]/g, '');
    
    // Chuẩn hóa khoảng trắng
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  // So khớp mờ với danh sách các từ
  public findBestMatch(input: string, candidates: string[]): { text: string; similarity: number } {
    const normalizedInput = this.normalizeVietnameseText(input);
    const inputNoAccents = this.removeAccents(normalizedInput);
    
    let bestMatch = '';
    let bestSimilarity = 0;

    for (const candidate of candidates) {
      const normalizedCandidate = this.normalizeVietnameseText(candidate);
      const candidateNoAccents = this.removeAccents(normalizedCandidate);
      
      // Tính điểm giống nhau
      let similarity = 0;
      
      // So khớp chính xác
      if (normalizedInput === normalizedCandidate) {
        similarity = 1;
      }
      // So khớp không dấu
      else if (inputNoAccents === candidateNoAccents) {
        similarity = 0.9;
      }
      // So khớp Levenshtein
      else {
        const maxLength = Math.max(inputNoAccents.length, candidateNoAccents.length);
        const levenDist = distance(inputNoAccents, candidateNoAccents);
        similarity = 1 - (levenDist / maxLength);
      }

      if (similarity > bestSimilarity) {
        bestMatch = candidate;
        bestSimilarity = similarity;
      }
    }

    return {
      text: bestMatch,
      similarity: bestSimilarity
    };
  }

  // Chuẩn hóa đơn vị đo
  public normalizeUnit(unit: string): string {
    const normalizedUnit = this.normalizeVietnameseText(unit);
    
    for (const [standard, variants] of Object.entries(VietnameseTextService.COMMON_TYPOS)) {
      if (variants.includes(normalizedUnit)) {
        return standard;
      }
    }
    
    return unit;
  }

  // Kiểm tra xem một từ có phải là đơn vị đo không
  public isUnit(text: string): boolean {
    const normalized = this.normalizeVietnameseText(text);
    
    // Kiểm tra trong danh sách đơn vị chuẩn
    for (const [_, variants] of Object.entries(VietnameseTextService.COMMON_TYPOS)) {
      if (variants.includes(normalized)) {
        return true;
      }
    }
    
    return false;
  }
}

export default new VietnameseTextService(); 