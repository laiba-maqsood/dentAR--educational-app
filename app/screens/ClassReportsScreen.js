import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { db } from '../services/firebase';
import {
  collection, getDocs, deleteDoc, doc
} from 'firebase/firestore';

export default function ClassReportsScreen({ navigation }) {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const resultsSnap = await getDocs(collection(db, 'results'));
      const resultsList = resultsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.role === 'student');

      const studentMap = {};
      usersList.forEach(u => {
        studentMap[u.id] = {
          id: u.id,
          name: u.name || 'Unknown',
          email: u.email,
          rollNumber: u.rollNumber || '',
          results: []
        };
      });

      resultsList.forEach(r => {
        if (studentMap[r.studentId]) {
          studentMap[r.studentId].results.push(r);
        } else {
          studentMap[r.studentId] = {
            id: r.studentId,
            name: r.studentName || 'Unknown',
            email: r.studentEmail,
            rollNumber: r.rollNumber || '',
            results: [r]
          };
        }
      });

      const studentList = Object.values(studentMap).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setStudents(studentList);
      setResults(resultsList);
    } catch (error) {
      console.log('Error:', error);
    }
    setLoading(false);
  }

  async function deleteStudent(student) {
    Alert.alert(
      'Remove Student',
      `Remove "${student.name}" from the system? This will delete their account and all results.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', student.id));
              for (const result of student.results) {
                await deleteDoc(doc(db, 'results', result.id));
              }
              loadData();
              Alert.alert('Done', `${student.name} has been removed.`);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  }

  const totalStudents = students.length;
  const totalAttempts = results.length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;

  function getScoreColor(pct) {
    if (pct >= 70) return '#0f6e56';
    if (pct >= 50) return '#854F0B';
    return '#dc2626';
  }

  function getStudentAvg(results) {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Class Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalAttempts}</Text>
          <Text style={styles.statLabel}>Attempts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: getScoreColor(avgScore) }]}>
            {avgScore}%
          </Text>
          <Text style={styles.statLabel}>Class Avg</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#185FA5" style={{ marginTop: 40 }} />
      ) : students.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No students yet</Text>
          <Text style={styles.emptySubText}>
            Students will appear here after they register and attempt quizzes
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Students</Text>
          {students.map((student) => {
            const avg = getStudentAvg(student.results);
            return (
              <View key={student.id} style={styles.studentCard}>
                <TouchableOpacity
                  style={styles.studentLeft}
                  onPress={() => navigation.navigate('StudentDetail', { student })}>
                  <View style={[
                    styles.avatarBox,
                    { backgroundColor: getScoreColor(avg) }
                  ]}>
                    <Text style={styles.avatarTxt}>
                      {student.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    {student.rollNumber ? (
                      <Text style={styles.rollNum}>Roll: {student.rollNumber}</Text>
                    ) : (
                      <Text style={styles.rollNum}>{student.email}</Text>
                    )}
                    <Text style={styles.attemptsTxt}>
                      {student.results.length} quiz{student.results.length !== 1 ? 'zes' : ''} attempted
                    </Text>
                  </View>
                  <View style={styles.avgBox}>
                    <Text style={[styles.avgNum, { color: getScoreColor(avg) }]}>
                      {student.results.length > 0 ? `${avg}%` : 'N/A'}
                    </Text>
                    <Text style={styles.avgLabel}>avg</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => deleteStudent(student)}>
                  <Text style={styles.removeBtnTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 56 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16
  },
  backTxt: { color: '#185FA5', fontSize: 16, width: 60 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 20,
    marginBottom: 16, gap: 12
  },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#185FA5' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '500' },
  emptySubText: {
    fontSize: 13, color: '#aaa', marginTop: 6,
    textAlign: 'center', paddingHorizontal: 40
  },
  sectionTitle: {
    fontSize: 15, color: '#888', fontWeight: '600',
    paddingHorizontal: 20, marginBottom: 12
  },
  studentCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12,
    borderRadius: 12, borderWidth: 0.5, borderColor: '#e5e7eb', overflow: 'hidden'
  },
  studentLeft: {
    flexDirection: 'row', alignItems: 'center', padding: 14
  },
  avatarBox: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 14
  },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  rollNum: { fontSize: 12, color: '#185FA5', marginBottom: 2 },
  attemptsTxt: { fontSize: 12, color: '#888' },
  avgBox: { alignItems: 'center' },
  avgNum: { fontSize: 20, fontWeight: 'bold' },
  avgLabel: { fontSize: 11, color: '#888' },
  removeBtn: {
    backgroundColor: '#fee2e2', padding: 10,
    alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#fecaca'
  },
  removeBtnTxt: { color: '#dc2626', fontWeight: '600', fontSize: 13 }
});