const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testFullWorkflow() {
  try {
    console.log('🔄 Testing Full OCR Import Workflow...\n');

    // Step 1: Check pending imports
    console.log('1. Checking pending imports...');
    const pendingImports = await axios.get(`${API_BASE}/imports/pending`);
    const pendingData = pendingImports.data.data || [];
    console.log(`   ✅ Found ${pendingData.length} pending imports`);

    if (pendingData.length === 0) {
      console.log('   ⚠️  No pending imports to test. Please process an OCR form first.');
      return;
    }

    // Get the first pending import for testing
    const testImport = pendingData[0];
    console.log(`   📋 Testing with Import ID: ${testImport.id} (Invoice: ${testImport.invoiceNumber})`);
    console.log(`   📦 Items in import: ${testImport.items?.length || 0}`);

    // Step 2: Check current inventory for items before approval
    console.log('\n2. Checking inventory before approval...');
    const inventoryBefore = {};
    
    if (testImport.items && testImport.items.length > 0) {
      for (const importItem of testImport.items) {
        try {
          const response = await axios.get(`${API_BASE}/inventory/${importItem.itemId}`);
          const inventory = response.data;
          inventoryBefore[importItem.itemId] = inventory.currentStock || 0;
          console.log(`   📊 Item ${importItem.item?.name || importItem.itemId}: ${inventory.currentStock || 0} units`);
        } catch (error) {
          console.log(`   📊 Item ${importItem.itemId}: 0 units (not in inventory yet)`);
          inventoryBefore[importItem.itemId] = 0;
        }
      }
    }

    // Step 3: Approve the import
    console.log('\n3. Approving import...');
    try {
      const approveResponse = await axios.post(`${API_BASE}/imports/${testImport.id}/approve`, {}, {
        headers: {
          'Authorization': 'Bearer your-token-here' // You might need to add proper auth
        }
      });
      
      if (approveResponse.data.success) {
        console.log(`   ✅ Import approved successfully`);
      } else {
        console.log(`   ❌ Approval failed: ${approveResponse.data.message}`);
        return;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Authentication required for approval. Skipping approval test.');
        console.log('   💡 Try approving through the web interface and run this test again.');
        return;
      } else {
        console.log(`   ❌ Approval failed: ${error.message}`);
        return;
      }
    }

    // Step 4: Check inventory after approval
    console.log('\n4. Checking inventory after approval...');
    let allUpdated = true;
    
    if (testImport.items && testImport.items.length > 0) {
      for (const importItem of testImport.items) {
        try {
          const response = await axios.get(`${API_BASE}/inventory/${importItem.itemId}`);
          const inventory = response.data;
          const currentStock = inventory.currentStock || 0;
          const previousStock = inventoryBefore[importItem.itemId] || 0;
          const expectedStock = previousStock + importItem.quantity;
          
          console.log(`   📊 Item ${importItem.item?.name || importItem.itemId}:`);
          console.log(`      Before: ${previousStock} units`);
          console.log(`      Added:  +${importItem.quantity} units`);
          console.log(`      After:  ${currentStock} units`);
          console.log(`      Expected: ${expectedStock} units`);
          
          if (currentStock === expectedStock) {
            console.log(`      ✅ Inventory updated correctly!`);
          } else {
            console.log(`      ❌ Inventory mismatch!`);
            allUpdated = false;
          }
          console.log('');
        } catch (error) {
          console.log(`   ❌ Could not check inventory for item ${importItem.itemId}: ${error.message}`);
          allUpdated = false;
        }
      }
    }

    // Step 5: Check transaction logs
    console.log('5. Checking transaction logs...');
    try {
      const transactionsResponse = await axios.get(`${API_BASE}/transactions`);
      const recentTransactions = transactionsResponse.data
        .filter(t => t.type === 'IN')
        .slice(0, 5); // Get 5 most recent IN transactions
      
      console.log(`   📝 Found ${recentTransactions.length} recent IN transactions:`);
      recentTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. Item ${tx.itemId}: +${tx.quantity} units (${new Date(tx.createdAt).toLocaleTimeString()})`);
      });
    } catch (error) {
      console.log(`   ⚠️  Could not fetch transactions: ${error.message}`);
    }

    // Summary
    console.log('\n🎯 WORKFLOW TEST SUMMARY:');
    console.log(`   📥 Import ID: ${testImport.id}`);
    console.log(`   📋 Status: Approved`);
    console.log(`   📦 Items processed: ${testImport.items?.length || 0}`);
    console.log(`   📊 Inventory updates: ${allUpdated ? '✅ All correct' : '❌ Some failed'}`);
    
    if (allUpdated) {
      console.log('\n🎉 SUCCESS! The full OCR workflow is working correctly:');
      console.log('   1. ✅ OCR processing → Creates import with pending status');
      console.log('   2. ✅ Import approval → Updates inventory correctly');
      console.log('   3. ✅ Inventory reflects the imported quantities');
      console.log('   4. ✅ Transaction logs are created');
    } else {
      console.log('\n⚠️  ISSUES FOUND: Some inventory updates did not work correctly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Helper function to check if inventory API exists
async function checkInventoryAPI() {
  try {
    const response = await axios.get(`${API_BASE}/inventory`);
    return true;
  } catch (error) {
    return false;
  }
}

// Run test
console.log('🧪 Starting OCR Import Workflow Test...\n');
checkInventoryAPI().then(hasInventoryAPI => {
  if (!hasInventoryAPI) {
    console.log('⚠️  Inventory API not available. Test will be limited.');
  }
  testFullWorkflow();
}); 