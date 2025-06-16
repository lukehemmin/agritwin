import express from 'express';
import { logger } from '../utils/logger';
import { AIFarmManager } from '../services/AIFarmManager';

const router = express.Router();

// GET /api/ai/analyze
// 전체 농장 상태 AI 분석
router.get('/analyze', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const aiManager: AIFarmManager = req.app.locals.aiManager;

    // 최근 1시간 내 센서 데이터 가져오기
    const recentSensorData = await db.all(`
      SELECT * FROM sensor_data 
      WHERE timestamp > datetime('now', '-1 hour')
      ORDER BY timestamp DESC
    `);

    logger.info(`🤖 Analyzing farm condition with ${recentSensorData.length} data points`);

    const aiResponse = await aiManager.analyzeFarmCondition(recentSensorData);

    res.json({
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI 분석 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai/optimize/:zoneId
// 특정 구역 최적화 제안
router.get('/optimize/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const aiManager: AIFarmManager = req.app.locals.aiManager;

    logger.info(`🎯 Getting optimization recommendations for zone: ${zoneId}`);

    const recommendations = await aiManager.getOptimizationRecommendations(zoneId);

    res.json({
      success: true,
      data: {
        zoneId,
        recommendations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Optimization recommendations failed:', error);
    res.status(500).json({
      success: false,
      error: '최적화 제안 생성 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai/predict
// 환경 변화 예측
router.get('/predict', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const aiManager: AIFarmManager = req.app.locals.aiManager;

    logger.info(`🔮 Predicting environmental trends for ${hours} hours`);

    const predictions = await aiManager.predictEnvironmentalTrends(hours);

    res.json({
      success: true,
      data: {
        predictions,
        timeframe: `${hours} hours`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Environmental prediction failed:', error);
    res.status(500).json({
      success: false,
      error: '환경 예측 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ai/ask
// AI에게 질문하기
router.post('/ask', async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: '질문을 입력해주세요.'
      });
    }

    const db = req.app.locals.db;
    const aiManager: AIFarmManager = req.app.locals.aiManager;

    // 컨텍스트에 따라 관련 데이터 수집
    let contextData = [];
    if (context?.includeCurrentData) {
      contextData = await db.all(`
        SELECT * FROM sensor_data 
        WHERE timestamp > datetime('now', '-30 minutes')
        ORDER BY timestamp DESC LIMIT 20
      `);
    }

    logger.info(`❓ AI question received: ${question.substring(0, 50)}...`);

    // 간단한 질문-답변 프롬프트 생성
    const prompt = `
농장 관리 전문가로서 다음 질문에 답해주세요.

질문: ${question}

${contextData.length > 0 ? `
현재 농장 상황:
${contextData.slice(0, 5).map(d => `- ${d.sensor_id}: ${d.value}${d.unit} (${d.status})`).join('\n')}
` : ''}

한국어로 친근하고 전문적인 답변을 제공해주세요.
`;

    // 간단한 AI 응답 생성 (실제로는 AIFarmManager에 추가 메서드 필요)
    const response = "죄송합니다. 현재 AI 질문 응답 기능을 구현 중입니다. 곧 사용 가능합니다!";

    res.json({
      success: true,
      data: {
        question,
        answer: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI question failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI 질문 처리 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai/status
// AI 시스템 상태 확인
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        aiModel: 'Gemma 3 27B',
        provider: 'Google AI Studio',
        status: 'active',
        rateLimit: '30 RPM / 14400 per day',
        features: [
          'Farm condition analysis',
          'Zone optimization recommendations',
          'Environmental trend prediction',
          'Q&A support'
        ],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('AI status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

export default router;