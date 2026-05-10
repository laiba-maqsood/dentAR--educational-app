import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';

export default function StudentDetailScreen({ route, navigation }) {
  const { student } = route.params;

  const results = student.results.sort((a, b) =>
    new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  const avg = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;

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
        <Text style={styles.title}>Student Report</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: getScoreColor(avg) }]}>
          <Text style={styles.avatarTxt}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.studentName}>{student.name}</Text>
        {student.rollNumber ? (
          <Text style={styles.rollNum}>Roll No: {student.rollNumber}</Text>
        ) : null}
        <Text style={styles.email}>{student.email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: getScoreColor(avg) }]}>
              {avg}%
            </Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{results.length}</Text>
            <Text style={styles.statLabel}>Quizzes Taken</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[
              styles.statNum,
              { color: results.filter(r => r.percentage >= 70).length > 0 ? '#0f6e56' : '#888' }
            ]}>
              {results.filter(r => r.percentage >= 70).length}
            </Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quiz History</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {results.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No quizzes attempted yet</Text>
          </View>
        ) : (
          results.map((result) => (
            <TouchableOpacity
              key={result.id}
              style={styles.resultCard}
              onPress={() => navigation.navigate('AttemptDetail', { result })}>
              <View style={[
                styles.scoreBadge,
                { backgroundColor: getScoreColor(result.percentage) }
              ]}>
                <Text style={styles.scoreNum}>{result.percentage}%</Text>
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.quizName} numberOfLines={2}>
                  {result.quizName}
                </Text>
                <Text style={styles.resultMeta}>
                  {result.score}/{result.total} correct •{' '}
                  {result.questionType === 'mcq' ? 'MCQ' : 'T/F'}
                </Text>
                <Text style={styles.resultDate}>
                  {new Date(result.submittedAt).toLocaleDateString()} •{' '}
                  {new Date(result.submittedAt).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
              <Text style={styles.viewTxt}>View →</Text>
            </TouchableOpacity>
          ))
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
  profileCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16,
    padding: 20, alignItems: 'center', marginBottom: 16,
    borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  studentName: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  rollNum: { fontSize: 14, color: '#185FA5', marginBottom: 2 },
  email: { fontSize: 13, color: '#888', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statBox: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 10,
    padding: 12, alignItems: 'center'
  },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#185FA5' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 15, color: '#888', fontWeight: '600',
    paddingHorizontal: 20, marginBottom: 12
  },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: '#888' },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 20, marginBottom: 12, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  scoreBadge: {
    width: 52, height: 52, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 14
  },
  scoreNum: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  resultInfo: { flex: 1 },
  quizName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  resultMeta: { fontSize: 12, color: '#888', marginBottom: 2 },
  resultDate: { fontSize: 11, color: '#aaa' },
  viewTxt: { fontSize: 14, color: '#185FA5', fontWeight: '600' }
});