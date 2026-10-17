import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme/colors';

export function Label({ children }) { return <Text style={{ color: C.muted, fontSize: 12, marginBottom: 7, marginTop: 12, fontWeight: '600' }}>{children}</Text>; }
export function Field({ icon, style, ...props }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: '#06132A', paddingHorizontal: 13, minHeight: 48 }, style]}>
    {icon ? <Ionicons name={icon} size={18} color={C.muted} style={{ marginRight: 9 }} /> : null}
    <TextInput placeholderTextColor="#7186A6" style={{ color: C.text, flex: 1, paddingVertical: 12, fontSize: 14 }} {...props} />
  </View>;
}
export function Button({ title, onPress, secondary, loading, style }) {
  return <TouchableOpacity activeOpacity={0.82} onPress={onPress} disabled={loading} style={[{ minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 14, backgroundColor: secondary ? C.panel2 : C.blue, borderWidth: secondary ? 1 : 0, borderColor: C.line, flexDirection: 'row' }, style]}>
    {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>}
  </TouchableOpacity>;
}
export function Card({ children, style }) { return <View style={[{ backgroundColor: C.panel, borderWidth: 1, borderColor: '#10315F', borderRadius: 17, padding: 15, marginBottom: 12 }, style]}>{children}</View>; }
export function Heading({ title, subtitle, right }) { return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><View style={{ flex: 1 }}><Text style={{ color: C.text, fontSize: 23, fontWeight: '800' }}>{title}</Text>{subtitle ? <Text style={{ color: C.muted, marginTop: 5, fontSize: 12 }}>{subtitle}</Text> : null}</View>{right}</View>; }
export function Pill({ label, color = C.cyan }) { return <View style={{ alignSelf: 'flex-start', borderRadius: 20, backgroundColor: `${color}20`, borderColor: `${color}70`, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color, fontSize: 10, fontWeight: '800' }}>{label}</Text></View>; }
export function SmallButton({ title, onPress }) { return <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.line }}><Text style={{ color: C.cyan, fontSize: 11, fontWeight: '700' }}>{title}</Text></TouchableOpacity>; }
