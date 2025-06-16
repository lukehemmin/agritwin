import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react';
import { aiService, AIResponse } from '../../services/ai';

interface AIInsightPanelProps {
  selectedZone: string | null;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ selectedZone }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [zoneOptimizations, setZoneOptimizations] = useState<{ [zoneId: string]: string[] }>({});

  // 초기 AI 분석 수행
  useEffect(() => {
    loadAIAnalysis();
    // 5분마다 자동 분석 수행
    const interval = setInterval(loadAIAnalysis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 선택된 구역이 변경되면 해당 구역의 최적화 제안 로드
  useEffect(() => {
    if (selectedZone && !zoneOptimizations[selectedZone]) {
      loadZoneOptimization(selectedZone);
    }
  }, [selectedZone]);

  const loadAIAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 캐시된 분석 결과 확인
      const cached = aiService.getCachedAnalysis();
      if (cached) {
        setAiAnalysis(cached);
        setLastUpdate(new Date(cached.analysis.timestamp));
        setIsLoading(false);
        return;
      }

      // 새로운 AI 분석 수행
      const analysis = await aiService.analyzeFarmCondition();
      setAiAnalysis(analysis);
      setLastUpdate(new Date());
      
      // 결과 캐시
      aiService.cacheAnalysis(analysis);

    } catch (err) {
      console.error('AI analysis failed:', err);
      setError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadZoneOptimization = async (zoneId: string) => {
    try {
      const optimization = await aiService.getOptimizationRecommendations(zoneId);
      setZoneOptimizations(prev => ({
        ...prev,
        [zoneId]: optimization.recommendations
      }));
    } catch (err) {
      console.error('Zone optimization failed:', err);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (health: number) => {
    if (health >= 90) return 'bg-green-50 border-green-200';
    if (health >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'optimize': return <TrendingUp className="w-5 h-5 text-yellow-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  if (isLoading && !aiAnalysis) {
    return (
      <div className="p-6 text-center">
        <Brain className="w-8 h-8 mx-auto mb-3 text-blue-500 animate-pulse" />
        <p className="text-gray-600">AI가 농장을 분석하고 있습니다...</p>
      </div>
    );
  }

  if (error && !aiAnalysis) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
        <p className="text-red-600 mb-3">{error}</p>
        <button 
          onClick={loadAIAnalysis}
          className="btn-primary text-sm"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const displayRecommendations = selectedZone && zoneOptimizations[selectedZone] 
    ? zoneOptimizations[selectedZone] 
    : aiAnalysis?.analysis.recommendations || [];

  const displayTitle = selectedZone 
    ? `${selectedZone} 구역 AI 최적화 제안`
    : 'AI 농장 분석';

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h4 className="font-semibold text-gray-900">{displayTitle}</h4>
        </div>
        <button
          onClick={loadAIAnalysis}
          disabled={isLoading}
          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
          title="분석 새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 전체 농장 건강도 (구역 선택 시에는 숨김) */}
      {!selectedZone && aiAnalysis && (
        <div className={`p-4 rounded-lg border-2 ${getHealthBgColor(aiAnalysis.analysis.overallHealth)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">농장 건강도</span>
            {getActionIcon(aiAnalysis.action)}
          </div>
          <div className={`text-3xl font-bold ${getHealthColor(aiAnalysis.analysis.overallHealth)}`}>
            {aiAnalysis.analysis.overallHealth}점
          </div>
          <div className="text-xs text-gray-500 mt-1">
            신뢰도: {Math.round(aiAnalysis.confidence * 100)}%
          </div>
        </div>
      )}

      {/* 긴급 문제 */}
      {!selectedZone && aiAnalysis?.analysis.criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="font-semibold text-red-800">긴급 조치 필요</span>
          </div>
          <ul className="space-y-2">
            {aiAnalysis.analysis.criticalIssues.map((issue, index) => (
              <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI 추천사항 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
          <span className="font-semibold text-gray-800">
            {selectedZone ? '최적화 제안' : 'AI 추천사항'}
          </span>
        </div>
        {displayRecommendations.length > 0 ? (
          <ul className="space-y-2">
            {displayRecommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            {selectedZone ? '최적화 제안을 불러오는 중...' : '추천사항이 없습니다.'}
          </p>
        )}
      </div>

      {/* 최적화 제안 (전체 농장 보기일 때만) */}
      {!selectedZone && aiAnalysis?.analysis.optimizationSuggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-800">최적화 제안</span>
          </div>
          <ul className="space-y-2">
            {aiAnalysis.analysis.optimizationSuggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 마지막 업데이트 */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
          마지막 분석: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};