import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking, Alert
} from 'react-native';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { DENTAL_MODELS } from './ARViewerScreen';

export default function ReadModuleScreen({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      const snapshot = await getDocs(collection(db, 'materials'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterials(list);
    } catch (error) {
      console.log('Error:', error);
    }
    setLoading(false);
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

  function getTypeDescription(type) {
    switch (type) {
      case 'pdf': return 'PDF Document';
      case 'ppt': return 'Presentation';
      case 'video': return 'Video Lecture';
      case 'audio': return 'Audio Lecture';
      default: return 'File';
    }
  }

  function findModel(modelId) {
    return DENTAL_MODELS.find(m => m.id === modelId);
  }

  function openMaterial(item) {
    if (item.url) {
      Linking.openURL(item.url);
    } else {
      Alert.alert('No link', 'No file link available for this material.');
    }
  }

  function open3DModel(item) {
    navigation.navigate('ARViewer', { modelId: item.modelId });
  }

  const filters = ['all', 'pdf', 'ppt', 'video', 'audio'];

  const filteredMaterials = activeFilter === 'all'
    ? materials
    : materials.filter(m => m.type === activeFilter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Study Topics</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              activeFilter === f && styles.filterBtnActive
            ]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[
              styles.filterTxt,
              activeFilter === f && styles.filterTxtActive
            ]}>
              {f === 'all' ? 'All' : f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#0f6e56" style={{ marginTop: 40 }} />
      ) : filteredMaterials.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No materials yet</Text>
          <Text style={styles.emptySubText}>
            Your faculty will upload study materials here
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredMaterials.map((item) => {
            const linkedModel = item.modelId ? findModel(item.modelId) : null;
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(item.type) }
                  ]}>
                    <Text style={styles.typeTxt}>{getTypeLabel(item.type)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardType}>
                      {getTypeDescription(item.type)}
                    </Text>
                    <Text style={styles.cardDate}>
                      Added {new Date(item.uploadedAt).toLocaleDateString()}
                    </Text>
                    {linkedModel && (
                      <View style={styles.modelLinkedBadge}>
                        <Text style={styles.modelLinkedTxt}>
                          🦷 {linkedModel.title}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.openBtn}
                    onPress={() => openMaterial(item)}>
                    <Text style={styles.openBtnTxt}>Open {getTypeLabel(item.type)} →</Text>
                  </TouchableOpacity>

                  {linkedModel && (
                    <TouchableOpacity
                      style={styles.viewModelBtn}
                      onPress={() => open3DModel(item)}>
                      <Text style={styles.viewModelTxt}>🦷 View 3D</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    color: '#0f6e56',
    fontSize: 16,
    width: 60
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  filterRow: {
    marginBottom: 16,
    maxHeight: 44
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff'
  },
  filterBtnActive: {
    backgroundColor: '#0f6e56',
    borderColor: '#0f6e56'
  },
  filterTxt: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500'
  },
  filterTxtActive: {
    color: '#fff',
    fontWeight: '600'
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500'
  },
  emptySubText: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#e5e7eb'
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  typeBadge: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  typeTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10
  },
  cardInfo: {
    flex: 1
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4
  },
  cardType: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2
  },
  cardDate: {
    fontSize: 11,
    color: '#aaa'
  },
  modelLinkedBadge: {
    backgroundColor: '#f0fdf9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: '#0f6e56'
  },
  modelLinkedTxt: {
    fontSize: 11,
    color: '#0f6e56',
    fontWeight: '600'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8
  },
  openBtn: {
    flex: 1,
    backgroundColor: '#0f6e56',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  openBtnTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  viewModelBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0f6e56'
  },
  viewModelTxt: {
    color: '#0f6e56',
    fontSize: 13,
    fontWeight: '700'
  }
});
