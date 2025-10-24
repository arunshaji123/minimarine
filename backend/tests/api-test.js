const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000';
let token = '';
let vesselId = '';
let surveyId = '';
let cargoId = '';
let maintenanceId = '';
let crewId = '';

// Test user credentials
const adminUser = {
  email: 'admin@example.com',
  password: 'password123'
};

// Helper function for API requests
const api = axios.create({
  baseURL: API_URL
});

// Set auth token for requests
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Test functions
async function loginTest() {
  console.log('\n🔑 Testing Login...');
  try {
    const res = await api.post('/api/auth/login', adminUser);
    token = res.data.token;
    setAuthToken(token);
    console.log('✅ Login successful');
    return true;
  } catch (err) {
    console.error('❌ Login failed:', err.response?.data || err.message);
    return false;
  }
}

async function createVesselTest() {
  console.log('\n🚢 Testing Vessel Creation...');
  try {
    const vesselData = {
      name: 'Test Vessel',
      imoNumber: '9876543',
      vesselType: 'Cargo',
      flag: 'Panama',
      yearBuilt: 2015,
      grossTonnage: 50000
    };
    
    const res = await api.post('/api/vessels', vesselData);
    vesselId = res.data._id;
    console.log('✅ Vessel created:', res.data.name);
    return true;
  } catch (err) {
    console.error('❌ Vessel creation failed:', err.response?.data || err.message);
    return false;
  }
}

async function createSurveyTest() {
  console.log('\n📋 Testing Survey Creation...');
  try {
    const surveyData = {
      title: 'Annual Inspection',
      vessel: vesselId,
      surveyType: 'Annual',
      scheduledDate: new Date(),
      location: {
        port: 'Singapore',
        country: 'Singapore'
      },
      status: 'Scheduled'
    };
    
    const res = await api.post('/api/surveys', surveyData);
    surveyId = res.data._id;
    console.log('✅ Survey created:', res.data.title);
    return true;
  } catch (err) {
    console.error('❌ Survey creation failed:', err.response?.data || err.message);
    return false;
  }
}

async function createCargoTest() {
  console.log('\n📦 Testing Cargo Creation...');
  try {
    const cargoData = {
      reference: 'CARGO-001',
      description: 'Test Cargo',
      type: 'Container',
      quantity: 100,
      weight: 5000,
      vessel: vesselId,
      status: 'Scheduled'
    };
    
    const res = await api.post('/api/cargo', cargoData);
    cargoId = res.data._id;
    console.log('✅ Cargo created:', res.data.reference);
    return true;
  } catch (err) {
    console.error('❌ Cargo creation failed:', err.response?.data || err.message);
    return false;
  }
}

async function createMaintenanceTest() {
  console.log('\n🔧 Testing Maintenance Creation...');
  try {
    const maintenanceData = {
      title: 'Engine Overhaul',
      vessel: vesselId,
      maintenanceType: 'Scheduled',
      system: 'Engine',
      description: 'Regular engine maintenance',
      scheduledDate: new Date(),
      status: 'Planned'
    };
    
    const res = await api.post('/api/maintenance', maintenanceData);
    maintenanceId = res.data._id;
    console.log('✅ Maintenance created:', res.data.title);
    return true;
  } catch (err) {
    console.error('❌ Maintenance creation failed:', err.response?.data || err.message);
    return false;
  }
}

async function createCrewTest() {
  console.log('\n👨‍✈️ Testing Crew Creation...');
  try {
    const crewData = {
      name: 'John Smith',
      position: 'Captain',
      vessel: vesselId,
      nationality: 'United Kingdom',
      status: 'Active'
    };
    
    const res = await api.post('/api/crew', crewData);
    crewId = res.data._id;
    console.log('✅ Crew created:', res.data.name);
    return true;
  } catch (err) {
    console.error('❌ Crew creation failed:', err.response?.data || err.message);
    return false;
  }
}

async function getAllDataTest() {
  console.log('\n📊 Testing Get All Data...');
  try {
    const vessels = await api.get('/api/vessels');
    console.log(`✅ Retrieved ${vessels.data.length} vessels`);
    
    const surveys = await api.get('/api/surveys');
    console.log(`✅ Retrieved ${surveys.data.length} surveys`);
    
    const cargo = await api.get('/api/cargo');
    console.log(`✅ Retrieved ${cargo.data.length} cargo shipments`);
    
    const maintenance = await api.get('/api/maintenance');
    console.log(`✅ Retrieved ${maintenance.data.length} maintenance records`);
    
    const crew = await api.get('/api/crew');
    console.log(`✅ Retrieved ${crew.data.length} crew records`);
    
    return true;
  } catch (err) {
    console.error('❌ Get all data failed:', err.response?.data || err.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting API Tests...');
  
  if (!await loginTest()) {
    console.log('❌ Tests aborted due to login failure');
    return;
  }
  
  if (!await createVesselTest()) {
    console.log('❌ Tests aborted due to vessel creation failure');
    return;
  }
  
  await createSurveyTest();
  // Skipping cargo creation test because creating cargo shipments is disabled by configuration
  // await createCargoTest();
  await createMaintenanceTest();
  await createCrewTest();
  await getAllDataTest();
  
  console.log('\n✅ All tests completed (cargo creation skipped)!');
}

// Run the tests
runTests().catch(err => {
  console.error('Test error:', err);
});