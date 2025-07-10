// Quick test to verify settings API integration
console.log('🧪 Testing Settings API Integration...');

// Test the API endpoints directly
async function testSettingsIntegration() {
  try {
    // Test 1: Fetch settings
    console.log('📥 Testing GET /api/user-settings');
    const response1 = await fetch('http://localhost:3003/api/user-settings');
    const settings = await response1.json();
    console.log('✅ Current settings:', settings);
    
    // Test 2: Update settings
    console.log('📤 Testing PUT /api/user-settings');
    const updates = {
      theme: settings.theme === 'light' ? 'dark' : 'light'
    };
    const response2 = await fetch('http://localhost:3003/api/user-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedSettings = await response2.json();
    console.log('✅ Updated settings:', updatedSettings);
    
    // Test 3: Verify the change persisted
    console.log('🔍 Verifying persistence...');
    const response3 = await fetch('http://localhost:3003/api/user-settings');
    const verifySettings = await response3.json();
    console.log('✅ Verified settings:', verifySettings);
    
    if (verifySettings.theme === updatedSettings.theme) {
      console.log('🎉 Settings persistence test PASSED!');
    } else {
      console.log('❌ Settings persistence test FAILED!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSettingsIntegration();
