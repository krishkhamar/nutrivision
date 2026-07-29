const { googleLogin } = require('./controllers/authController');
const User = require('./models/User');

async function testGoogleLoginLogic() {
  console.log('--- Testing Google Login Controller & User Schema ---');

  // Database mock store
  const mockDb = [];

  // Mock User static findOne
  User.findOne = async ({ email }) => {
    return mockDb.find((u) => u.email === email) || null;
  };

  // Mock User save method
  User.prototype.save = async function () {
    const existingIndex = mockDb.findIndex((u) => u.email === this.email);
    if (existingIndex >= 0) {
      mockDb[existingIndex] = this;
    } else {
      mockDb.push(this);
    }
    return this;
  };

  // Test 1: New Google User Registration
  console.log('\n[Test 1] New Google User Registration...');
  let mockRes1 = {};
  const res1 = {
    status: (code) => {
      mockRes1.statusCode = code;
      return res1;
    },
    json: (data) => {
      mockRes1.body = data;
      return res1;
    },
  };

  await googleLogin(
    {
      body: {
        email: 'alex.google@example.com',
        googleId: 'google_oauth_12345',
        name: 'Alex Rivera',
      },
    },
    res1
  );

  console.log('Status Code:', mockRes1.statusCode);
  console.log('Response Body:', mockRes1.body);

  const u1 = mockRes1.body.user;
  const test1Pass =
    mockRes1.statusCode === 201 &&
    mockRes1.body.isNewUser === true &&
    u1.email === 'alex.google@example.com' &&
    u1.isGoogleAccount === true &&
    u1.googleId === 'google_oauth_12345' &&
    !!mockRes1.body.token;

  console.log(`Test 1 Result: ${test1Pass ? 'PASS ✅' : 'FAIL ❌'}`);

  // Test 2: Existing Google User WITH Biometrics configured
  console.log('\n[Test 2] Existing Google User Login with Biometrics...');

  // Set biometrics on user in DB
  const dbUser = mockDb.find((u) => u.email === 'alex.google@example.com');
  if (dbUser) {
    dbUser.dailyCalorieTarget = 2000;
    dbUser.age = 25;
  }

  let mockRes2 = {};
  const res2 = {
    status: (code) => {
      mockRes2.statusCode = code;
      return res2;
    },
    json: (data) => {
      mockRes2.body = data;
      return res2;
    },
  };

  await googleLogin(
    {
      body: {
        email: 'alex.google@example.com',
        googleId: 'google_oauth_12345',
        name: 'Alex Rivera',
      },
    },
    res2
  );

  console.log('Status Code:', mockRes2.statusCode);
  console.log('Response Body:', mockRes2.body);

  const u2 = mockRes2.body.user;
  const test2Pass =
    mockRes2.statusCode === 200 &&
    mockRes2.body.isNewUser === false &&
    u2.email === 'alex.google@example.com' &&
    !!mockRes2.body.token;

  console.log(`Test 2 Result: ${test2Pass ? 'PASS ✅' : 'FAIL ❌'}`);

  if (test1Pass && test2Pass) {
    console.log('\n✅ ALL GOOGLE LOGIN TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME GOOGLE LOGIN TESTS FAILED!');
    process.exit(1);
  }
}

testGoogleLoginLogic().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
