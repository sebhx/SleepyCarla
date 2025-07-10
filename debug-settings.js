async function testUserSettingsPut() {
  try {
    console.log('Testing PUT /api/user-settings...');
    
    const updateData = {
      babyAgeRange: 'infant',  // Use valid value from the check constraint
      theme: 'dark'
    };
    
    console.log('Request body:', JSON.stringify(updateData));
    
    const response = await fetch('http://localhost:3003/api/user-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body (raw):', responseText);
    
    if (response.ok) {
      console.log('✅ SUCCESS');
    } else {
      console.log('❌ FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUserSettingsPut();
