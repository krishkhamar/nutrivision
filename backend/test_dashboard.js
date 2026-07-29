const { getTodayDashboard, logWater, updateMood } = require('./controllers/dashboardController');
const User = require('./models/User');
const DailyLog = require('./models/DailyLog');

async function testDashboardEndpoints() {
  console.log('--- Testing Dashboard Controller Endpoints ---');

  const mockDb = {
    users: [
      {
        _id: 'mock_user_id',
        name: 'Jordan Bell',
        email: 'jordan@example.com',
        dailyCalorieTarget: 2100,
      },
    ],
    dailyLogs: [],
  };

  User.findById = async (id) => {
    return mockDb.users.find((u) => u._id === id) || null;
  };

  DailyLog.findOne = async ({ userId, date }) => {
    return mockDb.dailyLogs.find((dl) => dl.userId === userId && dl.date === date) || null;
  };

  DailyLog.prototype.save = async function () {
    const existingIndex = mockDb.dailyLogs.findIndex(
      (dl) => dl.userId === this.userId && dl.date === this.date
    );
    if (existingIndex >= 0) {
      mockDb.dailyLogs[existingIndex] = this;
    } else {
      mockDb.dailyLogs.push(this);
    }
    return this;
  };

  const mockReq = {
    user: { id: 'mock_user_id' },
    body: {},
  };

  // Test 1: GET /today dashboard
  console.log('\n[Test 1] GET /today dashboard...');
  let res1Data = null;
  const mockRes1 = {
    json: (data) => {
      res1Data = data;
      return mockRes1;
    },
    status: () => mockRes1,
  };

  await getTodayDashboard(mockReq, mockRes1);
  console.log('GET Today Output:', JSON.stringify(res1Data, null, 2));

  const test1Pass =
    res1Data.user.name === 'Jordan Bell' &&
    res1Data.user.dailyCalorieTarget === 2100 &&
    res1Data.dailyLog.waterIntake === 0 &&
    res1Data.dailyLog.mood === '😊';
  console.log(`Test 1 Result: ${test1Pass ? 'PASS ✅' : 'FAIL ❌'}`);

  // Test 2: POST /water (+0.25 L)
  console.log('\n[Test 2] POST /water (+0.25 L)...');
  let res2Data = null;
  const mockRes2 = {
    json: (data) => {
      res2Data = data;
      return mockRes2;
    },
    status: () => mockRes2,
  };

  mockReq.body = { amount: 0.25 };
  await logWater(mockReq, mockRes2);
  console.log('POST Water (+0.25L) Output:', JSON.stringify(res2Data, null, 2));

  // Test 2b: POST /water (-0.5 L, clamping at 0)
  console.log('\n[Test 2b] POST /water (-0.5 L)...');
  let res2bData = null;
  const mockRes2b = {
    json: (data) => {
      res2bData = data;
      return mockRes2b;
    },
    status: () => mockRes2b,
  };

  mockReq.body = { amount: -0.5 };
  await logWater(mockReq, mockRes2b);
  console.log('POST Water (-0.5L) Output:', JSON.stringify(res2bData, null, 2));

  const test2Pass = res2Data.waterIntake === 0.25 && res2bData.waterIntake === 0;
  console.log(`Test 2 Result: ${test2Pass ? 'PASS ✅' : 'FAIL ❌'}`);

  // Test 3: POST /mood ('🤩')
  console.log('\n[Test 3] POST /mood ("🤩")...');
  let res3Data = null;
  const mockRes3 = {
    json: (data) => {
      res3Data = data;
      return mockRes3;
    },
    status: () => mockRes3,
  };

  mockReq.body = { mood: '🤩' };
  await updateMood(mockReq, mockRes3);
  console.log('POST Mood Output:', JSON.stringify(res3Data, null, 2));

  const test3Pass = res3Data.mood === '🤩';
  console.log(`Test 3 Result: ${test3Pass ? 'PASS ✅' : 'FAIL ❌'}`);

  if (test1Pass && test2Pass && test3Pass) {
    console.log('\n✅ ALL DASHBOARD ENDPOINT TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME DASHBOARD TESTS FAILED!');
    process.exit(1);
  }
}

testDashboardEndpoints().catch((err) => {
  console.error(err);
  process.exit(1);
});
