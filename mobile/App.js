import React, { useEffect, useState } from 'react';
import { 
  SafeAreaView, View, Text, ScrollView, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Platform, RefreshControl, 
  Image, ImageBackground, StyleSheet, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { api } from './src/api/client';
import { C } from './src/theme/colors';
import { Button, Card, Field, Heading, Label, Pill, SmallButton } from './src/components/UI';

// Assets Imports from your project structure
import mewarUniversityLogo from './assets/mewar-university.png';
import nexoraLogo from './assets/nexora-logo.png';
import campusBuildingImg from './assets/campus-building.jpg';
import campusSatelliteMapImg from './assets/campus-satellite-map.png';
import oneAiLogo from './assets/one-ai-logo.webp';

const { width, height } = Dimensions.get('window');

const TABS = [
  { key: 'Home', icon: 'home-outline' },
  { key: 'Complaints', icon: 'clipboard-outline' },
  { key: 'Mess', icon: 'restaurant-outline' },
  { key: 'Map', icon: 'map-outline' },
  { key: 'Profile', icon: 'person-outline' }
];

const categories = ['Electrical', 'Water Leakage', 'Wi-Fi', 'Cleanliness', 'Broken Furniture', 'Mess', 'Other'];
const priorities = ['Low', 'Medium', 'High'];

// Exact Mess Menu matching Mewar University Chart
const CAMPUS_WEEKLY_MENU = [
  { day: 'MONDAY', breakfast: 'Chole Bhature + Tea + Aachar', lunch: 'Lauki Kofte + Chana Dal, Rice, Chapati, Buttermilk + Mix Salad + Chutney', snacks: 'Maggi + Tea', dinner: 'Aloo Bhujhiya, Masoor Dal, Rice and Chapati' },
  { day: 'TUESDAY', breakfast: 'Poha + Tea', lunch: 'Cabbage & Aloo (Dry) + Mix Dal, Jeera Rice, Chapati + Tomato Chutney', snacks: 'Aloo Bada + Tea', dinner: 'Mix Veg + Chana Dal, Rice and Chapati' },
  { day: 'WEDNESDAY', breakfast: 'Plain Parantha + Aloo Sabji + Tea', lunch: 'Chana Dal, Aloo Mater (Dry), Onion Salad (Mix), Rice, Chapati, Buttermilk + Red Chilly Garlic Chutney', snacks: 'Noodles + Tea', dinner: 'Lauki Chana (Dry), Rajma, Rice and Chapati' },
  { day: 'THURSDAY', breakfast: 'Chana Halwa + Tea', lunch: 'Chapati, Veg Biryani, Onion Salad Mix + Raita', snacks: 'Biscuit + Tea', dinner: 'Chole + Hari Mirch Fry + Roti + Rice' },
  { day: 'FRIDAY', breakfast: 'Pav Bhaji + Tea', lunch: 'Rajma, Cauliflower Rice, Chapati and Buttermilk', snacks: 'Aloo Bhujhiya + Tea', dinner: 'Chana Dal, Sev Tamatar, Rice and Chapati' },
  { day: 'SATURDAY', breakfast: 'Puri + Aloo Tomato + Tea', lunch: 'Palak + Aloo (Dry), Rice, Chapati + Salad Mix', snacks: 'Pasta + Tea', dinner: 'Soyabeen, Rajma, Rice and Chapati' },
  { day: 'SUNDAY', breakfast: 'Aloo Paratha + Curd + Tea Aachar', lunch: 'Chana & Aloo Kadi + Pakoda + Rice, Chapati, Pickle + Buttermilk', snacks: 'Biscuit + Tea + Coffee', dinner: 'Mater Paneer, Dal, Zeera Rice, Chapati; Kheer/Balushahi/Gulab Jamun' }
];

// Helper wrapper to enforce Android/Mobile aspect ratio on Web browsers
function MobileFrameWrapper({ children }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.mobileFrame}>
          {children}
        </View>
      </View>
    );
  }
  return <View style={{ flex: 1 }}>{children}</View>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState('Home');
  const [authMode, setAuthMode] = useState('login');
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', rollNumber: '', department: '' });
  const [busy, setBusy] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [menu, setMenu] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [report, setReport] = useState({ category: 'Electrical', location: '', description: '', priority: 'Medium' });
  
  // 4 Meals Suggestion State
  const [dish, setDish] = useState({ 
    preferredDay: 'Monday', 
    breakfast: '', 
    lunch: '', 
    snacks: '', 
    dinner: '', 
    notes: '' 
  });
  
  const [chatInput, setChatInput] = useState('');
  const [chat, setChat] = useState([{ from: 'ai', text: 'Hello! I’m One AI 🤖 Your Smart Campus Assistant. Ask me about complaints, mess menu or campus locations.' }]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('nexora-session');
        if (raw) {
          const s = JSON.parse(raw);
          await api('/auth/me', { token: s.token });
          setSession(s);
        }
      } catch {
        await AsyncStorage.removeItem('nexora-session');
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => { if (session) loadData(); }, [session, screen]);

  const setF = (key, value) => setForm(old => ({ ...old, [key]: value }));

  async function loadData() {
    if (!session) return;
    try {
      const [c, m, l, f] = await Promise.all([
        api('/complaints', { token: session.token }),
        api('/food/menu', { token: session.token }),
        api('/campus/locations', { token: session.token }),
        api('/food/suggestions', { token: session.token })
      ]);
      setComplaints(c.complaints || []);
      setMenu(m.menu || []);
      setLocations(l.locations || []);
      setSuggestions(f.suggestions || []);
      if (session.user.role === 'admin') setSummary(await api('/complaints/summary', { token: session.token }));
    } catch (e) {
      if (!String(e.message).includes('Cannot connect')) Alert.alert('Could not refresh', e.message);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function authenticate() {
    if (!form.email.trim() || !form.password) return Alert.alert('Missing details', 'Enter your email and password.');
    setBusy(true);
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body = authMode === 'login' ? { email: form.email, password: form.password } : form;
      const result = await api(path, { method: 'POST', body });
      const next = { token: result.token, user: result.user };
      await AsyncStorage.setItem('nexora-session', JSON.stringify(next));
      setSession(next);
      setScreen('Home');
    } catch (e) {
      Alert.alert('Authentication failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (!report.location.trim() || !report.description.trim()) return Alert.alert('Complete the form', 'Enter location and description.');
    setBusy(true);
    try {
      const out = await api('/complaints', { token: session.token, method: 'POST', body: report });
      Alert.alert('Complaint submitted', `Complaint ID: ${out.complaint.complaintId}`);
      setReport({ category: 'Electrical', location: '', description: '', priority: 'Medium' });
      setScreen('Complaints');
      await loadData();
    } catch (e) {
      Alert.alert('Could not submit', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitFood() {
    if (!dish.breakfast.trim() && !dish.lunch.trim() && !dish.snacks.trim() && !dish.dinner.trim()) {
      return Alert.alert('Food Suggestion Required', 'Please suggest at least one meal item.');
    }
    setBusy(true);
    try {
      const formattedDishName = `Breakfast: ${dish.breakfast || 'N/A'} | Lunch: ${dish.lunch || 'N/A'} | Snacks: ${dish.snacks || 'N/A'} | Dinner: ${dish.dinner || 'N/A'}`;
      await api('/food/suggestions', { 
        token: session.token, 
        method: 'POST', 
        body: { dishName: formattedDishName, preferredDay: dish.preferredDay, notes: dish.notes } 
      });
      Alert.alert('Suggestion sent', 'Your 4-meal suggestions have been submitted successfully.');
      setDish({ preferredDay: 'Monday', breakfast: '', lunch: '', snacks: '', dinner: '', notes: '' });
      await loadData();
    } catch (e) {
      Alert.alert('Could not submit', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendChat() {
    const message = chatInput.trim();
    if (!message) return;
    setChat(old => [...old, { from: 'me', text: message }]);
    setChatInput('');
    try {
      const r = await api('/assistant/chat', { token: session.token, method: 'POST', body: { message } });
      setChat(old => [...old, { from: 'ai', text: r.reply }]);
    } catch (e) {
      setChat(old => [...old, { from: 'ai', text: e.message }]);
    }
  }

  async function updateComplaint(item, status) {
    try {
      await api(`/complaints/${item._id}/status`, { token: session.token, method: 'PATCH', body: { status } });
      Alert.alert('Status Updated', `Complaint is now marked as ${status}`);
      await loadData();
    } catch (e) {
      Alert.alert('Update failed', e.message);
    }
  }

  async function logout() {
    await AsyncStorage.removeItem('nexora-session');
    setSession(null);
    setScreen('Home');
    setShowAuth(false);
  }

  if (booting) {
    return (
      <MobileFrameWrapper>
        <SafeAreaView style={styles.center}>
          <Image source={nexoraLogo} resizeMode="contain" style={{ width: 150, height: 50 }} />
          <Text style={styles.muted}>Starting Campus One AI…</Text>
        </SafeAreaView>
      </MobileFrameWrapper>
    );
  }

  if (!session && !showAuth) {
    return (
      <MobileFrameWrapper>
        <WelcomeScreen onStart={() => setShowAuth(true)} />
      </MobileFrameWrapper>
    );
  }
  
  if (!session) {
    return (
      <MobileFrameWrapper>
        <AuthScreen form={form} setF={setF} authMode={authMode} setAuthMode={setAuthMode} busy={busy} authenticate={authenticate} />
      </MobileFrameWrapper>
    );
  }

  const content = () => {
    if (screen === 'Home') return <HomeScreen session={session} complaints={complaints} summary={summary} setScreen={setScreen} setChat={setChat} />;
    if (screen === 'Complaints') return <ComplaintsScreen session={session} complaints={complaints} setScreen={setScreen} updateComplaint={updateComplaint} />;
    if (screen === 'Report') return <ReportScreen report={report} setReport={setReport} submitReport={submitReport} busy={busy} />;
    if (screen === 'Mess') return <MessScreen dish={dish} setDish={setDish} submitFood={submitFood} busy={busy} />;
    if (screen === 'Map') return <MapScreen query={query} setQuery={setQuery} />;
    if (screen === 'AI') return <ChatScreen chat={chat} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} />;
    if (screen === 'Profile') return <ProfileScreen session={session} logout={logout} />;
    return <HomeScreen session={session} complaints={complaints} summary={summary} setScreen={setScreen} />;
  };

  const activeTab = TABS.some(t => t.key === screen) ? screen : (screen === 'Report' ? 'Complaints' : 'Home');

  return (
    <MobileFrameWrapper>
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style="light" />
        <View style={styles.topbar}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={mewarUniversityLogo} resizeMode="contain" style={styles.headerUniversityLogo} />
            <View>
              <Image source={nexoraLogo} resizeMode="contain" style={{ width: 85, height: 20 }} />
              <Text style={styles.brandSub}>CAMPUS ONE AI</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setScreen('Profile')} style={styles.avatar}>
            <Ionicons name="person" color={C.cyan} size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          key={screen} 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.page} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.cyan} />} 
          keyboardShouldPersistTaps="handled"
        >
          {content()}
        </ScrollView>

        <View style={styles.tabbar}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setScreen(t.key)} style={styles.tab}>
              <Ionicons name={t.icon} size={20} color={activeTab === t.key ? C.cyan : C.muted} />
              <Text style={{ color: activeTab === t.key ? C.cyan : C.muted, fontSize: 9, marginTop: 3, fontWeight: activeTab === t.key ? '800' : '500' }}>
                {t.key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {screen === 'Home' && (
          <TouchableOpacity onPress={() => setScreen('AI')} style={styles.fab}>
            <Image source={oneAiLogo} style={{ width: 32, height: 32, borderRadius: 16 }} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </MobileFrameWrapper>
  );
}


function WelcomeScreen({ onStart }) {
  return (
    <View style={styles.welcomeContainer}>
      <ImageBackground 
        source={campusBuildingImg} 
        resizeMode="cover" 
        style={styles.welcomeBgImage}
      >
        <View style={styles.welcomeOverlay}>
          
          <View style={styles.welcomeTopSection}>
            <Image source={mewarUniversityLogo} resizeMode="contain" style={styles.welcomeUniLogo} />
            <Image source={nexoraLogo} resizeMode="contain" style={styles.welcomeNexoraImageLogo} />
            <Text style={styles.welcomeSubText}>Smart Campus • Better Tomorrow</Text>
          </View>

          <View style={styles.welcomeBottomSection}>
            <Text style={styles.welcomeTaglineMain}>
              One Campus: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>One Platform.</Text>
            </Text>
            <Text style={styles.welcomeTaglineSub}>Smarter Decisions.</Text>

            <TouchableOpacity onPress={onStart} activeOpacity={0.85} style={styles.welcomeGetStartedBtn}>
              <Text style={styles.welcomeBtnText}>Get Started  →</Text>
            </TouchableOpacity>

            <View style={styles.welcomeFooterBox}>
              <Text style={styles.welcomePoweredBy}>Powered by</Text>
              <Image source={nexoraLogo} resizeMode="contain" style={styles.welcomeFooterLogoImage} />
            </View>
          </View>

        </View>
      </ImageBackground>
    </View>
  );
}


function AuthScreen({ form, setF, authMode, setAuthMode, busy, authenticate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
          <Image source={mewarUniversityLogo} resizeMode="contain" style={styles.authUniversityLogo} />
          <Image source={nexoraLogo} resizeMode="contain" style={styles.authNexoraLogo} />
          <Text style={styles.tagline}>SMART CAMPUS • BETTER TOMORROW</Text>

          <Card style={styles.authCard}>
            <Text style={styles.h2}>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.muted}>{authMode === 'login' ? 'Sign in to your account' : 'Join your smart campus'}</Text>

            <View style={styles.chips}>
              {(authMode === 'login' ? ['student', 'faculty', 'admin'] : ['student', 'faculty']).map(r => (
                <TouchableOpacity 
                  key={r} 
                  onPress={() => setF('role', r)} 
                  style={[styles.chip, form.role === r && styles.chipActive]}
                >
                  <Text style={[styles.chipText, form.role === r && { color: '#000' }]}>
                    {r === 'student' ? 'Student' : r === 'faculty' ? 'Faculty' : 'Admin'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {authMode === 'register' && (
              <>
                <Label>Full Name</Label>
                <Field icon="person-outline" placeholder="Your full name" value={form.name} onChangeText={v => setF('name', v)} />
                <Label>Roll Number (optional)</Label>
                <Field placeholder="Roll number" value={form.rollNumber} onChangeText={v => setF('rollNumber', v)} />
              </>
            )}

            <Label>Email / Roll Number</Label>
            <Field icon="mail-outline" autoCapitalize="none" placeholder="Enter your email or roll number" value={form.email} onChangeText={v => setF('email', v)} />

            <Label>Password</Label>
            <Field icon="lock-closed-outline" placeholder="Enter your password" secureTextEntry value={form.password} onChangeText={v => setF('password', v)} />

            <Button title={authMode === 'login' ? 'Login' : 'Create account  →'} onPress={authenticate} loading={busy} />

            <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ padding: 10, alignItems: 'center' }}>
              <Text style={styles.muted}>
                {authMode === 'login' ? "Don't have an account? " : 'Already registered? '}
                <Text style={{ color: C.cyan, fontWeight: '800' }}>{authMode === 'login' ? 'Register' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.poweredLabel}>POWERED BY</Text>
          <Image source={nexoraLogo} resizeMode="contain" style={styles.poweredLogo} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


function HomeScreen({ session, complaints, summary, setScreen }) {
  const counts = session.user.role === 'admin' && summary ? summary : { 
    total: complaints.length, 
    pending: complaints.filter(c => c.status === 'Pending').length, 
    resolved: complaints.filter(c => c.status === 'Resolved').length, 
    inProgress: complaints.filter(c => c.status === 'In Progress').length 
  };
  
  const shortcuts = [
    { label: 'Report Issue', icon: 'warning-outline', color: C.blue, action: 'Report' },
    { label: 'Food Suggestion', icon: 'restaurant-outline', color: C.purple, action: 'Mess' },
    { label: 'Campus Map', icon: 'map-outline', color: C.green, action: 'Map' },
    { label: 'Mess Menu', icon: 'nutrition-outline', color: C.cyan, action: 'Mess' }
  ];

  return (
    <>
      <Text style={styles.greeting}>Hello, {session.user.name.split(' ')[0]} 👋</Text>
      <Text style={styles.muted}>Welcome to your Smart Campus</Text>
      
      <View style={styles.statsRow}>
        <Card style={styles.totalCard}>
          <Text style={styles.muted}>Total Complaints</Text>
          <Text style={styles.statNumLarge}>{counts.total || 0}</Text>
        </Card>
        <View style={{ flex: 1, gap: 8 }}>
          <Card style={styles.miniCard}>
            <Ionicons name="checkmark-circle" color={C.green} size={18} />
            <Text style={{ color: C.text, fontSize: 12 }}>Resolved: <Text style={{ fontWeight: '800' }}>{counts.resolved || 0}</Text></Text>
          </Card>
          <Card style={styles.miniCard}>
            <Ionicons name="time" color={C.yellow} size={18} />
            <Text style={{ color: C.text, fontSize: 12 }}>Pending: <Text style={{ fontWeight: '800' }}>{counts.pending || 0}</Text></Text>
          </Card>
        </View>
      </View>

      <View style={styles.actionGrid}>
        {shortcuts.map(s => (
          <TouchableOpacity key={s.label} onPress={() => setScreen(s.action)} style={styles.action}>
            <View style={[styles.actionIcon, { backgroundColor: `${s.color}24` }]}>
              <Ionicons name={s.icon} color={s.color} size={22} />
            </View>
            <Text style={styles.actionText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => setScreen('AI')} activeOpacity={0.85}>
        <Card style={{ borderColor: '#2165B9', backgroundColor: '#071D40', flexDirection: 'row', alignItems: 'center' }}>
          <Image source={oneAiLogo} style={{ width: 44, height: 44, borderRadius: 22 }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>One AI</Text>
            <Text style={styles.muted}>Your Smart Campus Assistant</Text>
          </View>
          <Pill label="Chat Now →" color={C.cyan} />
        </Card>
      </TouchableOpacity>

      <Heading title="Today's Mess Menu" subtitle="Mewar University" right={<SmallButton title="View All" onPress={() => setScreen('Mess')} />} />
      <Card>
        <Text style={{ color: C.cyan, fontWeight: '800', marginBottom: 4 }}>Lunch (Today)</Text>
        <Text style={styles.bodyText}>• Lauki Kofte + Chana Dal + Rice + Chapati + Buttermilk + Salad</Text>
      </Card>
    </>
  );
}


function ComplaintCard({ item, session, updateComplaint }) {
  const statusColor = item.status === 'Resolved' ? C.green : item.status === 'In Progress' ? C.cyan : C.yellow;
  const isAdmin = session && session.user && session.user.role === 'admin';

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.cardTitle}>{item.category}</Text>
          <Text style={styles.muted}>{item.location} • {item.complaintId}</Text>
        </View>
        <Pill label={item.priority} color={item.priority === 'High' ? C.red : item.priority === 'Medium' ? C.yellow : C.green} />
      </View>
      <Text style={styles.bodyText}>{item.description}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <Pill label={`Status: ${item.status}`} color={statusColor} />
      </View>

      {/* Admin Action Buttons */}
      {isAdmin && (
        <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#0E2952' }}>
          <Text style={{ color: '#8EA3C7', fontSize: 10, marginBottom: 6, fontWeight: '700' }}>ADMIN ACTIONS - CHANGE STATUS:</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity 
              onPress={() => updateComplaint(item, 'Pending')} 
              style={[styles.statusBtn, item.status === 'Pending' && styles.statusBtnActive]}
            >
              <Text style={styles.statusBtnText}>Pending</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => updateComplaint(item, 'In Progress')} 
              style={[styles.statusBtn, item.status === 'In Progress' && styles.statusBtnActive]}
            >
              <Text style={styles.statusBtnText}>In Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => updateComplaint(item, 'Resolved')} 
              style={[styles.statusBtn, item.status === 'Resolved' && styles.statusBtnActive]}
            >
              <Text style={styles.statusBtnText}>Resolved</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
}

function ComplaintsScreen({ session, complaints, setScreen, updateComplaint }) {
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredComplaints = complaints.filter(c => {
    if (filterStatus === 'All') return true;
    return c.status === filterStatus;
  });

  return (
    <>
      <Heading title="Track Complaints" subtitle={`${complaints.length} total complaint(s)`} right={<SmallButton title="+ Report" onPress={() => setScreen('Report')} />} />
      
      {/* Tracking Filter Tabs */}
      <View style={styles.chips}>
        {['All', 'Pending', 'In Progress', 'Resolved'].map(status => (
          <TouchableOpacity 
            key={status} 
            onPress={() => setFilterStatus(status)} 
            style={[styles.chip, filterStatus === status && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterStatus === status && { color: '#000' }]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredComplaints.length === 0 ? (
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <Text style={styles.muted}>No complaints found for "{filterStatus}"</Text>
        </Card>
      ) : (
        filteredComplaints.map(c => <ComplaintCard key={c._id} item={c} session={session} updateComplaint={updateComplaint} />)
      )}
    </>
  );
}

function ReportScreen({ report, setReport, submitReport, busy }) {
  return (
    <>
      <Heading title="Report Issue" subtitle="Help us make campus better" />
      <Card>
        <Label>Issue Category</Label>
        <View style={styles.chipsWrap}>
          {categories.map(c => (
            <TouchableOpacity key={c} onPress={() => setReport(o => ({ ...o, category: c }))} style={[styles.chip, report.category === c && styles.chipActive]}>
              <Text style={styles.chipText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Label>Campus Location</Label>
        <Field icon="location-outline" placeholder="e.g. Academic Block, Room 204" value={report.location} onChangeText={v => setReport(o => ({ ...o, location: v }))} />
        <Label>Description</Label>
        <Field multiline numberOfLines={4} placeholder="Describe the issue in detail..." value={report.description} onChangeText={v => setReport(o => ({ ...o, description: v }))} />
        <Button title="Submit Report" onPress={submitReport} loading={busy} />
      </Card>
    </>
  );
}


function MessScreen({ dish, setDish, submitFood, busy }) {
  const [subTab, setSubTab] = useState('menu');
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  const selected = CAMPUS_WEEKLY_MENU.find(d => d.day === selectedDay) || CAMPUS_WEEKLY_MENU[0];

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Any day'];

  return (
    <>
      <Heading title="Mess Food Suggestion" subtitle="Mewar University • Weekly Mess Chart" />
      <View style={styles.chips}>
        <TouchableOpacity onPress={() => setSubTab('menu')} style={[styles.chip, subTab === 'menu' && styles.chipActive]}>
          <Text style={[styles.chipText, subTab === 'menu' && { color: '#000' }]}>Weekly Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSubTab('suggest')} style={[styles.chip, subTab === 'suggest' && styles.chipActive]}>
          <Text style={[styles.chipText, subTab === 'suggest' && { color: '#000' }]}>Suggest Food</Text>
        </TouchableOpacity>
      </View>

      {subTab === 'menu' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }} contentContainerStyle={{ gap: 6 }}>
            {CAMPUS_WEEKLY_MENU.map(d => (
              <TouchableOpacity key={d.day} onPress={() => setSelectedDay(d.day)} style={[styles.chip, selectedDay === d.day && styles.chipActive]}>
                <Text style={[styles.chipText, selectedDay === d.day && { color: '#000' }]}>{d.day.slice(0,3)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Card style={{ padding: 16 }}>
            <Text style={{ color: C.cyan, fontSize: 16, fontWeight: '900', marginBottom: 12 }}>{selected.day} MENU</Text>
            {[
              ['BREAKFAST', selected.breakfast, 'sunny-outline'],
              ['LUNCH', selected.lunch, 'restaurant-outline'],
              ['SNACKS', selected.snacks, 'cafe-outline'],
              ['DINNER', selected.dinner, 'moon-outline']
            ].map(([label, val, icon]) => (
              <View key={label} style={styles.mealRow}>
                <View style={styles.mealIcon}><Ionicons name={icon} color={C.cyan} size={18} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{label}</Text>
                  <Text style={styles.bodyText}>{val}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.noteText}>NOTE: - All students are requested not to waste food.</Text>
          </Card>
        </>
      ) : (
        <Card>
          <Label>Select Preferred Day</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 6 }}>
            {DAYS.map(day => (
              <TouchableOpacity 
                key={day} 
                onPress={() => setDish(o => ({ ...o, preferredDay: day }))} 
                style={[styles.chip, dish.preferredDay === day && styles.chipActive]}
              >
                <Text style={[styles.chipText, dish.preferredDay === day && { color: '#000' }]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 4 MEALS INPUT FIELDS MATCHING REFERENCE IMAGE */}
          <View style={styles.mealInputSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="sunny-outline" color={C.cyan} size={18} />
              <Label>BREAKFAST</Label>
            </View>
            <Field placeholder="e.g. Chole Bhature + Tea" value={dish.breakfast} onChangeText={v => setDish(o => ({ ...o, breakfast: v }))} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="restaurant-outline" color={C.cyan} size={18} />
              <Label>LUNCH</Label>
            </View>
            <Field placeholder="e.g. Lauki Kofte + Chana Dal, Rice, Chapati" value={dish.lunch} onChangeText={v => setDish(o => ({ ...o, lunch: v }))} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="cafe-outline" color={C.cyan} size={18} />
              <Label>SNACKS</Label>
            </View>
            <Field placeholder="e.g. Maggi + Tea" value={dish.snacks} onChangeText={v => setDish(o => ({ ...o, snacks: v }))} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="moon-outline" color={C.cyan} size={18} />
              <Label>DINNER</Label>
            </View>
            <Field placeholder="e.g. Aloo Bhujhiya, Masoor Dal, Rice" value={dish.dinner} onChangeText={v => setDish(o => ({ ...o, dinner: v }))} />
          </View>

          <Button title="Submit 4-Meal Suggestion" onPress={submitFood} loading={busy} />
        </Card>
      )}
    </>
  );
}

function MapScreen({ query, setQuery }) {
  return (
    <>
      <Heading title="Campus Map" subtitle="Mewar University Satellite View" />
      <Field icon="search-outline" placeholder="Search location..." value={query} onChangeText={setQuery} />
      
      <Card style={{ padding: 0, overflow: 'hidden', marginVertical: 12 }}>
        <Image source={campusSatelliteMapImg} resizeMode="cover" style={styles.satelliteMap} />
      </Card>
    </>
  );
}

function ChatScreen({ chat, chatInput, setChatInput, sendChat }) {
  return (
    <>
      <Heading title="One AI" subtitle="Your Smart Campus Assistant" />
      <Card style={{ minHeight: 350 }}>
        {chat.map((m, i) => (
          <View key={i} style={[styles.chatBubble, m.from === 'me' ? styles.chatMine : styles.chatBot]}>
            <Text style={styles.bodyText}>{m.text}</Text>
          </View>
        ))}
      </Card>
      <View style={styles.chatInputContainer}>
        <Field style={{ flex: 1 }} placeholder="Type your message..." value={chatInput} onChangeText={setChatInput} />
        <TouchableOpacity onPress={sendChat} style={styles.sendButton}>
          <Ionicons name="send" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );
}

function ProfileScreen({ session, logout }) {
  return (
    <>
      <Heading title="My Profile" subtitle="Campus Account" />
      <Card>
        <Text style={styles.cardTitle}>{session.user.name}</Text>
        <Text style={styles.muted}>{session.user.email}</Text>
        <Button title="Sign Out" onPress={logout} />
      </Card>
    </>
  );
}


const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#01050D',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
  },
  mobileFrame: {
    width: '100vw',
    maxWidth: 412,
    height: '100vh',
    maxHeight: 890,
    backgroundColor: '#020916',
    borderWidth: Platform.OS === 'web' ? 4 : 0,
    borderColor: '#163561',
    borderRadius: Platform.OS === 'web' ? 32 : 0,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  },

  safe: { flex: 1, backgroundColor: '#020916', paddingTop: Platform.OS === 'android' ? 26 : 0 },
  center: { flex: 1, backgroundColor: '#020916', alignItems: 'center', justifyContent: 'center' },
  headerUniversityLogo: { width: 36, height: 36, marginRight: 8 },
  topbar: { height: 56, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#0A1E3F', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandSub: { color: C.muted, fontSize: 8, letterSpacing: 1, marginTop: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#091B3A', borderWidth: 1, borderColor: '#163561', alignItems: 'center', justifyContent: 'center' },
  page: { padding: 16, paddingBottom: 40 },
  tabbar: { height: 60, borderTopWidth: 1, borderTopColor: '#0E2952', backgroundColor: '#020A1A', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  fab: { position: 'absolute', right: 18, bottom: 72, width: 50, height: 50, borderRadius: 25, backgroundColor: '#0066FF', borderWidth: 2, borderColor: '#4D94FF', alignItems: 'center', justifyContent: 'center', elevation: 8 },

  // Welcome Screen
  welcomeContainer: { flex: 1, backgroundColor: '#020916' },
  welcomeBgImage: { flex: 1, width: '100%', height: '100%' },
  welcomeOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 18, 0.45)', justifyContent: 'space-between', alignItems: 'center', paddingTop: 35, paddingBottom: 25, paddingHorizontal: 20 },
  welcomeTopSection: { alignItems: 'center', width: '100%' },
  welcomeUniLogo: { width: 100, height: 80, marginBottom: 6 },
  welcomeNexoraImageLogo: { width: 220, height: 55, marginVertical: 4 },
  welcomeSubText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  welcomeBottomSection: { alignItems: 'center', width: '100%' },
  welcomeTaglineMain: { color: '#94A3B8', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  welcomeTaglineSub: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  welcomeGetStartedBtn: { backgroundColor: '#0066FF', width: '100%', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#38BDF8', shadowColor: '#0066FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  welcomeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  welcomeFooterBox: { alignItems: 'center' },
  welcomePoweredBy: { color: '#94A3B8', fontSize: 9, fontWeight: '500', letterSpacing: 1, marginBottom: 2 },
  welcomeFooterLogoImage: { width: 110, height: 25 },

  
  authWrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 20 },
  authUniversityLogo: { width: 90, height: 75, alignSelf: 'center' },
  authNexoraLogo: { width: '75%', height: 45, alignSelf: 'center', marginTop: 4 },
  tagline: { textAlign: 'center', color: C.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  authCard: { marginTop: 14, padding: 16, backgroundColor: '#051329', borderRadius: 16, borderWidth: 1, borderColor: '#0E2952' },
  h2: { color: 'white', fontSize: 18, fontWeight: '800' },
  muted: { color: '#8EA3C7', fontSize: 12, lineHeight: 16 },
  poweredLabel: { color: '#4D94FF', fontSize: 10, textAlign: 'center', marginTop: 12, fontWeight: '700', letterSpacing: 1 },
  poweredLogo: { width: 90, height: 25, alignSelf: 'center' },

  // Dashboard & Components
  greeting: { color: 'white', fontSize: 20, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  totalCard: { flex: 1.2, padding: 12, justifyContent: 'center' },
  statNumLarge: { fontSize: 32, fontWeight: '900', color: C.cyan, marginTop: 4 },
  miniCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  action: { width: '48%', backgroundColor: '#051329', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#0E2952', flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: 'white', fontSize: 11, fontWeight: '700' },
  cardTitle: { color: 'white', fontSize: 14, fontWeight: '800' },
  bodyText: { color: '#D1E0F7', fontSize: 12, marginTop: 4 },

  
  chips: { flexDirection: 'row', gap: 6, marginVertical: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#0E2952', backgroundColor: '#091B3A' },
  chipActive: { backgroundColor: C.cyan, borderColor: C.cyan },
  chipText: { color: 'white', fontSize: 11, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },

  
  mealRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#0E2952' },
  mealIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#091B3A', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  mealTitle: { color: C.cyan, fontSize: 12, fontWeight: '800' },
  mealInputSection: { marginTop: 6, marginBottom: 10 },
  noteText: { color: C.muted, fontSize: 10, fontStyle: 'italic', marginTop: 6 },
  satelliteMap: { width: '100%', height: 320, borderRadius: 12 },
  chatBubble: { padding: 10, borderRadius: 12, marginVertical: 4, maxWidth: '80%' },
  chatMine: { backgroundColor: '#0066FF', alignSelf: 'flex-end' },
  chatBot: { backgroundColor: '#091B3A', alignSelf: 'flex-start' },
  chatInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0066FF', alignItems: 'center', justifyContent: 'center' },

  
  statusBtn: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#163561', backgroundColor: '#051329', alignItems: 'center' },
  statusBtnActive: { backgroundColor: '#0066FF', borderColor: '#38BDF8' },
  statusBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' }
});