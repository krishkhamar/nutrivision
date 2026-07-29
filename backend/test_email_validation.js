const { signup, login } = require('./controllers/authController');
const User = require('./models/User');

async function testEmailValidation() {
  console.log('--- Testing Strict Email Format Validation ---');

  // Test invalid emails
  const invalidEmails = [
    'invalid-email',
    'test@',
    'a@b.c', // top-level domain < 2 chars
    '@example.com',
    'name@domain',
  ];

  for (const badEmail of invalidEmails) {
    let mockRes = {};
    const res = {
      status: (code) => {
        mockRes.statusCode = code;
        return res;
      },
      json: (data) => {
        mockRes.body = data;
        return res;
      },
    };

    await signup({ body: { email: badEmail, password: 'password123' } }, res);

    const isRejected = mockRes.statusCode === 400 && mockRes.body.message.includes('valid email');
    console.log(`Rejection test for "${badEmail}": ${isRejected ? 'PASS ✅' : 'FAIL ❌ (' + mockRes.statusCode + ')'}`);
    if (!isRejected) {
      process.exit(1);
    }
  }

  console.log('\n✅ ALL EMAIL VALIDATION TESTS PASSED SUCCESSFULLY!');
}

testEmailValidation().catch((err) => {
  console.error(err);
  process.exit(1);
});
