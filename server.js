const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// UTIC API 설정
const UTIC_API_KEY = 'spdYlAuDpMu815Bqun6bM4xMjg7gBtVChlcFWMEUGqDvbRRDx9OSu8n2gXlrj3';
const UTIC_HEADERS = {
  'Referer': 'https://www.utic.go.kr/guide/cctvOpenData.do',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
};

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// =============================================================================
// 스트리밍 URL 패턴 매핑
// =============================================================================
const streamPatterns = {
  'KBS': {
    type: 'HLS',
    getUrl: (cctv) => {
      // 토큰 기반 - 현재 토큰 사용 (실시간 생성은 추가 로직 필요)
      return `https://kakaocctv-cache.loomex.net/lowStream/_definst_/${cctv.CCTVIP}_low.stream/playlist.m3u8`;
    }
  },
  
  '거제': {
    type: 'HLS',
    getUrl: (cctv) => `http://${cctv.ID}.streamlock.net/live/smartvideo${cctv.PASSWD}.stream/playlist.m3u8`
  },
  
  '경산': {
    type: 'HLS',
    getUrl: (cctv) => `http://27.101.20.112:1935/live/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '경주': {
    type: 'HLS',
    getUrl: (cctv) => `https://streamits.gyeongju.go.kr:1935/live/live${cctv.CH}.stream/playlist.m3u8`
  },
  
  '고양': {
    type: 'MP4_SEGMENT',
    getUrl: (cctv) => null // WebView로만 재생
  },
  
  '광양': {
    type: 'HLS',
    getUrl: (cctv) => {
      const paddedId = String(cctv.ID).padStart(3, '0');
      return `http://121.179.236.148:1935/gy_wowza/site${paddedId}.stream/playlist.m3u8`;
    }
  },
  
  '광주': {
    type: 'HLS',
    getUrl: (cctv) => `https://gjtic.go.kr/cctv${cctv.CH}/livehttp/${cctv.ID}_video2/chunklist.m3u8`
  },
  
  '구미': {
    type: 'HLS',
    getUrl: (cctv) => `https://its.gumi.go.kr:9443/live/video${cctv.CCTVIP}.stream/playlist.m3u8`
  },
  
  '금강': {
    type: 'HLS',
    getUrl: (cctv) => `https://cctvlo.geumriver.go.kr/live/cctv${cctv.ID}/hls.m3u8`
  },
  
  '김해': {
    type: 'HLS',
    getUrl: (cctv) => `https://its.gimhae.go.kr:1443/live/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '낙동강': {
    type: 'HLS',
    getUrl: (cctv) => `https://cctvlo.nakdongriver.go.kr/live/cctv${cctv.ID}/hls.m3u8`
  },
  
  '남양주': {
    type: 'HLS',
    getUrl: (cctv) => `https://${cctv.CCTVIP}/media/${cctv.ID}/chunklist.m3u8`
  },
  
  '대구': {
    type: 'HLS',
    getUrl: (cctv) => `https://carcctv.daegu.go.kr/live3/_definst_/ch${cctv.CH}.stream/playlist.m3u8`
  },
  
  '대전': {
    type: 'MP4_SEGMENT',
    getUrl: (cctv) => null // WebView로만 재생
  },
  
  '목포': {
    type: 'HLS',
    getUrl: (cctv) => `https://itslive.mokpo.go.kr/live/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '부산': {
    type: 'HLS',
    getUrl: (cctv) => `http://61.43.246.${cctv.CCTVIP}:1935/rtplive/cctv_${cctv.CH}.stream/playlist.m3u8`
  },
  
  '부천': {
    type: 'HLS',
    getUrl: (cctv) => `https://stream${cctv.CH}.bcits.go.kr/bucheon/${cctv.CCTVIP}.stream/playlist.m3u8`
  },
  
  '서울': {
    type: 'HLS',
    getUrl: (cctv) => `http://210.179.218.${cctv.CH}:1935/live/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '수원': {
    type: 'HLS',
    getUrl: (cctv) => `http://${cctv.CCTVIP}:2935/live/${cctv.ID}s.stream/playlist.m3u8`
  },
  
  '아산': {
    type: 'HLS',
    getUrl: (cctv) => `http://59.27.229.${cctv.CCTVIP}:1935/live/CCTV_${cctv.ID}.stream/playlist.m3u8`
  },
  
  '양산': {
    type: 'HLS',
    getUrl: (cctv) => `http://114.53.252.3:1935/live/mp4:CCTV${cctv.ID}.stream/playlist.m3u8`
  },
  
  '영산강': {
    type: 'HLS',
    getUrl: (cctv) => `https://cctvlo.yeongsanriver.go.kr/live/cctv${cctv.ID}/hls.m3u8`
  },
  
  '용인': {
    type: 'HLS',
    getUrl: (cctv) => `http://211.249.12.147:1935/live/video${cctv.CH}.stream/playlist.m3u8`
  },
  
  '원주': {
    type: 'HLS',
    getUrl: (cctv) => `http://211.34.248.240:1935/live/${cctv.ID}.stream_160p/playlist.m3u8`
  },
  
  '인천': {
    type: 'HLS',
    getUrl: (cctv) => `http://61.40.94.13:1935/cctv/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '진주': {
    type: 'HLS',
    getUrl: (cctv) => `https://its.jinju.go.kr/its/cctv/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '창원': {
    type: 'HLS',
    getUrl: (cctv) => `http://210.95.69.${cctv.CCTVIP}:1935/live/video${cctv.CH}.stream/playlist.m3u8`
  },
  
  '천안': {
    type: 'HLS',
    getUrl: (cctv) => `http://${cctv.CCTVIP}:1935/live/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '파주': {
    type: 'HLS',
    getUrl: (cctv) => `https://trafficcctv.paju.go.kr/live/${cctv.ID}.stream/playlist.m3u8`
  },
  
  '포항': {
    type: 'HLS',
    getUrl: (cctv) => `https://wowza.pohang.go.kr/live/${cctv.CH}.stream/playlist.m3u8`
  },
  
  '한강': {
    type: 'HLS',
    getUrl: (cctv) => `https://lw.hrfco.go.kr/live/cctv${cctv.ID}/hls.m3u8`
  }
};

