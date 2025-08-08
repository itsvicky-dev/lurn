import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3001/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

const adminUser = {
  email: 'admin@mail.com',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'User'
};

const testSuggestion = {
  title: 'Add Dark Mode Toggle',
  description: 'It would be great to have a dark mode toggle in the settings to reduce eye strain during night time coding sessions.',
  category: 'ui/ux',
  tags: ['dark-mode', 'ui', 'accessibility']
};

async function testSuggestionFeature() {
  try {
    console.log('🧪 Testing Suggestion Feature...\n');

    // Test 1: Submit a suggestion (requires authentication)
    console.log('1. Testing suggestion submission...');
    
    // Login with existing test user
    let userToken;
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      userToken = loginResponse.data.token;
      console.log('✅ User logged in successfully');
    } catch (error) {
      console.log('❌ Failed to login user:', error.response?.data?.message || error.message);
      return;
    }

    // Submit suggestion
    try {
      const suggestionResponse = await axios.post(
        `${API_BASE}/suggestions`,
        testSuggestion,
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      console.log('✅ Suggestion submitted successfully');
      console.log('   Suggestion ID:', suggestionResponse.data.suggestion.id);
    } catch (error) {
      console.log('❌ Failed to submit suggestion:', error.response?.data?.message || error.message);
    }

    // Test 2: Get user's suggestions
    console.log('\n2. Testing user suggestions retrieval...');
    try {
      const userSuggestionsResponse = await axios.get(
        `${API_BASE}/suggestions/my-suggestions`,
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      console.log('✅ User suggestions retrieved successfully');
      console.log('   Count:', userSuggestionsResponse.data.suggestions.length);
    } catch (error) {
      console.log('❌ Failed to get user suggestions:', error.response?.data?.message || error.message);
    }

    // Test 3: Get public suggestions
    console.log('\n3. Testing public suggestions retrieval...');
    try {
      const publicSuggestionsResponse = await axios.get(
        `${API_BASE}/suggestions/public`,
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      console.log('✅ Public suggestions retrieved successfully');
      console.log('   Count:', publicSuggestionsResponse.data.suggestions.length);
    } catch (error) {
      console.log('❌ Failed to get public suggestions:', error.response?.data?.message || error.message);
    }

    // Test 4: Admin functionality (requires admin user)
    console.log('\n4. Testing admin functionality...');
    
    let adminToken;
    try {
      const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: adminUser.email,
        password: adminUser.password
      });
      adminToken = adminLoginResponse.data.token;
      console.log('✅ Admin logged in successfully');
    } catch (error) {
      console.log('❌ Failed to login admin:', error.response?.data?.message || error.message);
      console.log('   Skipping admin tests...');
      return;
    }

    // Test admin get all suggestions
    try {
      const adminSuggestionsResponse = await axios.get(
        `${API_BASE}/suggestions/admin/all`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('✅ Admin suggestions retrieved successfully');
      console.log('   Total suggestions:', adminSuggestionsResponse.data.pagination.total);
      console.log('   Stats:', adminSuggestionsResponse.data.stats);
    } catch (error) {
      console.log('❌ Failed to get admin suggestions:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Suggestion feature testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSuggestionFeature();