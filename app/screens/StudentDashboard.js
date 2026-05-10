import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

export default function StudentDashboard({ navigation }) {

  async function handleLogout() {
    await signOut(auth);
    navigation.replace('Login');
  }

  const features = [
    {
      title: 'Study Topics',
      subtitle: 'Lectures, videos and PDFs',
      color: '#0f6e56',
      screen: 'ReadModule'
    },
    {
      title: '3D / AR Viewer',
      subtitle: 'Interactive dental models',
      color: '#185FA5',
      screen: 'ARViewer'
    },
    {
      title: 'AI Chatbot',
      subtitle: 'Ask dental questions',
      color: '#854F0B',
      screen: 'Chatbot'
    },
    {
      title: 'Take Quiz',
      subtitle: 'Test your knowledge',
      color: '#7F77DD',
      screen: 'Quiz'
    },
    {
      title: 'My Results',
      subtitle: 'View your scores',
      color: '#993556',
      screen: 'Results'
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.email}>{auth.currentUser?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>What would you like to do?</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {features.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}>
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <Text style={styles.iconTxt}>{item.title[0]}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 56
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f6e56'
  },
  email: {
    fontSize: 13,
    color: '#888',
    marginTop: 2
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  logoutTxt: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13
  },
  sectionTitle: {
    fontSize: 15,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 16
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  iconTxt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  cardText: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  cardSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2
  },
  arrow: {
    fontSize: 24,
    color: '#ccc'
  }
});