// =============================================================================
// ID 기반 프로토콜 결정
// =============================================================================
function getProtocol(id) {
  if (!id || id.length < 3) {
    return 'https';
  }
  
  const prefix = id.substring(0, 3);
  
  switch (prefix) {
    case 'E44':
    case 'E53':
    case 'L19':
    case 'E43':
    case 'L08': //용인
    case 'L24': //양산
    case 'L34': //원주
      return 'http';
    default:
      return 'https';
  }
}

// =============================================================================
// cctvStream.js와 동일한 KIND 결정 로직
// =============================================================================
function getCctvKind(cctvData) {
  const cctvId = cctvData.CCTVID;
  
  if (cctvId.substring(0, 3) === 'L01') {
    return 'Seoul';
  } else if (cctvId.substring(0, 3) === 'L02') {
    return 'N';
  } else if (cctvId.substring(0, 3) === 'L03') {
    return 'O';
  } else if (cctvId.substring(0, 3) === 'L04') {
    return 'P';
  } else if (cctvId.substring(0, 3) === 'L08') {
    return 'd';
  } else {
    return cctvData.KIND;
  }
}

// =============================================================================
// 메인 API: CCTV 메타데이터 + 비디오 URL (HLS 직접 URL 포함)
// =============================================================================
app.get('/api/cctv/:cctvId', async (req, res) => {
  try {
    const { cctvId } = req.params;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📡 메타데이터 요청: ${cctvId}`);
    console.log(`${'='.repeat(80)}`);
    
    const metadataUrl = `http://www.utic.go.kr/map/getCctvInfoById.do?cctvId=${cctvId}&key=${UTIC_API_KEY}`;
    
    console.log(`\n📤 [UTIC API 요청]`);
    console.log(`   URL: ${metadataUrl}`);
    
    const response = await axios.get(metadataUrl, {
      headers: UTIC_HEADERS,
      timeout: 15000,
      httpsAgent: httpsAgent
    });
    
    console.log(`\n📥 [UTIC API 응답]`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
    
    const cctvData = response.data;
    
    if (cctvData.msg && cctvData.code === '9999') {
      return res.status(403).json({
        success: false,
        error: '비정상적인 접근',
        cctvId: cctvId
      });
    }
    
    // KIND 결정
    const kind = getCctvKind(cctvData);
    
    // 프로토콜 결정
    const protocol = getProtocol(cctvData.CCTVID);
    
    console.log(`\n🔄 [KIND 및 프로토콜 결정]`);
    console.log(`   CCTVID: ${cctvData.CCTVID}`);
    console.log(`   원본 KIND: ${cctvData.KIND}`);
    console.log(`   보정 KIND: ${kind}`);
    console.log(`   프로토콜: ${protocol}`);
    
    // ⭐ 4대강 특별 처리
    const riverType = getRiverType(cctvData);
    let streamPageUrl;
    
    if (riverType) {
      streamPageUrl = buildRiverUrl(cctvData, riverType);
      console.log(`\n🌊 [4대강 CCTV 특별 처리]`);
      console.log(`   강 타입: ${riverType}`);
      console.log(`   센터명: ${cctvData.CENTERNAME}`);
      console.log(`   ID: ${cctvData.ID}`);
      console.log(`   PASSWD: ${cctvData.PASSWD}`);
    } else {
      streamPageUrl = buildStreamPageUrl(cctvData, kind, protocol);
    }
    
    console.log(`\n🌐 [WebView URL 생성]`);
    console.log(`   URL: ${streamPageUrl}`);
    
    // ⭐ 지역별 직접 스트리밍 URL 생성
    let directVideoUrl = null;
    let playerType = 'webview';
    let streamType = null;
    
    const pattern = streamPatterns[cctvData.CENTERNAME];
    
    if (pattern) {
      console.log(`\n🎬 [스트리밍 패턴 발견]`);
      console.log(`   지역: ${cctvData.CENTERNAME}`);
      console.log(`   타입: ${pattern.type}`);
      
      if (pattern.type === 'HLS') {
        try {
          directVideoUrl = pattern.getUrl(cctvData);
          playerType = 'exoplayer';
          streamType = 'HLS';
          console.log(`   ✅ HLS URL 생성: ${directVideoUrl}`);
        } catch (error) {
          console.log(`   ⚠️ HLS URL 생성 실패: ${error.message}`);
        }
      } else if (pattern.type === 'MP4_SEGMENT') {
        playerType = 'webview';
        streamType = 'MP4_SEGMENT';
        console.log(`   ⚠️ MP4 세그먼트 방식 - WebView 전용`);
      }
    } else {
      console.log(`\n⚠️ [스트리밍 패턴 없음]`);
      console.log(`   지역: ${cctvData.CENTERNAME}`);
      console.log(`   -> WebView로 폴백`);
    }
    
    console.log(`\n✅ ${cctvData.CCTVNAME} (${cctvData.CENTERNAME})`);
    console.log(`${'='.repeat(80)}\n`);
    
    res.json({
      success: true,
      cctvId: cctvId,
      name: cctvData.CCTVNAME,
      center: cctvData.CENTERNAME,
      location: {
        lat: cctvData.YCOORD,
        lng: cctvData.XCOORD
      },
      streamPageUrl: streamPageUrl,
      directVideoUrl: directVideoUrl,
      playerType: playerType,
      streamType: streamType,
      kind: kind,
      protocol: protocol,
      riverType: riverType
    });
    
  } catch (error) {
    console.error(`\n❌ [오류 발생]`);
    console.error(`   CCTV ID: ${req.params.cctvId}`);
    console.error(`   에러: ${error.message}`);
    console.error(`${'='.repeat(80)}\n`);
    
    res.status(500).json({
      success: false,
      error: error.message,
      cctvId: req.params.cctvId
    });
  }
});

// =============================================================================
// HELPER 함수들
// =============================================================================

// 4대강 CCTV 판별 및 타입 반환
function getRiverType(cctvData) {
  if (!cctvData.CENTERNAME) {
    return null;
  }
  
  if (cctvData.CENTERNAME.includes('한강')) {
    return 'hangang';
  } else if (cctvData.CENTERNAME.includes('낙동강')) {
    return 'nakdong';
  } else if (cctvData.CENTERNAME.includes('금강')) {
    return 'geum';
  } else if (cctvData.CENTERNAME.includes('영산강')) {
    return 'yeongsan';
  }
  
  return null;
}

// 4대강 전용 URL 생성
function buildRiverUrl(cctvData, riverType) {
  switch (riverType) {
    case 'hangang':
      return `http://hrfco.go.kr/sumun/cctvPopup.do?Obscd=${cctvData.ID || ''}`;
      
    case 'nakdong':
      return `https://www.nakdongriver.go.kr/sumun/popup/cctvView.do?Obscd=${cctvData.ID || ''}`;
      
    case 'geum':
      const wlobscd = cctvData.PASSWD || '';
      const cctvcd = cctvData.ID || '';
      return `https://www.geumriver.go.kr/html/sumun/rtmpView.jsp?wlobscd=${wlobscd}&cctvcd=${cctvcd}`;
      
    case 'yeongsan':
      return `https://www.yeongsanriver.go.kr/sumun/videoDetail.do?wlobscd=${cctvData.PASSWD || ''}`;
      
    default:
      return null;
  }
}

// 스트림 페이지 URL 생성 (UTIC 공식 패턴)
function buildStreamPageUrl(cctvData, kind, protocol) {
  const baseUrl = `${protocol}://www.utic.go.kr/jsp/map/openDataCctvStream.jsp`;
  
  const doubleEncode = (str) => {
    if (!str) return '';
    return encodeURIComponent(encodeURIComponent(str));
  };
  
  const getValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'undefined';
    }
    return value;
  };
  
  const params = [
    `key=${UTIC_API_KEY}`,
    `cctvid=${cctvData.CCTVID}`,
    `cctvName=${doubleEncode(cctvData.CCTVNAME)}`,
    `kind=${kind}`,
    `cctvip=${getValue(cctvData.CCTVIP)}`,
    `cctvch=${getValue(cctvData.CH)}`,
    `id=${getValue(cctvData.ID)}`,
    `cctvpasswd=${getValue(cctvData.PASSWD)}`,
    `cctvport=${getValue(cctvData.PORT)}`
  ];
  
  return `${baseUrl}?${params.join('&')}`;
}

