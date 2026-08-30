const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let ageYears = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    ageYears--;
  }
  return Math.max(0, ageYears);
};

console.log('--- Testing calculateAge Helper Function ---');

const today = new Date();

// Test 1: Born exactly 21 years ago today
const dob1 = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
const age1 = calculateAge(dob1);
console.log(`Test 1 (Born 21 yrs ago today): Calculated ${age1} years -> ${age1 === 21 ? 'PASS ✅' : 'FAIL ❌'}`);

// Test 2: Born 25 years ago, birthday tomorrow
const dob2 = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate() + 1);
const age2 = calculateAge(dob2);
console.log(`Test 2 (Born 25 yrs ago, birthday tomorrow): Calculated ${age2} years -> ${age2 === 24 ? 'PASS ✅' : 'FAIL ❌'}`);

// Test 3: Born 30 years ago, birthday yesterday
const dob3 = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate() - 1);
const age3 = calculateAge(dob3);
console.log(`Test 3 (Born 30 yrs ago, birthday yesterday): Calculated ${age3} years -> ${age3 === 30 ? 'PASS ✅' : 'FAIL ❌'}`);

if (age1 === 21 && age2 === 24 && age3 === 30) {
  console.log('\n✅ ALL CALCULATE AGE TESTS PASSED SUCCESSFULLY!');
} else {
  console.error('\n❌ CALCULATE AGE TESTS FAILED!');
  process.exit(1);
}
