import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { Database } from 'sqlite';
import { SensorData } from '../database/models/Sensor';

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

export class AIFarmManager {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private db: Database;
  private lastAnalysis: Date | null = null;
  private readonly RATE_LIMIT_DELAY = 2000; // 2초 간격 (30 RPM 준수)

  constructor(db: Database, apiKey: string) {
    this.db = db;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemma-3-27b-it' });
    
    logger.info('🤖 AI Farm Manager initialized with Gemma 3 27B');
  }

  public async analyzeFarmCondition(sensorData: SensorData[]): Promise<AIResponse> {
    try {
      // Rate limiting check
      if (this.lastAnalysis && Date.now() - this.lastAnalysis.getTime() < this.RATE_LIMIT_DELAY) {
        logger.debug('Rate limit: Skipping AI analysis');
        return this.getDefaultResponse();
      }

      const prompt = this.buildAnalysisPrompt(sensorData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      this.lastAnalysis = new Date();
      
      logger.info('🧠 AI analysis completed');
      
      return this.parseAIResponse(analysisText, sensorData);
      
    } catch (error) {
      logger.error('AI analysis failed:', error);
      return this.getDefaultResponse();
    }
  }

  public async getOptimizationRecommendations(zoneId: string): Promise<string[]> {
    try {
      const zoneSensors = await this.getZoneSensorData(zoneId);
      const prompt = this.buildOptimizationPrompt(zoneId, zoneSensors);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendationsText = response.text();

      return this.parseRecommendations(recommendationsText);
      
    } catch (error) {
      logger.error('Failed to get optimization recommendations:', error);
      return ['시스템 분석 중 오류가 발생했습니다.'];
    }
  }

  public async predictEnvironmentalTrends(hours: number = 24): Promise<{ 
    temperature: number[], 
    humidity: number[], 
    predictions: string[] 
  }> {
    try {
      const historicalData = await this.getHistoricalData(hours);
      const prompt = this.buildPredictionPrompt(historicalData);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const predictionText = response.text();

      return this.parsePredictions(predictionText);
      
    } catch (error) {
      logger.error('Failed to predict environmental trends:', error);
      return { 
        temperature: [], 
        humidity: [], 
        predictions: ['예측 시스템이 일시적으로 사용할 수 없습니다.'] 
      };
    }
  }

  private buildAnalysisPrompt(sensorData: SensorData[]): string {
    const currentTime = new Date().toLocaleString('ko-KR');
    const sensorSummary = this.summarizeSensorData(sensorData);
    
    return `
당신은 전문적인 스마트팜 관리 AI입니다. 다음 센서 데이터를 분석하여 농장의 현재 상태를 평가해주세요.

**현재 시간**: ${currentTime}
**센서 데이터 요약**:
${sensorSummary}

다음 형식으로 분석 결과를 제공해주세요:

**전체 건강도**: [0-100 점수]
**주요 권장사항**:
- [구체적인 조치사항 1]
- [구체적인 조치사항 2]
- [구체적인 조치사항 3]

**긴급 문제**:
- [즉시 해결이 필요한 문제들]

**최적화 제안**:
- [효율성 향상을 위한 제안들]

**분석 신뢰도**: [0-100%]

한국어로 전문적이고 실용적인 조언을 제공해주세요.
`;
  }

  private buildOptimizationPrompt(zoneId: string, sensorData: SensorData[]): string {
    const zoneSummary = this.summarizeSensorData(sensorData);
    
    return `
${zoneId} 구역의 최적화 방안을 제안해주세요.

**구역 센서 현황**:
${zoneSummary}

**요청**: 이 구역의 생산성과 작물 품질을 향상시키기 위한 구체적인 최적화 방안을 5개 이하로 제안해주세요.

각 제안은 다음을 포함해야 합니다:
1. 구체적인 조치 방법
2. 예상되는 효과
3. 우선순위 (높음/중간/낮음)

한국어로 실용적인 조언을 제공해주세요.
`;
  }

  private buildPredictionPrompt(historicalData: any[]): string {
    return `
다음 24시간 동안의 농장 환경 변화를 예측해주세요.

**과거 24시간 데이터 트렌드**:
${JSON.stringify(historicalData.slice(0, 10), null, 2)}

다음 24시간의 온도와 습도 변화 예측과 함께, 농장 관리를 위한 주요 예측 포인트를 제공해주세요.

**형식**:
**온도 예측**: [시간대별 예측값들]
**습도 예측**: [시간대별 예측값들]
**주요 예측**:
- [예측 1]
- [예측 2]
- [예측 3]

한국어로 제공해주세요.
`;
  }

  private summarizeSensorData(sensorData: SensorData[]): string {
    const groupedData = sensorData.reduce((acc, data) => {
      const type = data.sensor_id.split('-').pop() || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(data);
      return acc;
    }, {} as Record<string, SensorData[]>);

    let summary = '';
    Object.entries(groupedData).forEach(([type, sensors]) => {
      const avgValue = sensors.reduce((sum, s) => sum + s.value, 0) / sensors.length;
      const normalCount = sensors.filter(s => s.status === 'normal').length;
      const warningCount = sensors.filter(s => s.status === 'warning').length;
      const criticalCount = sensors.filter(s => s.status === 'critical').length;
      
      const typeNames: Record<string, string> = {
        'temperature': '온도',
        'humidity': '습도',
        'soil_moisture': '토양수분',
        'light': '조도',
        'co2': 'CO2'
      };

      summary += `${typeNames[type] || type}: 평균 ${avgValue.toFixed(1)}${sensors[0]?.unit || ''} (정상: ${normalCount}, 경고: ${warningCount}, 위험: ${criticalCount})\n`;
    });

    return summary;
  }

  private parseAIResponse(analysisText: string, sensorData: SensorData[]): AIResponse {
    try {
      // Extract health score
      const healthMatch = analysisText.match(/전체 건강도.*?(\d+)/);
      const overallHealth = healthMatch ? parseInt(healthMatch[1]) : this.calculateBasicHealth(sensorData);

      // Extract recommendations
      const recommendations = this.extractListItems(analysisText, '주요 권장사항');
      const criticalIssues = this.extractListItems(analysisText, '긴급 문제');
      const optimizationSuggestions = this.extractListItems(analysisText, '최적화 제안');

      // Extract confidence
      const confidenceMatch = analysisText.match(/분석 신뢰도.*?(\d+)/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 85;

      const analysis: FarmAnalysis = {
        overallHealth,
        recommendations: recommendations.length > 0 ? recommendations : ['정기적인 모니터링을 계속하세요.'],
        criticalIssues: criticalIssues.length > 0 ? criticalIssues : [],
        optimizationSuggestions: optimizationSuggestions.length > 0 ? optimizationSuggestions : ['현재 상태가 양호합니다.'],
        timestamp: new Date()
      };

      const action: 'monitor' | 'alert' | 'optimize' = 
        criticalIssues.length > 0 ? 'alert' :
        overallHealth < 70 ? 'optimize' : 'monitor';

      return {
        analysis,
        action,
        confidence: confidence / 100
      };

    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return this.getDefaultResponse();
    }
  }

  private extractListItems(text: string, section: string): string[] {
    const sectionIndex = text.indexOf(section);
    if (sectionIndex === -1) return [];

    const afterSection = text.substring(sectionIndex);
    const nextSectionMatch = afterSection.match(/\*\*[^*]+\*\*/g);
    const endIndex = nextSectionMatch && nextSectionMatch.length > 1 ? 
      afterSection.indexOf(nextSectionMatch[1]) : afterSection.length;

    const sectionText = afterSection.substring(0, endIndex);
    const items = sectionText.match(/- (.+)/g);
    
    return items ? items.map(item => item.replace(/^- /, '').trim()) : [];
  }

  private parseRecommendations(text: string): string[] {
    const items = text.match(/^\d+\.\s*(.+)/gm) || text.match(/- (.+)/g);
    return items ? items.map(item => item.replace(/^\d+\.\s*|- /, '').trim()) : [text.trim()];
  }

  private parsePredictions(text: string): { temperature: number[], humidity: number[], predictions: string[] } {
    const predictions = this.extractListItems(text, '주요 예측');
    
    return {
      temperature: [], // 실제 구현에서는 파싱 로직 추가
      humidity: [],
      predictions: predictions.length > 0 ? predictions : ['예측 데이터를 분석 중입니다.']
    };
  }

  private calculateBasicHealth(sensorData: SensorData[]): number {
    if (sensorData.length === 0) return 85;
    
    const normalCount = sensorData.filter(s => s.status === 'normal').length;
    const warningCount = sensorData.filter(s => s.status === 'warning').length;
    const criticalCount = sensorData.filter(s => s.status === 'critical').length;

    const total = sensorData.length;
    const healthScore = (normalCount * 100 + warningCount * 60 + criticalCount * 20) / total;
    
    return Math.round(healthScore);
  }

  private getDefaultResponse(): AIResponse {
    return {
      analysis: {
        overallHealth: 85,
        recommendations: ['센서 데이터를 정기적으로 모니터링하세요.'],
        criticalIssues: [],
        optimizationSuggestions: ['AI 분석 시스템을 확인하세요.'],
        timestamp: new Date()
      },
      action: 'monitor',
      confidence: 0.5
    };
  }

  private async getZoneSensorData(zoneId: string): Promise<SensorData[]> {
    try {
      return await this.db.all<SensorData[]>(`
        SELECT sd.* FROM sensor_data sd
        JOIN sensors s ON sd.sensor_id = s.id
        WHERE s.zone_id = ?
        AND sd.timestamp > datetime('now', '-1 hour')
        ORDER BY sd.timestamp DESC
      `, [zoneId]);
    } catch (error) {
      logger.error('Failed to get zone sensor data:', error);
      return [];
    }
  }

  private async getHistoricalData(hours: number): Promise<any[]> {
    try {
      return await this.db.all(`
        SELECT sensor_id, AVG(value) as avg_value, timestamp
        FROM sensor_data
        WHERE timestamp > datetime('now', '-${hours} hours')
        GROUP BY sensor_id, datetime(timestamp, 'localtime', 'start of hour')
        ORDER BY timestamp DESC
      `);
    } catch (error) {
      logger.error('Failed to get historical data:', error);
      return [];
    }
  }
}