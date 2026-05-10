import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';

export default function AttemptDetailScreen({ route, navigation }) {
  const { result } = route.params;
  const isMCQ = result.questionType === 'mcq';

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
        <Text style={styles.title}>Attempt Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.summaryCard}>
        <View style={[
          styles.scoreBadge,
          { backgroundColor: getScoreColor(result.percentage) }
        ]}>
          <Text style={styles.scoreNum}>{result.percentage}%</Text>
          <Text style={styles.scoreLabel}>
            {result.percentage >= 70 ? 'Excellent' : result.percentage >= 50 ? 'Good' : 'Needs Work'}
          </Text>
        </View>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryName}>{result.studentName}</Text>
          {result.rollNumber ? (
            <Text style={styles.summaryRoll}>Roll: {result.rollNumber}</Text>
          ) : null}
          <Text style={styles.summaryQuiz} numberOfLines={2}>{result.quizName}</Text>
          <Text style={styles.summaryMeta}>
            {result.score}/{result.total} correct • {isMCQ ? 'MCQ' : 'True/False'}
          </Text>
          <Text style={styles.summaryDate}>
            {new Date(result.submittedAt).toLocaleDateString()} at{' '}
            {new Date(result.submittedAt).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Question by Question Review</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {result.answers && Object.keys(result.answers).length > 0 ? (
          Object.entries(result.answers).map(([qIndex, userAnswer]) => {
            const qi = parseInt(qIndex);
            return (
              <View key={qi} style={[
                styles.qCard,
                {
                  borderLeftColor: userAnswer === (isMCQ ? userAnswer : userAnswer)
                    ? '#e5e7eb' : '#dc2626'
                }
              ]}>
                <Text style={styles.qNum}>Question {qi + 1}</Text>
                <View style={styles.answerRow}>
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>Student answered</Text>
                    <Text style={styles.answerValue}>
                      {isMCQ
                        ? `Option ${String.fromCharCode(65 + userAnswer)}`
                        : userAnswer ? 'True' : 'False'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Detailed answer data not available for this attempt
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  summaryCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16,
    padding: 16, marginBottom: 16, flexDirection: 'row',
    alignItems: 'center', gap: 16, borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  scoreBadge: {
    width: 72, height: 72, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center'
  },
  scoreNum: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  scoreLabel: { color: '#fff', fontSize: 10, marginTop: 2 },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  summaryRoll: { fontSize: 12, color: '#185FA5', marginBottom: 2 },
  summaryQuiz: { fontSize: 13, color: '#888', marginBottom: 4 },
  summaryMeta: { fontSize: 12, color: '#7F77DD', fontWeight: '500', marginBottom: 2 },
  summaryDate: { fontSize: 11, color: '#aaa' },
  sectionTitle: {
    fontSize: 15, color: '#888', fontWeight: '600',
    paddingHorizontal: 20, marginBottom: 12
  },
  qCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10,
    borderRadius: 10, padding: 14, borderLeftWidth: 3,
    borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  qNum: { fontSize: 12, color: '#7F77DD', fontWeight: '600', marginBottom: 8 },
  answerRow: { flexDirection: 'row', gap: 12 },
  answerBox: { flex: 1 },
  answerLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  answerValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  emptyBox: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' }
});