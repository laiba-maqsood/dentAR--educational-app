import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert
} from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function QuizAttemptScreen({ route, navigation }) {
  const { quiz } = route.params;
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const isMCQ = quiz.questionType === 'mcq';
  const question = quiz.questions[currentQ];
  const total = quiz.questions.length;

  function selectAnswer(answer) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [currentQ]: answer }));
  }

  function next() {
    if (currentQ < total - 1) setCurrentQ(currentQ + 1);
  }

  function previous() {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  }

  async function submitQuiz() {
    if (Object.keys(answers).length < total) {
      Alert.alert(
        'Incomplete',
        `You have answered ${Object.keys(answers).length} of ${total} questions. Submit anyway?`,
        [
          { text: 'Continue Quiz', style: 'cancel' },
          { text: 'Submit', onPress: () => calculateScore() }
        ]
      );
      return;
    }
    calculateScore();
  }

  async function calculateScore() {
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      const userAnswer = answers[index];
      if (userAnswer === q.correct) correct++;
    });

    const percentage = Math.round((correct / total) * 100);
    setScore(correct);
    setSubmitted(true);

    try {
      const studentDoc = await getDoc(
        doc(db, 'users', auth.currentUser?.uid)
      );
      const studentData = studentDoc.data();

      await addDoc(collection(db, 'results'), {
        quizId: quiz.id,
        quizName: quiz.materialName,
        studentId: auth.currentUser?.uid,
        studentEmail: auth.currentUser?.email,
        studentName: studentData?.name || 'Unknown',
        rollNumber: studentData?.rollNumber || '',
        score: correct,
        total: total,
        percentage: percentage,
        questionType: quiz.questionType,
        answers: answers,
        submittedAt: new Date().toISOString()
      });

      const quizRef = doc(db, 'quizzes', quiz.id);
      await updateDoc(quizRef, {
        attempts: (quiz.attempts || 0) + 1
      });

    } catch (error) {
      console.log('Save result error:', error);
    }
  }

  if (submitted) {
    const percentage = Math.round((score / total) * 100);
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[
            styles.scoreBadge,
            {
              backgroundColor: percentage >= 70
                ? '#0f6e56'
                : percentage >= 50 ? '#854F0B' : '#dc2626'
            }
          ]}>
            <Text style={styles.scorePercent}>{percentage}%</Text>
            <Text style={styles.scoreLabel}>
              {percentage >= 70
                ? 'Excellent!'
                : percentage >= 50 ? 'Good Effort' : 'Keep Studying'}
            </Text>
          </View>

          <Text style={styles.scoreDetail}>
            You scored {score} out of {total} questions
          </Text>

          <Text style={styles.reviewTitle}>Answer Review</Text>

          {quiz.questions.map((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correct;
            return (
              <View key={index} style={[
                styles.reviewCard,
                { borderLeftColor: isCorrect ? '#0f6e56' : '#dc2626' }
              ]}>
                <Text style={styles.reviewQ}>
                  Q{index + 1}. {q.question}
                </Text>

                {isMCQ ? (
                  q.options.map((opt, i) => (
                    <Text key={i} style={[
                      styles.reviewOpt,
                      i === q.correct && { color: '#0f6e56', fontWeight: '600' },
                      i === userAnswer && i !== q.correct && {
                        color: '#dc2626',
                        textDecorationLine: 'line-through'
                      }
                    ]}>
                      {i === q.correct ? '✓ ' : i === userAnswer ? '✗ ' : '  '}
                      {opt}
                    </Text>
                  ))
                ) : (
                  <View>
                    <Text style={[
                      styles.reviewOpt,
                      { color: q.correct === true ? '#0f6e56' : '#888' }
                    ]}>
                      {q.correct === true ? '✓ ' : '  '}True
                    </Text>
                    <Text style={[
                      styles.reviewOpt,
                      { color: q.correct === false ? '#0f6e56' : '#888' }
                    ]}>
                      {q.correct === false ? '✓ ' : '  '}False
                    </Text>
                  </View>
                )}

                <Text style={styles.explanation}>{q.explanation}</Text>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnTxt}>Back to Quizzes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {quiz.materialName}
        </Text>
        <Text style={styles.progress}>{currentQ + 1}/{total}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${((currentQ + 1) / total) * 100}%` }
        ]} />
      </View>

      <ScrollView style={styles.questionArea}>
        <Text style={styles.questionNumber}>Question {currentQ + 1}</Text>
        <Text style={styles.questionText}>{question.question}</Text>

        {isMCQ ? (
          question.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.optionBtn,
                answers[currentQ] === i && styles.optionBtnSelected
              ]}
              onPress={() => selectAnswer(i)}>
              <View style={[
                styles.optionCircle,
                answers[currentQ] === i && styles.optionCircleSelected
              ]}>
                <Text style={[
                  styles.optionLetter,
                  answers[currentQ] === i && styles.optionLetterSelected
                ]}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                answers[currentQ] === i && styles.optionTextSelected
              ]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View>
            <TouchableOpacity
              style={[
                styles.optionBtn,
                answers[currentQ] === true && styles.optionBtnSelected
              ]}
              onPress={() => selectAnswer(true)}>
              <View style={[
                styles.optionCircle,
                answers[currentQ] === true && styles.optionCircleSelected
              ]}>
                <Text style={[
                  styles.optionLetter,
                  answers[currentQ] === true && styles.optionLetterSelected
                ]}>T</Text>
              </View>
              <Text style={[
                styles.optionText,
                answers[currentQ] === true && styles.optionTextSelected
              ]}>True</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionBtn,
                answers[currentQ] === false && styles.optionBtnSelected
              ]}
              onPress={() => selectAnswer(false)}>
              <View style={[
                styles.optionCircle,
                answers[currentQ] === false && styles.optionCircleSelected
              ]}>
                <Text style={[
                  styles.optionLetter,
                  answers[currentQ] === false && styles.optionLetterSelected
                ]}>F</Text>
              </View>
              <Text style={[
                styles.optionText,
                answers[currentQ] === false && styles.optionTextSelected
              ]}>False</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, currentQ === 0 && styles.navBtnDisabled]}
          onPress={previous}
          disabled={currentQ === 0}>
          <Text style={styles.navBtnTxt}>← Previous</Text>
        </TouchableOpacity>

        {currentQ < total - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextBtnTxt}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={submitQuiz}>
            <Text style={styles.submitBtnTxt}>Submit Quiz</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: 8
  },
  backTxt: {
    color: '#7F77DD',
    fontSize: 15,
    width: 60
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center'
  },
  progress: {
    fontSize: 14,
    color: '#888',
    width: 60,
    textAlign: 'right'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 24
  },
  progressFill: {
    height: 4,
    backgroundColor: '#7F77DD',
    borderRadius: 2
  },
  questionArea: {
    flex: 1,
    paddingHorizontal: 20
  },
  questionNumber: {
    fontSize: 13,
    color: '#7F77DD',
    fontWeight: '600',
    marginBottom: 8
  },
  questionText: {
    fontSize: 17,
    color: '#1a1a1a',
    lineHeight: 26,
    marginBottom: 24,
    fontWeight: '500'
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb'
  },
  optionBtnSelected: {
    borderColor: '#7F77DD',
    backgroundColor: '#f5f3ff'
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  optionCircleSelected: {
    borderColor: '#7F77DD',
    backgroundColor: '#7F77DD'
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888'
  },
  optionLetterSelected: {
    color: '#fff'
  },
  optionText: {
    fontSize: 15,
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 22
  },
  optionTextSelected: {
    color: '#7F77DD',
    fontWeight: '500'
  },
  navRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb'
  },
  navBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  navBtnDisabled: {
    opacity: 0.4
  },
  navBtnTxt: {
    color: '#888',
    fontWeight: '600',
    fontSize: 15
  },
  nextBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#7F77DD'
  },
  nextBtnTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15
  },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0f6e56'
  },
  submitBtnTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15
  },
  resultContainer: {
    padding: 20,
    paddingBottom: 40
  },
  scoreBadge: {
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16
  },
  scorePercent: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#fff'
  },
  scoreLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4
  },
  scoreDetail: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 0.5,
    borderColor: '#e5e7eb'
  },
  reviewQ: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
    lineHeight: 20
  },
  reviewOpt: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    lineHeight: 20
  },
  explanation: {
    fontSize: 13,
    color: '#185FA5',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18
  },
  doneBtn: {
    backgroundColor: '#7F77DD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  doneBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  }
});