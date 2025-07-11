const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testPendingImports() {
  try {
    console.log('🧪 Testing Pending Imports API...\n');

    // Test 1: Get all imports
    console.log('1. Testing GET /imports...');
    const allImports = await axios.get(`${API_BASE}/imports`);
    console.log(`   ✅ Found ${allImports.data.length} total imports`);

    // Test 2: Get pending imports specifically  
    console.log('2. Testing GET /imports/pending...');
    const pendingImports = await axios.get(`${API_BASE}/imports/pending`);
    
    if (pendingImports.data.success) {
      const pendingData = pendingImports.data.data || [];
      console.log(`   ✅ Found ${pendingData.length} pending imports`);
      
      if (pendingData.length > 0) {
        console.log('\n📋 Recent Pending Imports:');
        pendingData.slice(0, 3).forEach((imp, index) => {
          console.log(`   ${index + 1}. ID: ${imp.id} | Status: ${imp.status} | Supplier: ${imp.supplier?.name || 'Unknown'} | Items: ${imp.items?.length || 0}`);
          console.log(`      Created: ${new Date(imp.createdAt).toLocaleString()}`);
          console.log(`      Invoice: ${imp.invoiceNumber || 'N/A'} | Total: ${imp.totalAmount || 0} VND`);
        });
      } else {
        console.log('   ⚠️  No pending imports found');
        console.log('   💡 Try processing an OCR form first');
      }
    } else {
      console.log(`   ❌ API returned error: ${pendingImports.data.message}`);
    }

    console.log('\n🎯 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run test
testPendingImports(); 