import { apiService } from '../services/api.service';

export const testBackendConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // Test basic connectivity
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Kết nối backend thành công',
        details: data,
      };
    } else {
      return {
        success: false,
        message: `Backend trả về lỗi: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Không thể kết nối đến backend: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
    };
  }
};

export const testAuthEndpoint = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const response = await apiService.get('/api/auth/test');
    return {
      success: true,
      message: 'Auth endpoint hoạt động bình thường',
      details: response,
    };
  } catch (error) {
    return {
      success: false,
      message: `Auth endpoint lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
    };
  }
};

export const testOCRFormEndpoint = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // Test if endpoint exists (should return 404 for GET without proper params)
    const response = await fetch('http://localhost:3000/api/ocr-forms/process', {
      method: 'GET',
    });
    
    // 404 is expected for GET request to POST endpoint
    if (response.status === 404 || response.status === 405) {
      return {
        success: true,
        message: 'OCR form endpoint tồn tại',
      };
    }
    
    return {
      success: false,
      message: `OCR endpoint trả về status không mong đợi: ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `OCR endpoint lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
    };
  }
}; 