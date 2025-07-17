const fs = require('fs');
const path = require('path');

console.log('📊 Database Schema Analysis');
console.log('============================');

// Read all migration files
const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
const migrationFolders = fs.readdirSync(migrationsDir)
  .filter(item => fs.statSync(path.join(migrationsDir, item)).isDirectory())
  .sort();

console.log(`\n🔍 Found ${migrationFolders.length} migration(s):`);
migrationFolders.forEach(folder => {
  console.log(`   - ${folder}`);
});

// Analyze each migration
const tables = new Set();
const enums = new Set();
const indexes = new Set();

console.log('\n📋 Analyzing Migration Files...\n');

migrationFolders.forEach(folder => {
  const migrationFile = path.join(migrationsDir, folder, 'migration.sql');
  
  if (fs.existsSync(migrationFile)) {
    const content = fs.readFileSync(migrationFile, 'utf8');
    
    console.log(`🔄 ${folder}:`);
    
    // Extract tables
    const tableMatches = content.match(/CREATE TABLE "(\w+)"/g);
    if (tableMatches) {
      tableMatches.forEach(match => {
        const tableName = match.match(/"(\w+)"/)[1];
        tables.add(tableName);
        console.log(`   ✅ Table: ${tableName}`);
      });
    }
    
    // Extract enums
    const enumMatches = content.match(/CREATE TYPE "(\w+)" AS ENUM/g);
    if (enumMatches) {
      enumMatches.forEach(match => {
        const enumName = match.match(/"(\w+)"/)[1];
        enums.add(enumName);
        console.log(`   📝 Enum: ${enumName}`);
      });
    }
    
    // Extract indexes
    const indexMatches = content.match(/CREATE (?:UNIQUE )?INDEX "(\w+)"/g);
    if (indexMatches) {
      indexMatches.forEach(match => {
        const indexName = match.match(/"(\w+)"/)[1];
        indexes.add(indexName);
        console.log(`   🔗 Index: ${indexName}`);
      });
    }
    
    console.log('');
  }
});

console.log('📊 SCHEMA SUMMARY');
console.log('==================');

console.log(`\n🗃️  Total Tables: ${tables.size}`);
Array.from(tables).sort().forEach(table => {
  console.log(`   - ${table}`);
});

console.log(`\n📋 Total Enums: ${enums.size}`);
Array.from(enums).sort().forEach(enumType => {
  console.log(`   - ${enumType}`);
});

console.log(`\n🔗 Total Indexes: ${indexes.size}`);
Array.from(indexes).sort().forEach(index => {
  console.log(`   - ${index}`);
});

// Analyze current schema.prisma
console.log('\n🔍 Current Prisma Schema Analysis:');
console.log('==================================');

const schemaFile = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaFile)) {
  const schemaContent = fs.readFileSync(schemaFile, 'utf8');
  
  // Count models
  const modelMatches = schemaContent.match(/^model\s+(\w+)/gm);
  const models = modelMatches ? modelMatches.map(m => m.match(/model\s+(\w+)/)[1]) : [];
  
  console.log(`📊 Models in schema.prisma: ${models.length}`);
  models.forEach(model => {
    console.log(`   - ${model}`);
  });
  
  // Check provider
  const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/);
  const provider = providerMatch ? providerMatch[1] : 'unknown';
  console.log(`\n🔧 Database Provider: ${provider}`);
  
  // Check datasource
  const datasourceMatch = schemaContent.match(/url\s*=\s*env\("(\w+)"\)/);
  const envVar = datasourceMatch ? datasourceMatch[1] : 'unknown';
  console.log(`🔗 Environment Variable: ${envVar}`);
}

console.log('\n✅ Schema analysis completed!');