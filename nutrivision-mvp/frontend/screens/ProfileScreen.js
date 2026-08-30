import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const display = (value, suffix = '') => value === undefined || value === null || value === '' ? 'Not set' : `${value}${suffix}`;

export default function ProfileScreen({ onNavigate, screenData }) {
  const user = screenData?.user || {};
  const details = [
    ['Email', user.email],
    ['Age', user.age, ' years'],
    ['Gender', user.gender],
    ['Height', user.height, ' cm'],
    ['Current weight', user.currentWeight, ' kg'],
    ['Target weight', user.targetWeight, ' kg'],
    ['Activity level', user.activityLevel],
    ['Diet preference', user.dietaryPreference],
    ['BMI', user.bmi],
  ];
  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.header}><Text style={styles.title}>Profile</Text><TouchableOpacity onPress={() => onNavigate('dashboard')}><Text style={styles.link}>Dashboard</Text></TouchableOpacity></View>
    <View style={styles.hero}><Text style={styles.name}>{user.name || user.email?.split('@')[0] || 'NutriVision user'}</Text><Text style={styles.sub}>Your saved health settings</Text></View>
    <View style={styles.card}>{details.map(([label, value, suffix]) => <View style={styles.row} key={label}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{display(value, suffix)}</Text></View>)}</View>
    <View style={styles.card}><Text style={styles.label}>Daily calorie target</Text><Text style={styles.target}>{display(user.dailyCalorieTarget, ' kcal')}</Text><Text style={styles.sub}>BMR: {display(user.bmr, ' kcal')} · TDEE: {display(user.tdee, ' kcal')}</Text></View>
    <TouchableOpacity style={styles.button} onPress={() => onNavigate('biometrics', { editMode: true })}><Text style={styles.buttonText}>Edit biometrics</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate('goal-plan')}><Text style={styles.secondaryButtonText}>Choose goal plan</Text></TouchableOpacity>
  </ScrollView>;
}
const styles = StyleSheet.create({page:{flexGrow:1,backgroundColor:'#0f172a',padding:20},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},title:{color:'#fff',fontSize:28,fontWeight:'800'},link:{color:'#38bdf8'},hero:{marginVertical:22},name:{color:'#fff',fontSize:22,fontWeight:'800'},sub:{color:'#94a3b8',marginTop:5},card:{backgroundColor:'#1e293b',borderRadius:16,padding:16,marginBottom:14},row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#334155'},label:{color:'#94a3b8'},value:{color:'#fff',fontWeight:'700',maxWidth:'58%',textAlign:'right'},target:{color:'#10b981',fontSize:26,fontWeight:'800',marginTop:6},button:{backgroundColor:'#10b981',borderRadius:14,padding:16,alignItems:'center',marginTop:6},buttonText:{color:'#fff',fontWeight:'800'},secondaryButton:{borderColor:'#38bdf8',borderWidth:1,borderRadius:14,padding:15,alignItems:'center',marginTop:10},secondaryButtonText:{color:'#38bdf8',fontWeight:'800'}});
