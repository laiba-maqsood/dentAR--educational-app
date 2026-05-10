import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';

export default function QuizDetailScreen({ route, navigation }) {
  const { quiz } = route.params;
  const isMCQ = quiz.questionType === 'mcq';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quiz Preview</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.quizName}>{quiz.materialName}</Text>
        <View style={styles.metaRow}>
          <View style={[
            styles.typeBadge,
            { backgroundColor: isMCQ ? '#7F77DD' : '#0f6e56' }
          ]}>
            <Text style={styles.typeTxt}>{isMCQ ? 'MCQ' : 'True/False'}</Text>
          </View>
          <Text style={styles.metaTxt}>{quiz.questionCount} questions</Text>
          <Text style={styles.metaTxt}>{quiz.attempts || 0} attempts</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {quiz.questions.map((q, i) => (
          <View key={i} style={styles.questionCard}>
            <Text style={styles.qNum}>Question {i + 1}</Text>
            <Text style={styles.qText}>{q.question}</Text>

            {isMCQ ? (
              q.options?.map((opt, j) => (
                <View key={j} style={[
                  styles.optBox,
                  j === q.correct && styles.optBoxCorrect
                ]}>
                  <Text style={[
                    styles.optTxt,
                    j === q.correct && styles.optTxtCorrect
                  ]}>
                    {j === q.correct ? '✓ ' : '  '}{opt}
                  </Text>
                </View>
              ))
            ) : (
              <View>
                <View style={[
                  styles.optBox,
                  q.correct === true && styles.optBoxCorrect
                ]}>
                  <Text style={[
                    styles.optTxt,
                    q.correct === true && styles.optTxtCorrect
                  ]}>
                    {q.correct === true ? '✓ ' : '  '}True
                  </Text>
                </View>
                <View style={[
                  styles.optBox,
                  q.correct === false && styles.optBoxCorrect
                ]}>
                  <Text style={[
                    styles.optTxt,
                    q.correct === false && styles.optTxtCorrect
                  ]}>
                    {q.correct === false ? '✓ ' : '  '}False
                  </Text>
                </View>
              </View>
            )}

            {q.explanation ? (
              <Text style={styles.explanation}>
                Explanation: {q.explanation}
              </Text>
            ) : null}
          </View>
        ))}
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
  backTxt: { color: '#7F77DD', fontSize: 16, width: 60 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  infoCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12,
    padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  quizName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6
  },
  typeTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  metaTxt: { fontSize: 13, color: '#888' },
  questionCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12,
    borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  qNum: { fontSize: 12, color: '#7F77DD', fontWeight: '600', marginBottom: 6 },
  qText: {
    fontSize: 15, fontWeight: '500', color: '#1a1a1a',
    marginBottom: 12, lineHeight: 22
  },
  optBox: {
    padding: 10, borderRadius: 8, marginBottom: 6,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb'
  },
  optBoxCorrect: { backgroundColor: '#e8f5f0', borderColor: '#0f6e56' },
  optTxt: { fontSize: 13, color: '#888' },
  optTxtCorrect: { color: '#0f6e56', fontWeight: '600' },
  explanation: {
    fontSize: 12, color: '#185FA5', marginTop: 10,
    fontStyle: 'italic', lineHeight: 18
  }
});