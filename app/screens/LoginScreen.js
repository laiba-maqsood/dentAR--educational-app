import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ============================================================
// FACULTY ACCESS CONTROL
// Only this email is allowed to register or log in as faculty.
// To change the authorized faculty, update this constant.
// ============================================================
const AUTHORIZED_FACULTY_EMAIL = 'beingartistic123@gmail.com';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [role, setRole] = useState('student');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  function isAuthorizedFaculty(emailAddr) {
    return emailAddr.trim().toLowerCase() === AUTHORIZED_FACULTY_EMAIL.toLowerCase();
  }

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!isLogin && role === 'student' && !rollNumber.trim()) {
      Alert.alert('Error', 'Please enter your roll number');
      return;
    }

    // CHECK 1 — block registration as faculty for unauthorized emails
    if (!isLogin && role === 'faculty' && !isAuthorizedFaculty(email)) {
      Alert.alert(
        'Faculty Registration Restricted',
        'Only the authorized faculty account can register as faculty. Please register as a student instead.'
      );
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // LOGIN FLOW
        const userCredential = await signInWithEmailAndPassword(
          auth, email, password
        );
        const userDoc = await getDoc(
          doc(db, 'users', userCredential.user.uid)
        );
        const userRole = userDoc.data()?.role || 'student';

        // CHECK 2 — even at login, block faculty access for unauthorized emails
        // (safety net in case someone manually created a faculty account in Firestore)
        if (userRole === 'faculty' && !isAuthorizedFaculty(email)) {
          await auth.signOut();
          Alert.alert(
            'Access Denied',
            'Faculty access is restricted to the authorized account. Please contact the administrator.'
          );
          setLoading(false);
          return;
        }

        if (userRole === 'faculty') {
          navigation.replace('FacultyDashboard');
        } else {
          navigation.replace('StudentDashboard');
        }
      } else {
        // REGISTRATION FLOW
        const userCredential = await createUserWithEmailAndPassword(
          auth, email, password
        );
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          name: name.trim(),
          rollNumber: role === 'student' ? rollNumber.trim() : '',
          role: role,
          createdAt: new Date().toISOString()
        });
        if (role === 'faculty') {
          navigation.replace('FacultyDashboard');
        } else {
          navigation.replace('StudentDashboard');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">

      <Text style={styles.title}>DentAR</Text>
      <Text style={styles.subtitle}>Dental Education Platform</Text>

      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
          onPress={() => setRole('student')}>
          <Text style={[
            styles.roleTxt,
            role === 'student' && styles.roleTxtActive
          ]}>Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'faculty' && styles.roleBtnActive]}
          onPress={() => setRole('faculty')}>
          <Text style={[
            styles.roleTxt,
            role === 'faculty' && styles.roleTxtActive
          ]}>Faculty</Text>
        </TouchableOpacity>
      </View>

      {/* Show a small notice when registering as faculty */}
      {!isLogin && role === 'faculty' && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTxt}>
            Faculty registration is restricted to the authorized account.
            Other users should register as students.
          </Text>
        </View>
      )}

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      {!isLogin && role === 'student' && (
        <TextInput
          style={styles.input}
          placeholder="Roll Number (e.g. BDS-2021-001)"
          value={rollNumber}
          onChangeText={setRollNumber}
          autoCapitalize="characters"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0f6e56"
          style={{ marginVertical: 16 }}
        />
      ) : (
        <TouchableOpacity style={styles.btn} onPress={handleAuth}>
          <Text style={styles.btnTxt}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchTxt}>
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc'
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0f6e56',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginBottom: 32
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0f6e56'
  },
  roleBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  roleBtnActive: {
    backgroundColor: '#0f6e56'
  },
  roleTxt: {
    color: '#0f6e56',
    fontWeight: '600'
  },
  roleTxtActive: {
    color: '#fff'
  },
  noticeBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16
  },
  noticeTxt: {
    color: '#854F0B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 16
  },
  btn: {
    backgroundColor: '#0f6e56',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16
  },
  btnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  switchTxt: {
    textAlign: 'center',
    color: '#0f6e56',
    fontSize: 14
  }
});
