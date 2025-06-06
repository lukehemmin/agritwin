# AgriTwin - 도심형 스마트 농장 디지털 트윈 시스템

AgriTwin은 도심형 스마트 농장을 위한 디지털 트윈 시스템입니다. 3D 시각화를 통해 다층 구조의 수직농장을 모델링하고, 실시간 센서 데이터를 모니터링하며, 데이터 분석을 통해 농장 운영을 최적화합니다.

## 🌟 주요 기능

- 🏢 **3D 농장 시각화**: Three.js를 이용한 다층 구조 수직농장 3D 모델링
- 📊 **실시간 모니터링**: 온도, 습도, 토양수분, 조도, CO2 센서 데이터 실시간 추적
- 📈 **데이터 분석**: 히스토리 데이터 분석 및 트렌드 예측
- 🔔 **스마트 알림**: 임계값 기반 자동 알림 시스템
- 📱 **반응형 UI**: 모바일부터 데스크톱까지 최적화된 미니멀 디자인
- ⚡ **실시간 통신**: WebSocket을 통한 즉시 데이터 업데이트

## 🛠 기술 스택

### 백엔드
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: SQLite (경량 파일 기반 DB)
- **Real-time**: Socket.io
- **Logging**: Winston

### 프론트엔드
- **Framework**: React 18 + TypeScript
- **3D Rendering**: Three.js + React Three Fiber
- **Charts**: Chart.js
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: Vite

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd agritwin
```

2. **의존성 설치**
```bash
npm install
```

3. **개발 서버 실행**
```bash
npm run dev
```

4. **브라우저에서 확인**
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000

### 개별 서비스 실행

**백엔드만 실행**
```bash
npm run server:dev
```

**프론트엔드만 실행**
```bash
npm run client:dev
```

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 📁 프로젝트 구조

```
agritwin/
├── server/                 # 백엔드 서버
│   ├── src/
│   │   ├── config/         # 설정 파일
│   │   ├── database/       # 데이터베이스 모델 및 마이그레이션
│   │   ├── routes/         # API 라우트
│   │   ├── services/       # 비즈니스 로직
│   │   ├── utils/          # 유틸리티
│   │   └── websocket/      # WebSocket 핸들러
│   └── data/              # SQLite 데이터베이스 파일
├── client/                 # 프론트엔드 클라이언트
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   ├── types/          # TypeScript 타입
│   │   └── styles/         # 스타일 시트
│   └── public/            # 정적 파일 (3D 모델, 텍스처 등)
└── docs/                  # 문서
```

## 🎯 시스템 아키텍처

### 데이터베이스 스키마
- **farm_zones**: 농장 구역 정보 (3층 6구역)
- **sensors**: 센서 정보 및 설정
- **sensor_data**: 실시간 센서 데이터
- **alerts**: 알림 및 경고 정보

### API 엔드포인트

#### 농장 구조
- `GET /api/farm/structure` - 전체 농장 구조 조회
- `GET /api/farm/zones` - 구역 목록 조회
- `GET /api/farm/zones/:id` - 특정 구역 상세 조회

#### 센서 관리
- `GET /api/sensors` - 전체 센서 목록
- `GET /api/sensors/:id` - 특정 센서 상세 정보
- `GET /api/sensors/:id/data` - 센서 데이터 히스토리

#### 분석 및 통계
- `GET /api/analytics/summary` - 분석 요약
- `POST /api/analytics/query` - 커스텀 데이터 쿼리
- `GET /api/analytics/trends` - 트렌드 분석

### WebSocket 이벤트
- `sensor-data:update` - 실시간 센서 데이터 업데이트
- `sensor:alert` - 센서 알림
- `zone:update` - 구역 정보 업데이트

## 📊 센서 시뮬레이션

시스템은 현실적인 센서 데이터를 자동으로 생성합니다:

- **온도**: 20-28°C (정상), 시간대별 변화 반영
- **습도**: 60-75% (정상), 온도와 역상관 관계
- **토양수분**: 40-70% (정상)
- **조도**: 20,000-40,000 lux (정상), 주/야간 변화
- **CO2**: 800-1,200 ppm (정상)

## 🔧 개발 스크립트

```bash
# 전체 프로젝트 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 의존성 설치 (서버 + 클라이언트)
npm run install:all

# 린팅 및 포맷팅
npm run lint

# 테스트 실행
npm test

# 빌드 파일 정리
npm run clean
```

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 서버 테스트
cd server && npm test

# 클라이언트 테스트
cd client && npm test
```

## 📈 성능 최적화

- **3D 렌더링**: LOD (Level of Detail) 시스템
- **데이터 로딩**: 페이지네이션 및 가상화
- **캐싱**: 메모리 캐시를 통한 빠른 응답
- **번들 최적화**: Vite의 코드 스플리팅

## 🔒 보안

- CORS 설정
- Helmet.js를 통한 보안 헤더
- 입력 데이터 검증 (Joi)
- SQL Injection 방지

## 🌐 배포

### Docker (추후 지원 예정)
```bash
docker-compose up
```

### 수동 배포
```bash
npm run build
npm start
```

## 🤝 기여

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

문제가 있거나 질문이 있으시면 [Issues](https://github.com/your-repo/agritwin/issues)를 통해 문의해 주세요.

---

**AgriTwin Team** ❤️ Made with passion for smart farming