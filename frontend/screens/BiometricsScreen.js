import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

/**
 * Calculates exact age in years based on today's date minus birthDate.
 */
export const calculateAge = (birthDate) => {
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

const BiometricsScreen = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Personal Info
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState(new Date(2003, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step 2: Body Info
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  // Step 3: Pathway & Strategy
  const [pathway, setPathway] = useState('Diet Deficit Only');

  // Step 4: Activity Level
  const [activityLevel, setActivityLevel] = useState(1.2);

  // Step 5: Health & Fitness Questions
  const [dietaryPreference, setDietaryPreference] = useState('Non-Veg');
  const [workoutFrequency, setWorkoutFrequency] = useState('3-4 days/week');
  const [medicalConditions, setMedicalConditions] = useState('');

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const calculatedAge = calculateAge(dob);

  // Options Data
  const stepsList = [
    { number: 1, label: 'Personal', icon: '👤' },
    { number: 2, label: 'Body', icon: '📏' },
    { number: 3, label: 'Strategy', icon: '🎯' },
    { number: 4, label: 'Activity', icon: '⚡' },
    { number: 5, label: 'Health', icon: '📋' },
  ];

  const pathwaysList = [
    {
      id: 'Diet Deficit Only',
      title: 'Diet Deficit Only',
      icon: '🥗',
      description: 'Focus on caloric restriction to lose fat consistently.',
    },
    {
      id: 'Cardio Focus',
      title: 'Cardio Focus',
      icon: '🏃',
      description: 'Elevate daily energy expenditure through cardio activities.',
    },
    {
      id: 'Gym Training Only',
      title: 'Gym Training Only',
      icon: '🏋️',
      description: 'Build lean muscle mass and strength.',
    },
    {
      id: 'Gym + Diet Balance',
      title: 'Gym + Diet Balance',
      icon: '⚖️',
      description: 'Combine calorie tracking with resistance training for optimal recomp.',
    },
    {
      id: 'Cardio + Gym + Diet (Hybrid)',
      title: 'Cardio + Gym + Diet (Hybrid)',
      icon: '⚡',
      description: 'Complete fitness and metabolic overhaul.',
    },
  ];

  const activityOptions = [
    {
      value: 1.2,
      title: 'Sedentary',
      description: 'Little to no exercise, desk job',
      icon: '🧘',
    },
    {
      value: 1.375,
      title: 'Lightly Active',
      description: 'Light exercise or sports 1-3 days/week',
      icon: '🚶',
    },
    {
      value: 1.55,
      title: 'Moderately Active',
      description: 'Moderate exercise or sports 3-5 days/week',
      icon: '🏃',
    },
    {
      value: 1.725,
      title: 'Very Active',
      description: 'Hard exercise or physical job 6-7 days/week',
      icon: '🏋️',
    },
  ];

  const dietOptions = ['Vegetarian', 'Vegan', 'Non-Veg', 'Eggetarian', 'Jain'];
  const frequencyOptions = ['1-2 days/week', '3-4 days/week', '5-6 days/week', 'Everyday'];

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const formatDateString = (dateObj) => {
    if (!dateObj) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const validateCurrentStep = () => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (!dob || calculatedAge < 10) {
        setErrorMessage('Please select a valid date of birth.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!height || !currentWeight || !targetWeight) {
        setErrorMessage('Please enter height, current weight, and target weight.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        dob: dob.toISOString(),
        age: calculatedAge,
        height: parseFloat(height),
        currentWeight: parseFloat(currentWeight),
        targetWeight: parseFloat(targetWeight),
        gender,
        pathway,
        activityLevel,
        dietaryPreference,
        workoutFrequency,
        medicalConditions,
      };

      let response;
      try {
        response = await api.post('/user/biometrics', payload);
      } catch (err) {
        response = await api.post('/auth/biometrics', payload);
      }

      const { biometrics, user } = response.data;

      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        onNavigate('dashboard', { user, biometrics });
      } else {
        setErrorMessage('Biometrics calculation returned invalid response.');
      }
    } catch (error) {
      console.error('Final Biometrics Submit Error:', error);
      setErrorMessage(
        error.response?.data?.message || error.message || 'Failed to submit biometrics profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step Content Renderer
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Info</Text>
            <Text style={styles.stepSubtitle}>Tell us about your biological sex and age.</Text>

            {/* Biological Sex Selector */}
            <Text style={styles.sectionLabel}>Biological Sex</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                onPress={() => setGender('male')}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                  👨 Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                onPress={() => setGender('female')}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                  👩 Female
                </Text>
              </TouchableOpacity>
            </View>

            {/* Birth Date Picker */}
            <Text style={styles.sectionLabel}>Date of Birth (DD/MM/YYYY)</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.datePickerButtonText}>📅 {formatDateString(dob)}</Text>
            </TouchableOpacity>

            <View style={styles.calculatedAgeBadge}>
              <Text style={styles.calculatedAgeText}>Calculated Age: {calculatedAge} years</Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Body Metrics</Text>
            <Text style={styles.stepSubtitle}>Enter your physical dimensions for BMR calculation.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 175"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1, styles.marginRight]}>
                <Text style={styles.label}>Current Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 70"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Target Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 65"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pathway & Strategy</Text>
            <Text style={styles.stepSubtitle}>Select your primary health and fitness approach.</Text>

            {pathwaysList.map((item) => {
              const isSelected = pathway === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setPathway(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionIcon}>{item.icon}</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                      {item.title}
                    </Text>
                    <Text style={styles.optionDescription}>{item.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Activity Level</Text>
            <Text style={styles.stepSubtitle}>How active are you in your daily life?</Text>

            {activityOptions.map((item) => {
              const isSelected = activityLevel === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setActivityLevel(item.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionIcon}>{item.icon}</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                      {item.title}
                    </Text>
                    <Text style={styles.optionDescription}>{item.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Health & Fitness Questions</Text>
            <Text style={styles.stepSubtitle}>Help us tailor your nutrition & safety recommendations.</Text>

            {/* Dietary Preference Chips */}
            <Text style={styles.sectionLabel}>Dietary Preference</Text>
            <View style={styles.chipRow}>
              {dietOptions.map((item) => {
                const isSelected = dietaryPreference === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setDietaryPreference(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Workout Frequency Chips */}
            <Text style={styles.sectionLabel}>Workout Frequency</Text>
            <View style={styles.chipRow}>
              {frequencyOptions.map((item) => {
                const isSelected = workoutFrequency === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setWorkoutFrequency(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Medical Conditions Notes */}
            <Text style={styles.sectionLabel}>Health & Medical Conditions (Optional)</Text>
            <TextInput
              style={styles.multilineInput}
              placeholder="e.g. Diabetes Type 2, Hypertension, Knee injury..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={medicalConditions}
              onChangeText={setMedicalConditions}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Progress Bar & Step Badges */}
          <View style={styles.wizardHeader}>
            <Text style={styles.wizardProgressText}>Step {currentStep} of 5</Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(currentStep / 5) * 100}%` },
                ]}
              />
            </View>

            {/* Step Icons Badge Row */}
            <View style={styles.stepBadgesRow}>
              {stepsList.map((st) => {
                const isCompleted = currentStep > st.number;
                const isCurrent = currentStep === st.number;
                return (
                  <View key={st.number} style={styles.stepBadgeWrapper}>
                    <View
                      style={[
                        styles.stepBadgeIcon,
                        isCurrent && styles.stepBadgeIconCurrent,
                        isCompleted && styles.stepBadgeIconCompleted,
                      ]}
                    >
                      <Text style={styles.stepIconText}>{st.icon}</Text>
                    </View>
                    <Text
                      style={[
                        styles.stepBadgeLabel,
                        (isCurrent || isCompleted) && styles.stepBadgeLabelActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {renderStepContent()}
          </View>
        </ScrollView>

        {/* Fixed Bottom Navigation Controls */}
        <View style={styles.bottomNavContainer}>
          {currentStep > 1 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === 5 ? 'Calculate & Complete ✨' : 'Next →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  wizardHeader: {
    marginBottom: 20,
  },
  wizardProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  stepBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepBadgeWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 4,
  },
  stepBadgeIconCurrent: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  stepBadgeIconCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  stepIconText: {
    fontSize: 16,
  },
  stepBadgeLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  stepBadgeLabelActive: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 12,
    marginBottom: 10,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  genderButtonActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  genderText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  datePickerButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  datePickerButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  calculatedAgeBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  calculatedAgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginRight: {
    marginRight: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  multilineInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionCardSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: '#10b981',
  },
  optionDescription: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioOuterSelected: {
    borderColor: '#10b981',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#10b981',
    fontWeight: '700',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BiometricsScreen;
