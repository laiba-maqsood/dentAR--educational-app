import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking, Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// ============================================================
// 3D MODELS — bundled .glb for offline 3D, GitHub URLs for AR
// ============================================================
const GITHUB_BASE = 'https://raw.githubusercontent.com/laiba-maqsood/dentar-models/main';

export const DENTAL_MODELS = [
  {
    id: 'mouth',
    title: 'Full Mouth (Detailed)',
    description: 'Complete oral cavity showing upper and lower dental arches with gingiva.',
    topics: ['mouth', 'oral', 'cavity', 'general', 'anatomy', 'overview', 'arch'],
    color: '#0f6e56',
    assetModule: require('../assets/models/human_mouth_detailed.glb'),
    arUrl: `${GITHUB_BASE}/human_mouth_detailed.glb`,
    hotspots: [
      { name: 'Upper Arch', position: '0 0.3 0', normal: '0 1 0', desc: 'The maxillary dental arch — upper teeth anchored in the maxilla bone.' },
      { name: 'Lower Arch', position: '0 -0.3 0', normal: '0 -1 0', desc: 'The mandibular dental arch — lower teeth anchored in the mandible.' },
      { name: 'Gingiva', position: '0.4 0 0.2', normal: '1 0 0', desc: 'The gum tissue surrounding and supporting the teeth.' }
    ]
  },
  {
    id: 'mandible',
    title: 'Mandible (Lower Jaw)',
    description: 'Lower jaw bone with full dental arch. Useful for studying TMJ, occlusion and bone landmarks.',
    topics: ['mandible', 'jaw', 'tmj', 'occlusion', 'bone', 'arch', 'mental foramen'],
    color: '#185FA5',
    assetModule: require('../assets/models/mandible.glb'),
    arUrl: `${GITHUB_BASE}/mandible.glb`,
    hotspots: [
      { name: 'Body of Mandible', position: '0 0 0.2', normal: '0 0 1', desc: 'The horizontal portion that holds the lower teeth.' },
      { name: 'Ramus', position: '0.5 0.2 0', normal: '1 0 0', desc: 'The vertical portion rising up to articulate with the skull at the TMJ.' },
      { name: 'Condyle', position: '0.5 0.5 0', normal: '0 1 0', desc: 'The rounded process that articulates with the temporal bone forming the TMJ.' }
    ]
  },
  {
    id: 'molar',
    title: 'Mandibular First Molar',
    description: 'Lower first molar showing crown morphology, cusps, and root structure. Workhorse of mastication.',
    topics: ['molar', 'mandibular', 'cusp', 'occlusal', 'crown', 'root', 'mastication'],
    color: '#854F0B',
    assetModule: require('../assets/models/mandibular_first_molar.glb'),
    arUrl: `${GITHUB_BASE}/mandibular_first_molar.glb`,
    hotspots: [
      { name: 'Mesiobuccal Cusp', position: '-0.2 0.5 0.2', normal: '0 1 0', desc: 'The largest cusp on the buccal (cheek) side, mesial half.' },
      { name: 'Occlusal Surface', position: '0 0.5 0', normal: '0 1 0', desc: 'The chewing surface with cusps, fossae and developmental grooves.' },
      { name: 'Mesial Root', position: '-0.15 -0.4 0', normal: '-1 -1 0', desc: 'Mandibular molars typically have two roots: mesial and distal.' },
      { name: 'Distal Root', position: '0.15 -0.4 0', normal: '1 -1 0', desc: 'The distal root, usually shorter and straighter than the mesial.' }
    ]
  },
  {
    id: 'incisor',
    title: 'Mandibular Central Incisor',
    description: 'Lower central incisor — the smallest tooth in the permanent dentition. Used for biting and cutting.',
    topics: ['incisor', 'central', 'mandibular', 'anterior', 'biting', 'crown'],
    color: '#7F77DD',
    assetModule: require('../assets/models/mandibular_left_central_incisor.glb'),
    arUrl: `${GITHUB_BASE}/mandibular_left_central_incisor.glb`,
    hotspots: [
      { name: 'Incisal Edge', position: '0 0.6 0', normal: '0 1 0', desc: 'The cutting edge used for biting through food.' },
      { name: 'Labial Surface', position: '0 0.2 0.2', normal: '0 0 1', desc: 'The smooth facial surface visible when smiling.' },
      { name: 'Single Root', position: '0 -0.5 0', normal: '0 -1 0', desc: 'Incisors have one slim, conical root.' }
    ]
  },
  {
    id: 'canine',
    title: 'Maxillary Canine',
    description: 'Upper canine — longest tooth in the dental arch. Plays a key role in canine guidance during lateral movements.',
    topics: ['canine', 'maxillary', 'cuspid', 'anterior', 'guidance', 'tearing'],
    color: '#993556',
    assetModule: require('../assets/models/maxillary_canine.glb'),
    arUrl: `${GITHUB_BASE}/maxillary_canine.glb`,
    hotspots: [
      { name: 'Cusp Tip', position: '0 0.7 0', normal: '0 1 0', desc: 'The single pointed cusp — used for tearing food.' },
      { name: 'Cingulum', position: '0 0.1 -0.2', normal: '0 0 -1', desc: 'A bulge on the lingual surface near the cervix.' },
      { name: 'Long Root', position: '0 -0.6 0', normal: '0 -1 0', desc: 'The longest root in the dentition — provides excellent stability.' }
    ]
  }
];

export function getModelById(id) {
  return DENTAL_MODELS.find(m => m.id === id);
}

function buildModelViewerHTML(base64Data, model) {
  const dataUri = `data:model/gltf-binary;base64,${base64Data}`;

  const hotspotMarkup = model.hotspots.map((h, i) => `
    <button class="hotspot" slot="hotspot-${i}"
            data-position="${h.position}"
            data-normal="${h.normal}"
            data-visibility-attribute="visible"
            onclick="showLabel('${h.name.replace(/'/g, "\\'")}', \`${h.desc.replace(/`/g, '\\`')}\`)">
      <div class="hotspot-dot"></div>
      <div class="hotspot-label">${h.name}</div>
    </button>
  `).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; overflow: hidden; background: #1a1a2e; font-family: -apple-system, sans-serif; }
  model-viewer {
    width: 100%; height: 100%;
    background: linear-gradient(180deg, #1a1a2e 0%, #2d2d4a 100%);
    --poster-color: transparent;
  }
  .hotspot {
    background: transparent; border: none; padding: 0;
    cursor: pointer; display: flex; flex-direction: column; align-items: center;
  }
  .hotspot-dot {
    width: 18px; height: 18px; border-radius: 50%;
    background: #0f6e56; border: 3px solid #fff;
    box-shadow: 0 0 0 2px rgba(15,110,86,0.4), 0 2px 6px rgba(0,0,0,0.5);
    animation: pulse 2s infinite;
  }
  .hotspot-label {
    margin-top: 4px; background: rgba(15,110,86,0.95);
    color: #fff; padding: 3px 8px; border-radius: 6px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
  }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
  #info-panel {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: rgba(255,255,255,0.97); padding: 14px 18px;
    transform: translateY(100%); transition: transform 0.3s ease;
    border-top-left-radius: 16px; border-top-right-radius: 16px;
    box-shadow: 0 -4px 16px rgba(0,0,0,0.2);
  }
  #info-panel.visible { transform: translateY(0); }
  #info-title { font-size: 15px; font-weight: 700; color: #0f6e56; margin-bottom: 6px; }
  #info-text { font-size: 13px; color: #444; line-height: 19px; }
  #info-close {
    position: absolute; top: 8px; right: 12px;
    background: transparent; border: none; font-size: 22px;
    color: #888; cursor: pointer; line-height: 1;
  }
  #status {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: #fff; font-size: 14px; text-align: center;
    padding: 0 20px;
  }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 1s linear infinite; margin: 0 auto 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #ar-prompt {
    position: absolute; top: 12px; right: 12px;
    background: rgba(15,110,86,0.95); color: #fff;
    padding: 10px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
    border: none; cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    z-index: 100;
  }
  .Hotspot[data-visible='false'] { opacity: 0; pointer-events: none; }
</style>
</head>
<body>
<div id="status">
  <div class="spinner"></div>
  <div id="status-text">Loading 3D model...</div>
</div>

<model-viewer
  id="viewer"
  src="${dataUri}"
  alt="${model.title}"
  camera-controls
  touch-action="pan-y"
  auto-rotate
  auto-rotate-delay="3000"
  rotation-per-second="20deg"
  shadow-intensity="1"
  exposure="1.1"
  environment-image="neutral"
  style="display:none">
  ${hotspotMarkup}
</model-viewer>

<button id="ar-prompt" onclick="launchAR()">📱 View in your room (AR)</button>

<div id="info-panel">
  <button id="info-close" onclick="hideLabel()">×</button>
  <div id="info-title"></div>
  <div id="info-text"></div>
</div>

