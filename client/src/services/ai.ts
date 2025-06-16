import { apiService } from './api';

export interface FarmAnalysis {
  overallHealth: number;
  recommendations: string[];
  criticalIssues: string[];
  optimizationSuggestions: string[];
  timestamp: Date;
}

export interface AIResponse {
  analysis: FarmAnalysis;
  action: 'monitor' | 'alert' | 'optimize';
  confidence: number;
}

export interface AIOptimizationResponse {
  zoneId: string;
  recommendations: string[];
  timestamp: string;
}

export interface AIPredictionResponse {
  predictions: {
    temperature: number[];
    humidity: number[];
    predictions: string[];
  };
  timeframe: string;
  timestamp: string;
}

export interface AIQuestionResponse {
  question: string;
  answer: string;
  timestamp: string;
}

export interface AIStatusResponse {
  aiModel: string;
  provider: string;
  status: string;
  rateLimit: string;
  features: string[];
  timestamp: string;
}

class AIService {
  /**
   * 전체 농장 상태 AI 분석
   */
  async analyzeFarmCondition(): Promise<AIResponse> {
    try {
      const response = await apiService.get('/ai/analyze');
      return response.data;
    } catch (error) {
      console.error('Farm analysis failed:', error);
      throw new Error('농장 분석 중 오류가 발생했습니다.');
    }
  }

  /**
   * 특정 구역 최적화 제안
   */
  async getOptimizationRecommendations(zoneId: string): Promise<AIOptimizationResponse> {
    try {
      const response = await apiService.get(`/ai/optimize/${zoneId}`);
      return response.data;
    } catch (error) {
      console.error('Optimization recommendations failed:', error);
      throw new Error('최적화 제안 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 환경 변화 예측
   */
  async predictEnvironmentalTrends(hours: number = 24): Promise<AIPredictionResponse> {
    try {
      const response = await apiService.get(`/ai/predict?hours=${hours}`);
      return response.data;
    } catch (error) {
      console.error('Environmental prediction failed:', error);
      throw new Error('환경 예측 중 오류가 발생했습니다.');
    }
  }

  /**
   * AI에게 질문하기
   */
  async askQuestion(question: string, context?: { includeCurrentData?: boolean }): Promise<AIQuestionResponse> {
    try {
      const response = await apiService.post('/ai/ask', {
        question,
        context
      });
      return response.data;
    } catch (error) {
      console.error('AI question failed:', error);
      throw new Error('AI 질문 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * AI 시스템 상태 확인
   */
  async getAIStatus(): Promise<AIStatusResponse> {
    try {
      const response = await apiService.get('/ai/status');
      return response.data;
    } catch (error) {
      console.error('AI status check failed:', error);
      throw new Error('AI 상태 확인 중 오류가 발생했습니다.');
    }
  }

  /**
   * AI 분석 결과를 로컬 스토리지에 캐시
   */
  cacheAnalysis(analysis: AIResponse): void {
    try {
      const cached = {
        analysis,
        timestamp: Date.now()
      };
      localStorage.setItem('ai_farm_analysis', JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache AI analysis:', error);
    }
  }

  /**
   * 캐시된 AI 분석 결과 가져오기 (5분 이내)
   */
  getCachedAnalysis(): AIResponse | null {
    try {
      const cached = localStorage.getItem('ai_farm_analysis');
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - data.timestamp;
      
      // 5분 이내의 캐시만 유효
      if (cacheAge < 5 * 60 * 1000) {
        return data.analysis;
      }
      
      // 오래된 캐시 삭제
      localStorage.removeItem('ai_farm_analysis');
      return null;
    } catch (error) {
      console.warn('Failed to get cached AI analysis:', error);
      return null;
    }
  }

  /**
   * AI 추천사항을 우선순위별로 정렬
   */
  prioritizeRecommendations(recommendations: string[]): { high: string[], medium: string[], low: string[] } {
    const prioritized = {
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[]
    };

    recommendations.forEach(rec => {
      const lower = rec.toLowerCase();
      if (lower.includes('즉시') || lower.includes('긴급') || lower.includes('위험') || lower.includes('critical')) {
        prioritized.high.push(rec);
      } else if (lower.includes('권장') || lower.includes('개선') || lower.includes('조정')) {
        prioritized.medium.push(rec);
      } else {
        prioritized.low.push(rec);
      }
    });

    return prioritized;
  }

  /**
   * AI 분석 결과를 기반으로 알림 생성
   */
  generateAlerts(analysis: FarmAnalysis): { type: 'success' | 'warning' | 'error', message: string }[] {
    const alerts = [];

    if (analysis.overallHealth >= 90) {
      alerts.push({
        type: 'success' as const,
        message: `농장 상태가 매우 양호합니다! (건강도: ${analysis.overallHealth}점)`
      });
    } else if (analysis.overallHealth >= 70) {
      alerts.push({
        type: 'warning' as const,
        message: `농장 상태 점검이 필요합니다. (건강도: ${analysis.overallHealth}점)`
      });
    } else {
      alerts.push({
        type: 'error' as const,
        message: `농장 상태가 좋지 않습니다. 즉시 조치가 필요합니다! (건강도: ${analysis.overallHealth}점)`
      });
    }

    // 긴급 문제가 있으면 알림 추가
    if (analysis.criticalIssues.length > 0) {
      alerts.push({
        type: 'error' as const,
        message: `${analysis.criticalIssues.length}개의 긴급 문제가 발견되었습니다.`
      });
    }

    return alerts;
  }
}

export const aiService = new AIService();