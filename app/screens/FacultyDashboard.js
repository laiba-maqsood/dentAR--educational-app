import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
  Modal, TextInput, Linking
} from 'react-native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import {
  collection, addDoc, getDocs, deleteDoc,
  query, where, doc
} from 'firebase/firestore';
import { DENTAL_MODELS } from './ARViewerScreen';

const WORKER_URL = 'https://rapid-limit-025e.laibamaqsood42.workers.dev/';

export default function FacultyDashboard({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(null);
  const [activeTab, setActiveTab] = useState('materials');

  const [uploadModal, setUploadModal] = useState(false);
  const [materialName, setMaterialName] = useState('');
  const [materialType, setMaterialType] = useState('pdf');
  const [driveLink, setDriveLink] = useState('');
  const [linkedModelId, setLinkedModelId] = useState(null); // NEW
  const [saving, setSaving] = useState(false);

  const [quizModal, setQuizModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [questionType, setQuestionType] = useState('mcq');
  const [questionCount, setQuestionCount] = useState('5');

  const [previewModal, setPreviewModal] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState(null);

  useEffect(() => {
    loadMaterials();
    loadQuizzes();
  }, []);

  async function loadMaterials() {
    setLoadingMaterials(true);
    try {
      const q = query(
        collection(db, 'materials'),
        where('uploadedBy', '==', auth.currentUser?.uid)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMaterials(list);
    } catch (error) {
      console.log('Load error:', error);
    }
    setLoadingMaterials(false);
  }

  async function loadQuizzes() {
    try {
      const q = query(
        collection(db, 'quizzes'),
        where('createdBy', '==', auth.currentUser?.uid)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(list);
    } catch (error) {
      console.log('Quiz load error:', error);
    }
  }

  function resetUploadModal() {
    setMaterialName('');
    setDriveLink('');
    setMaterialType('pdf');
    setLinkedModelId(null);
  }

  async function saveMaterial() {
    if (!materialName.trim()) {
      Alert.alert('Error', 'Please enter a material title.');
      return;
    }
    if (!driveLink.trim()) {
      Alert.alert('Error', 'Please paste the Google Drive link.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'materials'), {
        name: materialName.trim(),
        type: materialType,
        url: driveLink.trim(),
        modelId: linkedModelId || null, // NEW: 3D model link
        uploadedBy: auth.currentUser?.uid,
        uploadedAt: new Date().toISOString(),
        hasQuiz: false
      });
      setUploadModal(false);
      resetUploadModal();
      Alert.alert('Success', 'Material added successfully!');
      loadMaterials();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setSaving(false);
  }

  async function deleteMaterial(item) {
    Alert.alert(
      'Delete Material',
      `Delete "${item.name}"? This will also remove it from student view.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'materials', item.id));
              loadMaterials();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  }

  async function deleteQuiz(item) {
    Alert.alert(
      'Delete Quiz',
      `Delete quiz for "${item.materialName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'quizzes', item.id));
              loadQuizzes();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  }

  function getTypeColor(type) {
    switch (type) {
      case 'pdf': return '#0f6e56';
      case 'ppt': return '#185FA5';
      case 'video': return '#854F0B';
      case 'audio': return '#7F77DD';
      default: return '#888';
    }
  }

  function getTypeLabel(type) {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'ppt': return 'PPT';
      case 'video': return 'VIDEO';
      case 'audio': return 'AUDIO';
      default: return 'FILE';
    }
  }

  function openQuizModal(material) {
    if (!['pdf', 'ppt'].includes(material.type)) {
      Alert.alert('Not Supported', 'Quiz generation is available for PDF and PPT files only.');
      return;
    }
    setSelectedMaterial(material);
    setQuestionType('mcq');
    setQuestionCount('5');
    setQuizModal(true);
  }

  async function generateQuiz() {
    const count = parseInt(questionCount);
    if (isNaN(count) || count < 1 || count > 50) {
      Alert.alert('Invalid', 'Please enter a number between 1 and 50.');
      return;
    }
    setQuizModal(false);
    setGeneratingQuiz(selectedMaterial.id);

    const isMCQ = questionType === 'mcq';
    const systemPrompt = isMCQ
      ? `You are a dental education expert. Generate exactly ${count} multiple choice questions. Respond with ONLY valid JSON:
{"questions":[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}]}
correct is index (0=A,1=B,2=C,3=D).`
      : `You are a dental education expert. Generate exactly ${count} true/false questions. Respond with ONLY valid JSON:
{"questions":[{"question":"...","correct":true,"explanation":"..."}]}`;

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `Generate ${count} ${isMCQ ? 'MCQ' : 'true/false'} questions for dental students about: "${selectedMaterial.name}".`
          }]
        })
      });

      const data = await response.json();
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid format');
      const quizData = JSON.parse(jsonMatch[0]);
      if (!quizData.questions || quizData.questions.length === 0) throw new Error('No questions');

      const newQuiz = {
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        questions: quizData.questions,
        questionType: questionType,
        questionCount: quizData.questions.length,
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        attempts: 0,
        isMock: false
      };

      const docRef = await addDoc(collection(db, 'quizzes'), newQuiz);
      setPreviewQuiz({ id: docRef.id, ...newQuiz });
      setPreviewModal(true);
      loadQuizzes();

    } catch (error) {
      console.log('Quiz error:', error);
      Alert.alert('Error', 'Could not generate quiz. Please try again.');
    }
    setGeneratingQuiz(null);
  }

  async function handleLogout() {
    await signOut(auth);
    navigation.replace('Login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Faculty Dashboard</Text>
          <Text style={styles.email}>{auth.currentUser?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setUploadModal(true)}>
          <Text style={styles.uploadTxt}>+ Add Material</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportsBtn}
          onPress={() => navigation.navigate('ClassReports')}>
          <Text style={styles.reportsBtnTxt}>Class Reports</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'materials' && styles.tabActive]}
          onPress={() => setActiveTab('materials')}>
          <Text style={[styles.tabTxt, activeTab === 'materials' && styles.tabTxtActive]}>
            Materials ({materials.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quizzes' && styles.tabActive]}
          onPress={() => setActiveTab('quizzes')}>
          <Text style={[styles.tabTxt, activeTab === 'quizzes' && styles.tabTxtActive]}>
            Quizzes ({quizzes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'materials' && (
        loadingMaterials ? (
          <ActivityIndicator color="#185FA5" style={{ marginTop: 40 }} />
        ) : materials.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No materials added yet</Text>
            <Text style={styles.emptySubText}>Tap "+ Add Material" to get started</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {materials.map((item) => {
              const linkedModel = item.modelId
                ? DENTAL_MODELS.find(m => m.id === item.modelId)
                : null;
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
                      <Text style={styles.typeTxt}>{getTypeLabel(item.type)}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.cardDate}>
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </Text>
                      {item.url ? (
                        <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                          <Text style={styles.viewLink}>View file →</Text>
                        </TouchableOpacity>
                      ) : null}
                      {linkedModel && (
                        <View style={styles.modelLinkedBadge}>
                          <Text style={styles.modelLinkedTxt}>
                            🦷 {linkedModel.title}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    {generatingQuiz === item.id ? (
                      <ActivityIndicator size="small" color="#0f6e56" />
                    ) : ['pdf', 'ppt'].includes(item.type) ? (
                      <TouchableOpacity
                        style={styles.quizBtn}
                        onPress={() => openQuizModal(item)}>
                        <Text style={styles.quizBtnTxt}>Quiz</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.viewOnlyBadge}>
                        <Text style={styles.viewOnlyTxt}>View</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteMaterial(item)}>
                      <Text style={styles.deleteBtnTxt}>Del</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )
      )}

      {activeTab === 'quizzes' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {quizzes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No quizzes generated yet</Text>
              <Text style={styles.emptySubText}>Go to Materials and tap Quiz button</Text>
            </View>
          ) : (
            quizzes.map((quiz) => (
              <View key={quiz.id} style={styles.quizCard}>
                <View style={styles.cardLeft}>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: quiz.questionType === 'mcq' ? '#7F77DD' : '#0f6e56' }
                  ]}>
                    <Text style={styles.typeTxt}>
                      {quiz.questionType === 'mcq' ? 'MCQ' : 'T/F'}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {quiz.materialName}
                    </Text>
                    <Text style={styles.cardDate}>
                      {quiz.questionCount} questions • {quiz.attempts || 0} attempts
                    </Text>
                    <Text style={styles.cardDate}>
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() => navigation.navigate('QuizDetail', { quiz })}>
                    <Text style={styles.previewBtnTxt}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteQuiz(quiz)}>
                    <Text style={styles.deleteBtnTxt}>Del</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <Modal
        visible={uploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Material</Text>
              <Text style={styles.modalLabel}>Material Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Lecture 1 - Mandibular First Molar"
                value={materialName}
                onChangeText={setMaterialName}
              />
              <Text style={styles.modalLabel}>File Type</Text>
              <View style={styles.typeRow}>
                {['pdf', 'ppt', 'video', 'audio'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, materialType === t && styles.typeBtnActive]}
                    onPress={() => setMaterialType(t)}>
                    <Text style={[styles.typeBtnTxt, materialType === t && styles.typeBtnTxtActive]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.modalLabel}>Google Drive Link</Text>
              <TouchableOpacity
                style={styles.openDriveBtn}
                onPress={() => Linking.openURL('https://drive.google.com')}>
                <Text style={styles.openDriveTxt}>Open Google Drive →</Text>
              </TouchableOpacity>
              <Text style={styles.modalHint}>
                Upload file → right click → Share → Copy link → paste below
              </Text>
              <TextInput
                style={[styles.textInput, { height: 80 }]}
                placeholder="https://drive.google.com/..."
                value={driveLink}
                onChangeText={setDriveLink}
                multiline={true}
                autoCapitalize="none"
              />

              {/* NEW: 3D Model dropdown */}
              <Text style={styles.modalLabel}>Link a 3D Model (optional)</Text>
              <Text style={styles.modalHint}>
                Students will see a "View 3D" button alongside this material
              </Text>
              <View style={styles.modelOptionsBox}>
                <TouchableOpacity
                  style={[styles.modelOption, !linkedModelId && styles.modelOptionActive]}
                  onPress={() => setLinkedModelId(null)}>
                  <Text style={[styles.modelOptionTxt, !linkedModelId && styles.modelOptionTxtActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {DENTAL_MODELS.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modelOption, linkedModelId === m.id && styles.modelOptionActive]}
                    onPress={() => setLinkedModelId(m.id)}>
                    <Text style={[
                      styles.modelOptionTxt,
                      linkedModelId === m.id && styles.modelOptionTxtActive
                    ]}>
                      🦷 {m.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.generateBtn, saving && { backgroundColor: '#9ca3af' }]}
                onPress={saveMaterial}
                disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.generateBtnTxt}>Save Material</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setUploadModal(false); resetUploadModal(); }}>
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={quizModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setQuizModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Quiz Settings</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {selectedMaterial?.name}
            </Text>
            <Text style={styles.modalLabel}>Question Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, { flex: 1 }, questionType === 'mcq' && styles.typeBtnActive]}
                onPress={() => setQuestionType('mcq')}>
                <Text style={[styles.typeBtnTxt, questionType === 'mcq' && styles.typeBtnTxtActive]}>
                  Multiple Choice
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, { flex: 1 }, questionType === 'truefalse' && styles.typeBtnActive]}
                onPress={() => setQuestionType('truefalse')}>
                <Text style={[styles.typeBtnTxt, questionType === 'truefalse' && styles.typeBtnTxtActive]}>
                  True / False
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Number of Questions (1–50)</Text>
            <TextInput
              style={styles.countInput}
              value={questionCount}
              onChangeText={setQuestionCount}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="5"
            />
            <View style={styles.presetRow}>
              {['5', '10', '15', '20'].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.presetBtn, questionCount === n && styles.presetBtnActive]}
                  onPress={() => setQuestionCount(n)}>
                  <Text style={[styles.presetTxt, questionCount === n && styles.presetTxtActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.generateBtn} onPress={generateQuiz}>
              <Text style={styles.generateBtnTxt}>
                Generate {questionCount || '?'} {questionType === 'mcq' ? 'MCQ' : 'True/False'} Questions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setQuizModal(false)}>
              <Text style={styles.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={previewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPreviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Quiz Generated!</Text>
            <Text style={styles.modalSubtitle}>
              {previewQuiz?.questionCount} questions for "{previewQuiz?.materialName}"
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {previewQuiz?.questions?.map((q, i) => (
                <View key={i} style={styles.previewCard}>
                  <Text style={styles.previewQ}>Q{i + 1}. {q.question}</Text>
                  {previewQuiz.questionType === 'mcq' ? (
                    q.options?.map((opt, j) => (
                      <Text key={j} style={[
                        styles.previewOpt,
                        j === q.correct && { color: '#0f6e56', fontWeight: '600' }
                      ]}>
                        {j === q.correct ? '✓ ' : '  '}{opt}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.previewOpt}>
                      Answer: {q.correct ? 'True' : 'False'}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => setPreviewModal(false)}>
              <Text style={styles.generateBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 56 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 16
  },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#185FA5' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#fee2e2', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 8
  },
  logoutTxt: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  actionRow: {
    flexDirection: 'row', marginHorizontal: 20,
    marginBottom: 16, gap: 12
  },
  uploadBtn: {
    flex: 1, backgroundColor: '#185FA5', padding: 14,
    borderRadius: 12, alignItems: 'center'
  },
  uploadTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reportsBtn: {
    flex: 1, backgroundColor: '#fff', padding: 14,
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#185FA5'
  },
  reportsBtnTxt: { color: '#185FA5', fontSize: 14, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4
  },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabTxt: { fontSize: 14, color: '#888', fontWeight: '500' },
  tabTxtActive: { color: '#185FA5', fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '500' },
  emptySubText: {
    fontSize: 13, color: '#aaa', marginTop: 6,
    textAlign: 'center', paddingHorizontal: 40
  },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 20, marginBottom: 12, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#e5e7eb', justifyContent: 'space-between'
  },
  quizCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 20, marginBottom: 12, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#e5e7eb', justifyContent: 'space-between'
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  typeBadge: {
    width: 48, height: 48, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  typeTxt: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  cardDate: { fontSize: 12, color: '#888', marginBottom: 2 },
  viewLink: { fontSize: 12, color: '#185FA5', fontWeight: '500' },
  modelLinkedBadge: {
    backgroundColor: '#f0fdf9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#0f6e56'
  },
  modelLinkedTxt: { fontSize: 11, color: '#0f6e56', fontWeight: '600' },
  cardActions: { flexDirection: 'column', alignItems: 'center', gap: 6 },
  quizBtn: {
    backgroundColor: '#0f6e56', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 8, minWidth: 48, alignItems: 'center'
  },
  quizBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
  previewBtn: {
    backgroundColor: '#7F77DD', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 8, minWidth: 48, alignItems: 'center'
  },
  previewBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: '#fee2e2', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 8, minWidth: 48, alignItems: 'center'
  },
  deleteBtnTxt: { color: '#dc2626', fontSize: 11, fontWeight: '600' },
  viewOnlyBadge: {
    backgroundColor: '#fef3c7', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 8, minWidth: 48, alignItems: 'center'
  },
  viewOnlyTxt: { color: '#854F0B', fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  modalHint: { fontSize: 12, color: '#888', marginBottom: 8 },
  openDriveBtn: {
    backgroundColor: '#e6f1fb', padding: 12,
    borderRadius: 10, marginBottom: 8, alignItems: 'center'
  },
  openDriveTxt: { color: '#185FA5', fontWeight: '600', fontSize: 13 },
  textInput: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1a1a1a', marginBottom: 16
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center'
  },
  typeBtnActive: { borderColor: '#185FA5', backgroundColor: '#e6f1fb' },
  typeBtnTxt: { fontSize: 13, color: '#888', fontWeight: '500' },
  typeBtnTxtActive: { color: '#185FA5', fontWeight: '700' },
  modelOptionsBox: {
    gap: 8,
    marginBottom: 16
  },
  modelOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff'
  },
  modelOptionActive: {
    borderColor: '#0f6e56',
    backgroundColor: '#f0fdf9'
  },
  modelOptionTxt: { fontSize: 13, color: '#444', fontWeight: '500' },
  modelOptionTxtActive: { color: '#0f6e56', fontWeight: '700' },
  countInput: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 14, fontSize: 18, fontWeight: '600', color: '#1a1a1a',
    marginBottom: 12, textAlign: 'center'
  },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  presetBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center'
  },
  presetBtnActive: { borderColor: '#185FA5', backgroundColor: '#e6f1fb' },
  presetTxt: { fontSize: 14, color: '#888', fontWeight: '500' },
  presetTxtActive: { color: '#185FA5', fontWeight: '700' },
  generateBtn: {
    backgroundColor: '#185FA5', padding: 16,
    borderRadius: 12, alignItems: 'center', marginBottom: 12
  },
  generateBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelBtn: {
    padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb'
  },
  cancelBtnTxt: { color: '#888', fontSize: 15, fontWeight: '500' },
  previewCard: {
    backgroundColor: '#f8fafc', borderRadius: 10,
    padding: 12, marginBottom: 10
  },
  previewQ: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  previewOpt: { fontSize: 13, color: '#888', marginBottom: 4 }
});