// =============================================================================
// CORS 우회 프록시
// =============================================================================
app.get('/proxy/direct', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL 파라미터 필요' });
    }
    
    console.log(`📺 CORS 프록시: ${videoUrl}`);
    
    const response = await axios.get(videoUrl, {
      headers: {
        'User-Agent': UTIC_HEADERS['User-Agent'],
        'Referer': 'https://www.utic.go.kr/'
      },
      responseType: 'stream',
      httpsAgent: httpsAgent,
      timeout: 60000
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const contentType = response.headers['content-type'] || 'application/vnd.apple.mpegurl';
    res.setHeader('Content-Type', contentType);
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error(`❌ 프록시 오류:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.options('/proxy/direct', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

// =============================================================================
// 서버 정보
// =============================================================================
app.get('/', (req, res) => {
  res.json({
    message: 'UTIC CCTV 프록시 서버',
    version: '6.0.0 - HLS 직접 재생 지원',
    strategy: 'HLS Direct + WebView Fallback',
    changes: [
      '✅ 33개 지역 스트리밍 패턴 매핑 완료',
      '✅ HLS 방식: ExoPlayer로 직접 재생',
      '✅ MP4 세그먼트 방식: WebView 재생 (고양, 대전)',
      '✅ 4대강 CCTV: WebView 재생',
      '✅ 패턴 없는 지역: WebView 폴백',
      '✅ playerType 필드로 재생 방식 명시'
    ],
    endpoints: {
      'GET /api/cctv/:cctvId': 'CCTV 메타데이터 + 스트리밍 URL',
      'GET /proxy/direct?url=': 'CORS 우회 프록시'
    },
    supportedRegions: {
      HLS: Object.keys(streamPatterns).filter(k => streamPatterns[k].type === 'HLS'),
      MP4_SEGMENT: Object.keys(streamPatterns).filter(k => streamPatterns[k].type === 'MP4_SEGMENT'),
      totalRegions: Object.keys(streamPatterns).length
    }
  });
});

// =============================================================================
// 서버 시작
// =============================================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ==============================`);
  console.log(`🎯 UTIC CCTV 프록시 서버 시작!`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📦 Node.js: ${process.version}`);
  console.log(`✅ HLS 직접 재생: ${Object.keys(streamPatterns).filter(k => streamPatterns[k].type === 'HLS').length}개 지역`);
  console.log(`✅ MP4 세그먼트: ${Object.keys(streamPatterns).filter(k => streamPatterns[k].type === 'MP4_SEGMENT').length}개 지역`);
  console.log(`✅ 4대강 CCTV 지원 (한강/낙동강/금강/영산강)`);
  console.log(`===============================\n`);
});
