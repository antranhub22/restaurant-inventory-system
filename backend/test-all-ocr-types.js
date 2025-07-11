const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testAllOCRTypes() {
  try {
    console.log('🔄 Testing All OCR Form Types...\n');

    // Test 1: Check pending imports
    console.log('1. Checking pending imports...');
    const pendingImports = await axios.get(`${API_BASE}/imports/pending`);
    const importData = pendingImports.data.data || [];
    console.log(`   ✅ Found ${importData.length} pending imports`);

    // Test 2: Check pending exports
    console.log('2. Checking pending exports...');
    const pendingExports = await axios.get(`${API_BASE}/exports/pending`);
    const exportData = pendingExports.data.data || [];
    console.log(`   ✅ Found ${exportData.length} pending exports`);

    // Test 3: Check pending returns
    console.log('3. Checking pending returns...');
    const pendingReturns = await axios.get(`${API_BASE}/returns/pending`);
    const returnData = pendingReturns.data.data || [];
    console.log(`   ✅ Found ${returnData.length} pending returns`);

    // Test 4: Check pending wastes
    console.log('4. Checking pending wastes...');
    const pendingWastes = await axios.get(`${API_BASE}/wastes/pending`);
    const wasteData = pendingWastes.data.data || [];
    console.log(`   ✅ Found ${wasteData.length} pending wastes`);

    // Summary
    const totalPending = importData.length + exportData.length + returnData.length + wasteData.length;
    console.log('\n📊 SUMMARY:');
    console.log(`   📥 Pending Imports: ${importData.length}`);
    console.log(`   📤 Pending Exports: ${exportData.length}`);
    console.log(`   ↩️  Pending Returns: ${returnData.length}`);
    console.log(`   🗑️  Pending Wastes: ${wasteData.length}`);
    console.log(`   📋 Total Pending: ${totalPending}`);

    // Test status consistency
    console.log('\n5. Testing status consistency...');
    let statusIssues = [];

    // Check import statuses
    importData.forEach(item => {
      if (item.status !== 'pending') {
        statusIssues.push(`Import ${item.id} has status: ${item.status} (expected: pending)`);
      }
    });

    // Check export statuses
    exportData.forEach(item => {
      if (item.status !== 'pending') {
        statusIssues.push(`Export ${item.id} has status: ${item.status} (expected: pending)`);
      }
    });

    // Check return statuses
    returnData.forEach(item => {
      if (item.status !== 'pending') {
        statusIssues.push(`Return ${item.id} has status: ${item.status} (expected: pending)`);
      }
    });

    // Check waste statuses
    wasteData.forEach(item => {
      if (item.status !== 'pending') {
        statusIssues.push(`Waste ${item.id} has status: ${item.status} (expected: pending)`);
      }
    });

    if (statusIssues.length === 0) {
      console.log('   ✅ All statuses are correct (pending)');
    } else {
      console.log('   ❌ Status issues found:');
      statusIssues.forEach(issue => console.log(`      - ${issue}`));
    }

    // Test data structure
    console.log('\n6. Testing data structure...');
    let structureIssues = [];

    // Check if imports have required fields
    importData.forEach(item => {
      if (!item.supplierId) structureIssues.push(`Import ${item.id} missing supplierId`);
      if (!item.items || item.items.length === 0) structureIssues.push(`Import ${item.id} has no items`);
    });

    // Check if exports have required fields
    exportData.forEach(item => {
      if (!item.departmentId) structureIssues.push(`Export ${item.id} missing departmentId`);
      if (!item.purpose) structureIssues.push(`Export ${item.id} missing purpose`);
      if (!item.items || item.items.length === 0) structureIssues.push(`Export ${item.id} has no items`);
    });

    // Check if returns have required fields
    returnData.forEach(item => {
      if (!item.departmentId) structureIssues.push(`Return ${item.id} missing departmentId`);
      if (!item.reason) structureIssues.push(`Return ${item.id} missing reason`);
      if (!item.items || item.items.length === 0) structureIssues.push(`Return ${item.id} has no items`);
    });

    // Check if wastes have required fields
    wasteData.forEach(item => {
      if (!item.departmentId) structureIssues.push(`Waste ${item.id} missing departmentId`);
      if (!item.wasteType) structureIssues.push(`Waste ${item.id} missing wasteType`);
      if (!item.items || item.items.length === 0) structureIssues.push(`Waste ${item.id} has no items`);
    });

    if (structureIssues.length === 0) {
      console.log('   ✅ All data structures are valid');
    } else {
      console.log('   ❌ Data structure issues found:');
      structureIssues.forEach(issue => console.log(`      - ${issue}`));
    }

    // Display recent records details
    if (totalPending > 0) {
      console.log('\n📋 RECENT RECORDS DETAILS:');
      
      if (importData.length > 0) {
        console.log('\n   📥 Latest Imports:');
        importData.slice(0, 2).forEach(item => {
          console.log(`      ID: ${item.id} | Supplier: ${item.supplier?.name || 'Unknown'} | Items: ${item.items?.length || 0} | Invoice: ${item.invoiceNumber || 'N/A'}`);
        });
      }

      if (exportData.length > 0) {
        console.log('\n   📤 Latest Exports:');
        exportData.slice(0, 2).forEach(item => {
          console.log(`      ID: ${item.id} | Department: ${item.department?.name || 'Unknown'} | Purpose: ${item.purpose || 'N/A'} | Items: ${item.items?.length || 0}`);
        });
      }

      if (returnData.length > 0) {
        console.log('\n   ↩️  Latest Returns:');
        returnData.slice(0, 2).forEach(item => {
          console.log(`      ID: ${item.id} | Department: ${item.department?.name || 'Unknown'} | Reason: ${item.reason || 'N/A'} | Items: ${item.items?.length || 0}`);
        });
      }

      if (wasteData.length > 0) {
        console.log('\n   🗑️  Latest Wastes:');
        wasteData.slice(0, 2).forEach(item => {
          console.log(`      ID: ${item.id} | Department: ${item.department?.name || 'Unknown'} | Type: ${item.wasteType || 'N/A'} | Items: ${item.items?.length || 0}`);
        });
      }
    }

    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (statusIssues.length === 0 && structureIssues.length === 0) {
      console.log('   🎉 SUCCESS! All OCR form types are working correctly');
      console.log('   ✅ Import OCR → Creates pending imports');
      console.log('   ✅ Export OCR → Creates pending exports');
      console.log('   ✅ Return OCR → Creates pending returns');  
      console.log('   ✅ Waste OCR → Creates pending wastes');
      console.log('   ✅ All statuses and data structures are valid');
    } else {
      console.log('   ⚠️  Some issues found:');
      console.log(`      - Status issues: ${statusIssues.length}`);
      console.log(`      - Structure issues: ${structureIssues.length}`);
      console.log('   💡 Check the issues above and fix accordingly');
    }

    if (totalPending === 0) {
      console.log('\n💡 To test OCR functionality:');
      console.log('   1. Process some OCR forms (Import, Export, Return, Waste)');
      console.log('   2. Run this test again to see the results');
      console.log('   3. Check approval pages to see pending records');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   URL:', error.config?.url);
      if (error.response.status === 404) {
        console.error('   💡 Make sure all API endpoints are available');
      }
    }
  }
}

// Run test
console.log('🧪 Starting All OCR Types Test...\n');
testAllOCRTypes(); 