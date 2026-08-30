import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InfoScreen({ title, message, onNavigate }) {
  return <View style={styles.page}><Text style={styles.title}>{title}</Text><View style={styles.card}><Text style={styles.message}>{message}</Text><Text style={styles.note}>This section is intentionally limited to actionable MVP content while your health data is logged in Nutrition and Dashboard.</Text></View><TouchableOpacity style={styles.button} onPress={() => onNavigate('dashboard')}><Text style={styles.buttonText}>Back to dashboard</Text></TouchableOpacity></View>;
}
const styles = StyleSheet.create({page:{flex:1,backgroundColor:'#0f172a',padding:24,justifyContent:'center'},title:{color:'#fff',fontSize:30,fontWeight:'800',marginBottom:20},card:{backgroundColor:'#1e293b',borderRadius:18,padding:20},message:{color:'#fff',fontSize:17,fontWeight:'700'},note:{color:'#94a3b8',lineHeight:21,marginTop:12},button:{backgroundColor:'#10b981',borderRadius:14,padding:16,alignItems:'center',marginTop:20},buttonText:{color:'#fff',fontWeight:'800'}});
