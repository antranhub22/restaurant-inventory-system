import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload file vào thư mục lưu trữ
 * @param buffer Buffer của file
 * @param folder Thư mục lưu trữ (relative to uploads/)
 * @returns Đường dẫn tới file
 */
export async function uploadToStorage(
  buffer: Buffer,
  folder: string
): Promise<string> {
  try {
    // 1. Tạo tên file unique
    const fileName = `${uuidv4()}.jpg`;
    
    // 2. Tạo đường dẫn
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    const filePath = path.join(uploadDir, fileName);
    
    // 3. Tạo thư mục nếu chưa có
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 4. Lưu file
    await fs.promises.writeFile(filePath, buffer);
    
    // 5. Trả về đường dẫn relative
    return path.join(folder, fileName);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Lỗi khi lưu file');
  }
} 