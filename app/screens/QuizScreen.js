import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function QuizScreen({ navigation }) {
  const [quizzes, setQuizzes] = useState([]);
  const [attemptedIds, setAttemptedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const quizSnap = await getDocs(collection(db, 'quizzes'));
      const quizList = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(quizList);

      const resultsQ = query(
        collection(db, 'results'),
        where('studentId', '==', auth.currentUser?.uid)
      );
      const resultsSnap = await getDocs(resultsQ);
      const attempted = resultsSnap.docs.map(d => d.data().quizId);
      setAttemptedIds(attempted);
    } catch (error) {
      console.log('Load error:', error);
    }
    setLoading(false);
  }

  function handleQuizPress(quiz) {
    const alreadyAttempted = attemptedIds.includes(quiz.id) && !quiz.isMock;
    if (alreadyAttempted) {
      Alert.alert(
        'Already Attempted',
        'You have already submitted this quiz. Only mock quizzes can be attempted multiple times.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('QuizAttempt', { quiz });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Available Quizzes</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#7F77DD" style={{ marginTop: 40 }} />
      ) : quizzes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No quizzes available yet</Text>
          <Text style={styles.emptySubText}>
            Your faculty will generate quizzes here
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {quizzes.map((quiz) => {
            const attempted = attemptedIds.includes(quiz.id) && !quiz.isMock;
            return (
              <TouchableOpacity
                key={quiz.id}
                style={[styles.quizCard, attempted && styles.quizCardAttempted]}
                onPress={() => handleQuizPress(quiz)}>
                <View style={[
                  styles.quizBadge,
                  {
                    backgroundColor: attempted
                      ? '#9ca3af'
                      : quiz.questionType === 'mcq' ? '#7F77DD' : '#0f6e56'
                  }
                ]}>
                  <Text style={styles.quizBadgeTxt}>
                    {quiz.questionType === 'mcq' ? 'MCQ' : 'T/F'}
                  </Text>
                </View>
                <View style={styles.quizInfo}>
                  <Text style={styles.quizName} numberOfLines={2}>
                    {quiz.materialName}
                  </Text>
                  <Text style={styles.quizMeta}>
                    {quiz.questionCount} questions
                  </Text>
                  {attempted && (
                    <Text style={styles.attemptedTxt}>Already submitted</Text>
                  )}
                </View>
                <Text style={[
                  styles.startTxt,
                  { color: attempted ? '#9ca3af' : '#7F77DD' }
                ]}>
                  {attempted ? 'Done ✓' : 'Start →'}
                </Text>
              </TouchableOpacity>
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
  backTxt: { color: '#7F77DD', fontSize: 16, width: 60 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '500' },
  emptySubText: {
    fontSize: 13, color: '#aaa', marginTop: 6,
    textAlign: 'center', paddingHorizontal: 40
  },
  quizCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 20, marginBottom: 12, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  quizCardAttempted: { backgroundColor: '#f9fafb', opacity: 0.8 },
  quizBadge: {
    width: 52, height: 52, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 14
  },
  quizBadgeTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  quizInfo: { flex: 1 },
  quizName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  quizMeta: { fontSize: 12, color: '#7F77DD', fontWeight: '500' },
  attemptedTxt: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  startTxt: { fontSize: 16, fontWeight: '600' }
});