<script>
  const viewer = document.getElementById('viewer');
  const status = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const panel = document.getElementById('info-panel');
  const titleEl = document.getElementById('info-title');
  const textEl = document.getElementById('info-text');

  viewer.addEventListener('load', () => {
    viewer.style.display = 'block';
    status.style.display = 'none';
  });

  viewer.addEventListener('error', (e) => {
    statusText.innerHTML = '<div style="color:#fca5a5;">Failed to load model.</div>';
    status.querySelector('.spinner').style.display = 'none';
  });

  setTimeout(() => {
    if (status.style.display !== 'none') {
      viewer.style.display = 'block';
      status.style.display = 'none';
    }
  }, 15000);

  function showLabel(name, desc) {
    titleEl.textContent = name;
    textEl.textContent = desc;
    panel.classList.add('visible');
  }
  function hideLabel() { panel.classList.remove('visible'); }

  // Send AR launch request to React Native, which will use Linking to open Scene Viewer
  function launchAR() {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'launchAR',
        url: '${model.arUrl}',
        title: '${model.title.replace(/'/g, "\\'")}'
      }));
    }
  }
</script>
</body>
</html>`;
}

export default function ARViewerScreen({ navigation, route }) {
  const directModelId = route?.params?.modelId;
  const directModel = directModelId ? getModelById(directModelId) : null;

  const [selectedModel, setSelectedModel] = useState(directModel);
  const [modelHTML, setModelHTML] = useState(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const topicHint = (route?.params?.topic || '').toLowerCase();

  function getRecommended() {
    if (!topicHint) return null;
    return DENTAL_MODELS.find(m =>
      m.topics.some(t => topicHint.includes(t) || t.includes(topicHint))
    );
  }

  const recommended = getRecommended();

  useEffect(() => {
    let cancelled = false;
    async function loadModelAsBase64() {
      if (!selectedModel) return;
      setLoadingAsset(true);
      setLoadError(null);
      setModelHTML(null);
      try {
        const asset = Asset.fromModule(selectedModel.assetModule);
        await asset.downloadAsync();

        const localUri = asset.localUri || asset.uri;
        if (!localUri) throw new Error('Could not resolve asset URI');

        const base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (cancelled) return;

        const html = buildModelViewerHTML(base64, selectedModel);
        setModelHTML(html);
      } catch (e) {
        console.log('Model load error:', e);
        if (!cancelled) setLoadError(e.message || 'Failed to load model');
      } finally {
        if (!cancelled) setLoadingAsset(false);
      }
    }
    loadModelAsBase64();
    return () => { cancelled = true; };
  }, [selectedModel]);

  // Build a Scene Viewer intent URL for Android — opens the system AR app
  function buildSceneViewerIntent(modelUrl, title) {
    const encodedUrl = encodeURIComponent(modelUrl);
    const encodedTitle = encodeURIComponent(title);
    return `intent://arvr.google.com/scene-viewer/1.0?file=${encodedUrl}&mode=ar_preferred&title=${encodedTitle}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodedUrl};end;`;
  }

  // Handle AR launch request from WebView
  async function handleWebViewMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'launchAR') {
        const intentUrl = buildSceneViewerIntent(data.url, data.title);
        const supported = await Linking.canOpenURL(intentUrl);
        if (supported) {
          await Linking.openURL(intentUrl);
        } else {
          // Fallback: try opening the model URL directly
          Alert.alert(
            'AR Not Available',
            'Your device may not support AR, or Google Play Services for AR is not installed.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Install AR Services',
                onPress: () => Linking.openURL('market://details?id=com.google.ar.core')
              }
            ]
          );
        }
      }
    } catch (e) {
      console.log('WebView message error:', e);
    }
  }

  function openModel(model) {
    setModelHTML(null);
    setLoadError(null);
    setSelectedModel(model);
  }

  function closeModel() {
    if (directModelId) {
      navigation.goBack();
      return;
    }
    setSelectedModel(null);
    setModelHTML(null);
    setLoadError(null);
  }

  if (selectedModel) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={closeModel}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedModel.title}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.webViewWrap}>
          {modelHTML && !loadingAsset ? (
            <WebView
              style={styles.webView}
              originWhitelist={['*', 'intent://*', 'market://*']}
              source={{ html: modelHTML }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="always"
              scalesPageToFit={false}
              scrollEnabled={false}
              androidLayerType="hardware"
              onMessage={handleWebViewMessage}
              onShouldStartLoadWithRequest={(request) => {
                // Block any intent:// or market:// URL from loading inside WebView
                // (we handle these via postMessage instead)
                if (request.url.startsWith('intent://') ||
                    request.url.startsWith('market://') ||
                    request.url.startsWith('https://arvr.google.com')) {
                  return false;
                }
                return true;
              }}
            />
          ) : loadError ? (
            <View style={styles.webViewLoader}>
              <Text style={styles.errorTxt}>⚠ Could not load model</Text>
              <Text style={styles.loaderTxt}>{loadError}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => openModel(selectedModel)}>
                <Text style={styles.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loaderTxt}>Preparing 3D model...</Text>
              <Text style={styles.loaderHint}>Larger models may take a few seconds</Text>
            </View>
          )}
        </View>

        <View style={styles.modelInfoBar}>
          <Text style={styles.modelInfoTxt}>{selectedModel.description}</Text>
          <Text style={styles.controlHint}>
            Drag to rotate • Pinch to zoom • Tap green dots for labels • Tap "View in AR" to place in your room
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>3D / AR Viewer</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Interactive 3D & AR</Text>
          <Text style={styles.introSub}>
            Explore real dental anatomy in 3D. Place models in your real environment using AR.
          </Text>
        </View>

        {recommended && (
          <>
            <Text style={styles.sectionTitle}>Recommended for your topic</Text>
            <TouchableOpacity
              style={[styles.modelCard, styles.modelCardRecommended]}
              onPress={() => openModel(recommended)}>
              <View style={[styles.modelIcon, { backgroundColor: recommended.color }]}>
                <Text style={styles.modelIconTxt}>3D</Text>
              </View>
              <View style={styles.modelInfo}>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeTxt}>Recommended</Text>
                </View>
                <Text style={styles.modelTitle}>{recommended.title}</Text>
                <Text style={styles.modelDesc} numberOfLines={2}>
                  {recommended.description}
                </Text>
              </View>
              <Text style={styles.openTxt}>Open →</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionTitle}>All 3D Models</Text>

        {DENTAL_MODELS.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={styles.modelCard}
            onPress={() => openModel(model)}>
            <View style={[styles.modelIcon, { backgroundColor: model.color }]}>
              <Text style={styles.modelIconTxt}>3D</Text>
            </View>
            <View style={styles.modelInfo}>
              <Text style={styles.modelTitle}>{model.title}</Text>
              <Text style={styles.modelDesc} numberOfLines={2}>
                {model.description}
              </Text>
              <View style={styles.topicsRow}>
                {model.topics.slice(0, 3).map(t => (
                  <View key={t} style={styles.topicPill}>
                    <Text style={styles.topicPillTxt}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.openTxt}>Open →</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>About 3D & AR</Text>
          <Text style={styles.noteTxt}>
            3D viewing works fully offline. To place a model in your real environment,
            tap "View in AR" — this requires internet (one-time download per model)
            and Google Play Services for AR (auto-prompted on first use).
          </Text>
        </View>

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
  backTxt: { color: '#0f6e56', fontSize: 16, width: 60 },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#1a1a1a',
    flex: 1, textAlign: 'center'
  },
  webViewWrap: { flex: 1, backgroundColor: '#1a1a2e', position: 'relative' },
  webView: { flex: 1, backgroundColor: '#1a1a2e' },
  webViewLoader: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1a1a2e', padding: 24
  },
  loaderTxt: { color: '#fff', marginTop: 12, fontSize: 13, textAlign: 'center' },
  loaderHint: { color: '#888', marginTop: 4, fontSize: 11, textAlign: 'center' },
  errorTxt: { color: '#fca5a5', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  retryBtn: {
    backgroundColor: '#0f6e56', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 8, marginTop: 16
  },
  retryTxt: { color: '#fff', fontWeight: '600' },
  modelInfoBar: {
    backgroundColor: '#fff', padding: 16,
    borderTopWidth: 0.5, borderTopColor: '#e5e7eb'
  },
  modelInfoTxt: { fontSize: 13, color: '#444', lineHeight: 20, marginBottom: 6 },
  controlHint: { fontSize: 11, color: '#0f6e56', fontWeight: '500', lineHeight: 16 },
  introCard: {
    backgroundColor: '#0f6e56', marginHorizontal: 20,
    borderRadius: 16, padding: 20, marginBottom: 20
  },
  introTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  introSub: { fontSize: 14, color: '#e8f5f0', lineHeight: 22 },
  sectionTitle: {
    fontSize: 15, color: '#888', fontWeight: '600',
    paddingHorizontal: 20, marginBottom: 12
  },
  modelCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 20, marginBottom: 12, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  modelCardRecommended: { borderColor: '#0f6e56', borderWidth: 1.5, backgroundColor: '#f0fdf9' },
  modelIcon: {
    width: 52, height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 14
  },
  modelIconTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modelInfo: { flex: 1 },
  recommendedBadge: {
    backgroundColor: '#0f6e56', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6
  },
  recommendedBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '600' },
  modelTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  modelDesc: { fontSize: 12, color: '#888', lineHeight: 18, marginBottom: 8 },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  topicPillTxt: { fontSize: 10, color: '#888' },
  openTxt: { fontSize: 14, color: '#0f6e56', fontWeight: '600', marginLeft: 8 },
  noteCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12,
    padding: 16, marginTop: 8, borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  noteTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  noteTxt: { fontSize: 13, color: '#888', lineHeight: 20 }
});
