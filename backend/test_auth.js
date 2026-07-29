const { signup, login, saveBiometrics } = require('./controllers/authController');
const User = require('./models/User');

async function testBiometricsLogic() {
  console.log('--- Testing Mifflin-St Jeor Biometrics Calculation Logic ---');

  // Test Male biometrics
  // Weight = 70 kg, Height = 175 cm, Age = 25
  // BMR = 10(70) + 6.25(175) - 5(25) + 5 = 1673.75 -> rounded to 1674
  // TDEE = 1674 * 1.375 = 2301.75 -> rounded to 2302
  // Daily Target = 2302 - 500 = 1802

  const maleInput = {
    currentWeight: 70,
    height: 175,
    age: 25,
    gender: 'male',
    activityLevel: 1.375,
    pathway: 'weight_loss',
  };

  const mockReq = {
    user: { id: 'mock_user_id' },
    body: maleInput,
  };

  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
      return mockRes;
    },
    status: (code) => mockRes,
  };

  // Mock User.findById
  User.findById = async () => ({
    _id: 'mock_user_id',
    email: 'test@example.com',
    save: async function () {
      return this;
    },
    toObject: function () {
      return { ...this };
    },
  });

  await saveBiometrics(mockReq, mockRes);

  console.log('Male Biometrics output:', responseData.biometrics);

  const maleBmrPass = responseData.biometrics.bmr === 1674;
  const maleTdeePass = responseData.biometrics.tdee === 2302;
  const maleTargetPass = responseData.biometrics.dailyCalorieTarget === 1802;

  console.log(`Male BMR (1674): ${maleBmrPass ? 'PASS' : 'FAIL (' + responseData.biometrics.bmr + ')'}`);
  console.log(`Male TDEE (2302): ${maleTdeePass ? 'PASS' : 'FAIL (' + responseData.biometrics.tdee + ')'}`);
  console.log(`Male Target (1802): ${maleTargetPass ? 'PASS' : 'FAIL (' + responseData.biometrics.dailyCalorieTarget + ')'}`);

  // Test Female biometrics
  // Weight = 60 kg, Height = 165 cm, Age = 30, Gender = female, Activity level = 1.55 (moderate), Pathway = weight_gain (+500)
  // BMR = 10(60) + 6.25(165) - 5(30) - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
  // TDEE = 1320 * 1.55 = 2046
  // Target = 2046 + 500 = 2546

  const femaleInput = {
    currentWeight: 60,
    height: 165,
    age: 30,
    gender: 'female',
    activityLevel: 1.55,
    pathway: 'weight_gain',
  };

  mockReq.body = femaleInput;
  await saveBiometrics(mockReq, mockRes);

  console.log('Female Biometrics output:', responseData.biometrics);

  const femaleBmrPass = responseData.biometrics.bmr === 1320;
  const femaleTdeePass = responseData.biometrics.tdee === 2046;
  const femaleTargetPass = responseData.biometrics.dailyCalorieTarget === 2546;

  console.log(`Female BMR (1320): ${femaleBmrPass ? 'PASS' : 'FAIL (' + responseData.biometrics.bmr + ')'}`);
  console.log(`Female TDEE (2046): ${femaleTdeePass ? 'PASS' : 'FAIL (' + responseData.biometrics.tdee + ')'}`);
  console.log(`Female Target (2546): ${femaleTargetPass ? 'PASS' : 'FAIL (' + responseData.biometrics.dailyCalorieTarget + ')'}`);

  if (maleBmrPass && maleTdeePass && maleTargetPass && femaleBmrPass && femaleTdeePass && femaleTargetPass) {
    console.log('✅ ALL BIOMETRICS TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME BIOMETRICS TESTS FAILED!');
    process.exit(1);
  }
}

testBiometricsLogic().catch((err) => {
  console.error(err);
  process.exit(1);
});
