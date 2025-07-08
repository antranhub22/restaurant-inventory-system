import { apiService } from '../services/api.service';

export interface OCRConnectionTestResult {
  backend: {
    success: boolean;
    message: string;
    details?: any;
  };
  ocrEndpoint: {
    success: boolean;
    message: string;
    details?: any;
  };
  auth: {
    success: boolean;
    message: string;
    details?: any;
  };
  overall: {
    success: boolean;
    message: string;
    recommendations: string[];
  };
}

export const testOCRConnection = async (): Promise<OCRConnectionTestResult> => {
  const result: OCRConnectionTestResult = {
    backend: { success: false, message: '' },
    ocrEndpoint: { success: false, message: '' },
    auth: { success: false, message: '' },
    overall: { success: false, message: '', recommendations: [] }
  };

  const recommendations: string[] = [];

  // Test 1: Backend connectivity
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      result.backend = {
        success: true,
        message: 'Backend hoạt động bình thường',
        details: data
      };
    } else {
      result.backend = {
        success: false,
        message: `Backend trả về lỗi: ${response.status} ${response.statusText}`
      };
      recommendations.push('Kiểm tra backend có đang chạy không');
    }
  } catch (error) {
    result.backend = {
      success: false,
      message: `Không thể kết nối đến backend: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
    };
    recommendations.push('Khởi động backend server');
    recommendations.push('Kiểm tra port 3000 có bị chiếm không');
  }

  // Test 2: OCR endpoint availability
  try {
    const response = await fetch('http://localhost:3000/api/ocr-forms/process', {
      method: 'GET',
    });
    
    // 404 or 405 is expected for GET request to POST endpoint
    if (response.status === 404 || response.status === 405) {
      result.ocrEndpoint = {
        success: true,
        message: 'OCR endpoint tồn tại và hoạt động'
      };
    } else {
      result.ocrEndpoint = {
        success: false,
        message: `OCR endpoint trả về status không mong đợi: ${response.status}`
      };
      recommendations.push('Kiểm tra OCR routes có được đăng ký đúng không');
    }
  } catch (error) {
    result.ocrEndpoint = {
      success: false,
      message: `OCR endpoint lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
    };
    recommendations.push('Kiểm tra OCR service có được cài đặt đúng không');
  }

  // Test 3: Authentication
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Test if token is valid
      const response = await fetch('http://localhost:3000/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        result.auth = {
          success: true,
          message: 'Token hợp lệ'
        };
      } else {
        result.auth = {
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        };
        recommendations.push('Đăng nhập lại để lấy token mới');
      }
    } else {
      result.auth = {
        success: false,
        message: 'Chưa có token authentication'
      };
      recommendations.push('Cần đăng nhập trước khi sử dụng OCR');
    }
  } catch (error) {
    result.auth = {
      success: false,
      message: `Lỗi kiểm tra authentication: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
    };
    recommendations.push('Kiểm tra auth service có hoạt động không');
  }

  // Overall assessment
  const allTestsPassed = result.backend.success && result.ocrEndpoint.success && result.auth.success;
  
  result.overall = {
    success: allTestsPassed,
    message: allTestsPassed 
      ? 'Tất cả kết nối OCR hoạt động bình thường' 
      : 'Có vấn đề với kết nối OCR',
    recommendations
  };

  return result;
};

export const testOCRWithSampleImage = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // Create a simple test image (1x1 pixel)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1, 1);
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.8);
    });

    const formData = new FormData();
    formData.append('image', blob, 'test.jpg');
    formData.append('formType', 'IMPORT');

    const response = await apiService.upload('/api/ocr-forms/process', formData);
    
    return {
      success: true,
      message: 'OCR processing test thành công',
      details: response
    };
  } catch (error) {
    return {
      success: false,
      message: `OCR processing test thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
    };
  }
};

export const getOCRStatus = async (): Promise<string> => {
  const testResult = await testOCRConnection();
  
  if (testResult.overall.success) {
    return '✅ OCR Demo sẵn sàng sử dụng';
  } else {
    const issues: string[] = [];
    if (!testResult.backend.success) issues.push('Backend');
    if (!testResult.ocrEndpoint.success) issues.push('OCR Endpoint');
    if (!testResult.auth.success) issues.push('Authentication');
    
    return `❌ OCR Demo có vấn đề: ${issues.join(', ')}`;
  }
};