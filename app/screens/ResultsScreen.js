import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator
} from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function ResultsScreen({ navigation }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    try {
      const q = query(
        collection(db, 'results'),
        where('studentId', '==', auth.currentUser?.uid)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      list.sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      setResults(list);
    } catch (error) {
      console.log('Error:', error);
    }
    setLoading(false);
  }

  const avg = results.length > 0
    ? Math.round(
        results.reduce((s, r) => s + r.percentage, 0) / results.length
      )
    : 0;

  const passed = results.filter(r => r.percentage >= 70).length;

  function getScoreColor(pct) {
    if (pct >= 70) return '#0f6e56';
    if (pct >= 50) return '#854F0B';
    return '#dc2626';
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Results</Text>
        <View style={{ width: 60 }} />
      </View>

      {results.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: getScoreColor(avg) }]}>
              {avg}%
            </Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{results.length}</Text>
            <Text style={styles.statLabel}>Quizzes Taken</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#0f6e56' }]}>
              {passed}
            </Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#993556" style={{ marginTop: 40 }} />
      ) : results.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No results yet</Text>
          <Text style={styles.emptySubText}>
            Your quiz results will appear here after you attempt quizzes
          </Text>
          <TouchableOpacity
            style={styles.goQuizBtn}
            onPress={() => navigation.navigate('Quiz')}>
            <Text style={styles.goQuizTxt}>Take a Quiz →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Quiz History</Text>
          {results.map((result) => (
            <View key={result.id} style={styles.resultCard}>
              <View style={[
                styles.scoreBadge,
                { backgroundColor: getScoreColor(result.percentage) }
              ]}>
                <Text style={styles.scoreNum}>{result.percentage}%</Text>
                <Text style={styles.scoreGrade}>
                  {result.percentage >= 70
                    ? 'Pass' : result.percentage >= 50 ? 'Fair' : 'Fail'}
                </Text>
              </View>

              <View style={styles.resultInfo}>
                <Text style={styles.quizName} numberOfLines={2}>
                  {result.quizName}
                </Text>
                <Text style={styles.resultMeta}>
                  {result.score}/{result.total} correct
                </Text>
                <Text style={styles.resultType}>
                  {result.questionType === 'mcq' ? 'Multiple Choice' : 'True / False'}
                </Text>
                <Text style={styles.resultDate}>
                  {new Date(result.submittedAt).toLocaleDateString()} •{' '}
                  {new Date(result.submittedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>

              <View style={styles.rightCol}>
                <View style={[
                  styles.typePill,
                  {
                    backgroundColor: result.questionType === 'mcq'
                      ? '#f0eeff' : '#e8f5f0'
                  }
                ]}>
                  <Text style={[
                    styles.typePillTxt,
                    {
                      color: result.questionType === 'mcq'
                        ? '#7F77DD' : '#0f6e56'
                    }
                  ]}>
                    {result.questionType === 'mcq' ? 'MCQ' : 'T/F'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16
  },
  backTxt: {
    color: '#993556',
    fontSize: 16,
    width: 60
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#e5e7eb'
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statNum: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#185FA5'
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center'
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb'
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  goQuizBtn: {
    backgroundColor: '#993556',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  goQuizTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15
  },
  sectionTitle: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#e5e7eb'
  },
  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  scoreNum: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  scoreGrade: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2
  },
  resultInfo: {
    flex: 1
  },
  quizName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4
  },
  resultMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2
  },
  resultType: {
    fontSize: 12,
    color: '#7F77DD',
    fontWeight: '500',
    marginBottom: 2
  },
  resultDate: {
    fontSize: 11,
    color: '#aaa'
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 8
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  typePillTxt: {
    fontSize: 11,
    fontWeight: '600'
  }
});