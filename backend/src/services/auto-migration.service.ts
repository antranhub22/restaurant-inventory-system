import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import logger from './logger.service';

const execAsync = promisify(exec);

interface DatabaseConfig {
  url: string;
  provider: 'postgresql' | 'mysql' | 'sqlite';
  host: string;
  database: string;
}

interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

class AutoMigrationService {
  private configPath = path.join(__dirname, '../../.db-config.json');
  private backupDir = path.join(__dirname, '../../backups');

  /**
   * Kiểm tra xem DATABASE_URL có thay đổi không
   */
  async checkDatabaseChange(): Promise<boolean> {
    try {
      const currentUrl = process.env.DATABASE_URL;
      const savedConfig = await this.loadSavedConfig();
      
      if (!savedConfig || savedConfig.url !== currentUrl) {
        logger.info('[AUTO-MIGRATION] Database URL changed detected', {
          oldUrl: savedConfig?.url ? this.maskUrl(savedConfig.url) : 'none',
          newUrl: currentUrl ? this.maskUrl(currentUrl) : 'none'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('[AUTO-MIGRATION] Error checking database change', { error });
      return false;
    }
  }

  /**
   * Tự động migration khi phát hiện thay đổi DATABASE_URL
   */
  async autoMigrate(): Promise<MigrationResult> {
    try {
      logger.info('[AUTO-MIGRATION] Starting auto-migration process...');

      const currentUrl = process.env.DATABASE_URL;
      if (!currentUrl) {
        return { success: false, message: 'DATABASE_URL không được thiết lập' };
      }

      const savedConfig = await this.loadSavedConfig();
      const currentConfig = this.parseConnectionString(currentUrl);

      // Nếu đây là lần đầu setup hoặc database chưa có dữ liệu
      if (!savedConfig) {
        await this.initialSetup(currentConfig);
        return { success: true, message: 'Initial database setup completed' };
      }

      // Nếu URL thay đổi, thực hiện migration
      if (savedConfig.url !== currentUrl) {
        return await this.performMigration(savedConfig, currentConfig);
      }

      return { success: true, message: 'No migration needed' };
    } catch (error) {
      logger.error('[AUTO-MIGRATION] Auto-migration failed', { error });
      return { 
        success: false, 
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error 
      };
    }
  }

  /**
   * Backup dữ liệu từ database cũ
   */
  private async backupOldDatabase(config: DatabaseConfig): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
    
    // Tạo backup directory nếu chưa có
    await fs.mkdir(this.backupDir, { recursive: true });

    logger.info('[AUTO-MIGRATION] Creating backup from old database...', {
      provider: config.provider,
      host: config.host,
      database: config.database
    });

    if (config.provider === 'postgresql') {
      const command = `pg_dump "${config.url}" > "${backupFile}"`;
      await execAsync(command);
    } else if (config.provider === 'mysql') {
      // Extract connection details for MySQL
      const url = new URL(config.url);
      const command = `mysqldump -h ${url.hostname} -P ${url.port || 3306} -u ${url.username} -p${url.password} ${url.pathname.slice(1)} > "${backupFile}"`;
      await execAsync(command);
    } else {
      throw new Error(`Backup not supported for provider: ${config.provider}`);
    }

    logger.info('[AUTO-MIGRATION] Backup created successfully', { backupFile });
    return backupFile;
  }

  /**
   * Setup schema cho database mới
   */
  private async setupNewDatabase(): Promise<void> {
    logger.info('[AUTO-MIGRATION] Setting up schema on new database...');
    
    try {
      // Prisma migrate hoặc push schema
      await execAsync('npx prisma migrate deploy');
      logger.info('[AUTO-MIGRATION] Schema migration completed');
    } catch (error) {
      // Fallback to push if migrate fails
      logger.warn('[AUTO-MIGRATION] Migrate failed, trying push...', { error });
      await execAsync('npx prisma db push --force-reset');
      logger.info('[AUTO-MIGRATION] Schema push completed');
    }
  }

  /**
   * Import dữ liệu vào database mới
   */
  private async importData(backupFile: string, newConfig: DatabaseConfig): Promise<void> {
    logger.info('[AUTO-MIGRATION] Importing data to new database...', {
      backupFile,
      provider: newConfig.provider
    });

    if (newConfig.provider === 'postgresql') {
      const command = `psql "${newConfig.url}" < "${backupFile}"`;
      await execAsync(command);
    } else if (newConfig.provider === 'mysql') {
      const url = new URL(newConfig.url);
      const command = `mysql -h ${url.hostname} -P ${url.port || 3306} -u ${url.username} -p${url.password} ${url.pathname.slice(1)} < "${backupFile}"`;
      await execAsync(command);
    } else {
      throw new Error(`Import not supported for provider: ${newConfig.provider}`);
    }

    logger.info('[AUTO-MIGRATION] Data import completed');
  }

  /**
   * Verify data integrity sau migration
   */
  private async verifyMigration(): Promise<boolean> {
    try {
      logger.info('[AUTO-MIGRATION] Verifying data integrity...');
      
      const prisma = new PrismaClient();
      
      // Kiểm tra các table chính có dữ liệu
      const checks = await Promise.all([
        prisma.user.count(),
        prisma.category.count(),
        prisma.supplier.count(),
        prisma.item.count(),
        prisma.import.count()
      ]);

      const [userCount, categoryCount, supplierCount, itemCount, importCount] = checks;
      
      logger.info('[AUTO-MIGRATION] Data verification results', {
        users: userCount,
        categories: categoryCount,
        suppliers: supplierCount,
        items: itemCount,
        imports: importCount
      });

      // Kiểm tra có ít nhất categories và users
      const isValid = categoryCount > 0 && userCount > 0;
      
      await prisma.$disconnect();
      return isValid;
    } catch (error) {
      logger.error('[AUTO-MIGRATION] Verification failed', { error });
      return false;
    }
  }

  /**
   * Thực hiện migration process đầy đủ
   */
  private async performMigration(oldConfig: DatabaseConfig, newConfig: DatabaseConfig): Promise<MigrationResult> {
    try {
      logger.info('[AUTO-MIGRATION] Starting migration process...', {
        from: this.maskUrl(oldConfig.url),
        to: this.maskUrl(newConfig.url)
      });

      // Bước 1: Backup dữ liệu cũ
      const backupFile = await this.backupOldDatabase(oldConfig);

      // Bước 2: Setup schema mới
      await this.setupNewDatabase();

      // Bước 3: Import dữ liệu
      await this.importData(backupFile, newConfig);

      // Bước 4: Verify integrity
      const isValid = await this.verifyMigration();
      
      if (!isValid) {
        throw new Error('Data verification failed after migration');
      }

      // Bước 5: Save new config
      await this.saveCurrentConfig(newConfig);

      // Bước 6: Seed additional data if needed
      await this.seedIfNeeded();

      logger.info('[AUTO-MIGRATION] Migration completed successfully');
      
      return {
        success: true,
        message: 'Migration completed successfully',
        details: {
          backupFile,
          oldProvider: oldConfig.provider,
          newProvider: newConfig.provider
        }
      };
    } catch (error) {
      logger.error('[AUTO-MIGRATION] Migration process failed', { error });
      throw error;
    }
  }

  /**
   * Initial setup cho database mới (lần đầu)
   */
  private async initialSetup(config: DatabaseConfig): Promise<void> {
    logger.info('[AUTO-MIGRATION] Performing initial database setup...');
    
    // Setup schema
    await this.setupNewDatabase();
    
    // Run seeds
    await this.seedIfNeeded();
    
    // Save config
    await this.saveCurrentConfig(config);
    
    logger.info('[AUTO-MIGRATION] Initial setup completed');
  }

  /**
   * Seed data nếu cần thiết
   */
  private async seedIfNeeded(): Promise<void> {
    try {
      logger.info('[AUTO-MIGRATION] Running database seeds...');
      await execAsync('npm run seed');
      logger.info('[AUTO-MIGRATION] Seeds completed');
    } catch (error) {
      logger.warn('[AUTO-MIGRATION] Seeding failed, but continuing...', { error });
    }
  }

  /**
   * Parse connection string thành config object
   */
  private parseConnectionString(url: string): DatabaseConfig {
    const urlObj = new URL(url);
    
    let provider: 'postgresql' | 'mysql' | 'sqlite';
    if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
      provider = 'postgresql';
    } else if (url.startsWith('mysql://')) {
      provider = 'mysql';
    } else if (url.startsWith('sqlite:') || url.startsWith('file:')) {
      provider = 'sqlite';
    } else {
      throw new Error(`Unsupported database provider in URL: ${url}`);
    }

    return {
      url,
      provider,
      host: urlObj.hostname || 'localhost',
      database: urlObj.pathname.slice(1) || 'default'
    };
  }

  /**
   * Load saved database config
   */
  private async loadSavedConfig(): Promise<DatabaseConfig | null> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save current database config
   */
  private async saveCurrentConfig(config: DatabaseConfig): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    logger.info('[AUTO-MIGRATION] Database config saved');
  }

  /**
   * Mask sensitive URL for logging
   */
  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.username}:***@${urlObj.host}${urlObj.pathname}`;
    } catch {
      return '***masked***';
    }
  }

  /**
   * Check if auto-migration is enabled
   */
  isEnabled(): boolean {
    return process.env.AUTO_MIGRATION_ENABLED === 'true';
  }
}

export default new AutoMigrationService(); 