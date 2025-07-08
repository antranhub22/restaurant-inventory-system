import { distance } from 'fastest-levenshtein';
import Fuse from 'fuse.js';

interface VietnameseNormalizationMap {
  [key: string]: string[];
}

interface MatchResult {
  text: string;
  similarity: number;
  method: 'exact' | 'noAccent' | 'levenshtein' | 'fuzzy';
}

interface FuseResult {
  item: string;
  score?: number;
}

export class EnhancedVietnameseTextService {
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
    'g': ['gr', 'gram', 'gam'],
    'l': ['lit', 'liter', 'lít'],
    'ml': ['mlit', 'millit', 'milit'],
    'chai': ['lo', 'lọ', 'hộp', 'bottle'],
    'thùng': ['thung', 'hop', 'box', 'carton'],
    'gói': ['goi', 'túi', 'tui', 'pack', 'bag'],
    'hộp': ['hop', 'box', 'case'],
    'cái': ['cai', 'chiếc', 'chiec', 'piece'],
    'kg': ['kgs', 'kilo', 'kilos', 'ký', 'ki'],
    'tấn': ['tan', 'tấn', 'tonnes', 'tons'],
    'lít': ['lit', 'liter', 'litre'],
    'mét': ['met', 'meter', 'metre']
  };

  private fuzzyMatcher: Fuse<string>;

  constructor() {
    // Khởi tạo Fuse.js với các options phù hợp cho tiếng Việt
    const allVariants = Object.values(EnhancedVietnameseTextService.COMMON_TYPOS).flat();
    this.fuzzyMatcher = new Fuse(allVariants, {
      threshold: 0.3,
      distance: 100,
      includeScore: true
    });
  }

  public removeAccents(text: string): string {
    const chars = [...text];
    return chars.map(char => {
      for (const [base, variants] of Object.entries(EnhancedVietnameseTextService.VIETNAMESE_CHARS)) {
        if (variants.includes(char.toLowerCase())) {
          return base;
        }
      }
      return char;
    }).join('');
  }

  public normalizeVietnameseText(text: string): string {
    // Chuyển về chữ thường
    let normalized = text.toLowerCase();
    
    // Xóa các ký tự đặc biệt nhưng giữ lại dấu tiếng Việt
    normalized = normalized.replace(/[^a-zA-Z0-9\s\u0080-\uFFFF]/g, '');
    
    // Chuẩn hóa khoảng trắng
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  public findBestMatch(input: string, candidates: string[]): MatchResult {
    const normalizedInput = this.normalizeVietnameseText(input);
    const inputNoAccents = this.removeAccents(normalizedInput);
    
    let bestMatch: MatchResult = {
      text: '',
      similarity: 0,
      method: 'exact'
    };

    // 1. Tìm match chính xác
    const exactMatch = candidates.find(c => 
      this.normalizeVietnameseText(c) === normalizedInput
    );
    if (exactMatch) {
      return {
        text: exactMatch,
        similarity: 1,
        method: 'exact'
      };
    }

    // 2. Tìm match không dấu
    const noAccentMatch = candidates.find(c => 
      this.removeAccents(this.normalizeVietnameseText(c)) === inputNoAccents
    );
    if (noAccentMatch) {
      return {
        text: noAccentMatch,
        similarity: 0.9,
        method: 'noAccent'
      };
    }

    // 3. Tìm match Levenshtein
    for (const candidate of candidates) {
      const normalizedCandidate = this.normalizeVietnameseText(candidate);
      const candidateNoAccents = this.removeAccents(normalizedCandidate);
      
      const levenDist = distance(inputNoAccents, candidateNoAccents);
      const maxLength = Math.max(inputNoAccents.length, candidateNoAccents.length);
      const similarity = 1 - (levenDist / maxLength);

      if (similarity > bestMatch.similarity) {
        bestMatch = {
          text: candidate,
          similarity,
          method: 'levenshtein'
        };
      }
    }

    // 4. Nếu vẫn chưa tìm được match tốt, thử fuzzy matching
    if (bestMatch.similarity < 0.7) {
      const fuzzyResults = this.fuzzyMatcher.search(inputNoAccents);
      if (fuzzyResults.length > 0 && fuzzyResults[0].score) {
        const fuzzyScore = 1 - fuzzyResults[0].score; // Chuyển đổi điểm Fuse.js
        if (fuzzyScore > bestMatch.similarity) {
          bestMatch = {
            text: fuzzyResults[0].item,
            similarity: fuzzyScore,
            method: 'fuzzy'
          };
        }
      }
    }

    return bestMatch;
  }

  public normalizeUnit(unit: string): string {
    const normalizedUnit = this.normalizeVietnameseText(unit);
    
    // Tìm đơn vị chuẩn từ các variant
    for (const [standard, variants] of Object.entries(EnhancedVietnameseTextService.COMMON_TYPOS)) {
      if (variants.includes(normalizedUnit)) {
        return standard;
      }
    }

    // Thử fuzzy matching nếu không tìm thấy match chính xác
    const fuzzyResults = this.fuzzyMatcher.search(normalizedUnit);
    if (fuzzyResults.length > 0 && fuzzyResults[0].score && fuzzyResults[0].score < 0.3) {
      for (const [standard, variants] of Object.entries(EnhancedVietnameseTextService.COMMON_TYPOS)) {
        if (variants.includes(fuzzyResults[0].item)) {
          return standard;
        }
      }
    }
    
    return unit;
  }

  public isUnit(text: string): boolean {
    const normalized = this.normalizeVietnameseText(text);
    
    // Kiểm tra trong danh sách đơn vị chuẩn và variants
    for (const variants of Object.values(EnhancedVietnameseTextService.COMMON_TYPOS)) {
      if (variants.includes(normalized)) {
        return true;
      }
    }

    // Thử fuzzy matching
    const fuzzyResults = this.fuzzyMatcher.search(normalized);
    return fuzzyResults.length > 0 && fuzzyResults[0].score && fuzzyResults[0].score < 0.3;
  }

  public getUnitSuggestions(text: string): string[] {
    const normalized = this.normalizeVietnameseText(text);
    const fuzzyResults = this.fuzzyMatcher.search(normalized);
    
    return fuzzyResults
      .filter((result: FuseResult) => typeof result.score === 'number' && result.score < 0.4)
      .map((result: FuseResult) => result.item);
  }
}

export default new EnhancedVietnameseTextService(); 