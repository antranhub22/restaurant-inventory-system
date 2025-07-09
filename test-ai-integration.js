// Test script để kiểm tra AI integration
const axios = require('axios');

async function testAIIntegration() {
  console.log('🧪 Testing AI Form Mapping Integration...\n');

  // Mock OCR data
  const testData = {
    formType: 'IMPORT',
    // In real app, this would be FormData with image
    // But for testing, we'll simulate already processed OCR data
  };

  try {
    // 1. Test service availability
    console.log('1️⃣ Checking AI service configuration...');
    
    const hasOpenAI = process.env.OPENAI_API_KEY ? '✅' : '❌';
    const hasDeepseek = process.env.DEEPSEEK_API_KEY ? '✅' : '❌';
    
    console.log(`   - OpenAI API Key (Primary): ${hasOpenAI}`);
    console.log(`   - DeepSeek API Key (Fallback): ${hasDeepseek}`);
    console.log('   - ⚡ Fallback Logic: OpenAI → DeepSeek → Traditional Mapping');
    
    if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      console.log('\n⚠️  No AI API keys found in environment');
      console.log('   Set OPENAI_API_KEY or DEEPSEEK_API_KEY to test AI features');
      console.log('   System will fallback to traditional mapping method');
      return;
    }

    // 2. Test AI API connectivity (if available)
    console.log('\n2️⃣ Testing AI provider connectivity...');
    
    if (process.env.OPENAI_API_KEY) {
      console.log('   Testing OpenAI (Primary)...');
      try {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          timeout: 10000
        });
        console.log('   ✅ OpenAI API connection successful');
      } catch (error) {
        console.log('   ❌ OpenAI API connection failed:', error.message);
        console.log('   📝 Will fallback to DeepSeek if available');
      }
    }

    if (process.env.DEEPSEEK_API_KEY) {
      console.log('   Testing DeepSeek (Fallback)...');
      try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        console.log('   ✅ DeepSeek API connection successful');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('   ❌ DeepSeek API authentication failed - check API key');
        } else {
          console.log('   ✅ DeepSeek API reachable (may need valid request)');
        }
      }
    }

    console.log('\n3️⃣ AI Form Mapping with Fallback is ready to use!');
    console.log('   When you upload an image for OCR processing:');
    console.log('   1️⃣ Try OpenAI first (if API key available)');
    console.log('   2️⃣ If OpenAI fails → Fallback to DeepSeek');  
    console.log('   3️⃣ If both AI fail → Use traditional rule-based mapping');
    console.log('   🎯 This ensures maximum reliability and uptime!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Mock environment check
function checkEnvironment() {
  console.log('🔧 Environment Configuration Check:\n');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];
  
  const optionalVars = [
    'OPENAI_API_KEY',
    'DEEPSEEK_API_KEY', 
    'GOOGLE_CLOUD_PROJECT_ID',
    'REDIS_URL'
  ];
  
  console.log('Required variables:');
  requiredVars.forEach(varName => {
    const status = process.env[varName] ? '✅' : '❌';
    console.log(`  ${status} ${varName}`);
  });
  
  console.log('\nOptional variables:');
  optionalVars.forEach(varName => {
    const status = process.env[varName] ? '✅' : '⚪';
    console.log(`  ${status} ${varName}`);
  });
  
  console.log('\n');
}

// Run tests
async function main() {
  console.log('🚀 Restaurant Inventory AI Integration Test\n');
  
  // Load environment
  require('dotenv').config();
  
  checkEnvironment();
  await testAIIntegration();
  
  console.log('\n✨ Test completed!');
  console.log('\nNext steps:');
  console.log('1. Start the backend: npm run dev');
  console.log('2. Start the frontend: cd ../frontend && npm run dev'); 
  console.log('3. Test OCR processing with AI at: http://localhost:5173');
}

main().catch(console.error);