import express from 'express';
import { PlantGrowthSimulator } from '../services/PlantGrowthSimulator';

const router = express.Router();
const plantSimulator = PlantGrowthSimulator.getInstance();

// GET /api/plants - 모든 식물 조회
router.get('/', async (req, res) => {
  try {
    // TODO: 데이터베이스에서 식물 목록 조회
    const plants = []; // 임시
    res.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plants/zone/:zoneId - 특정 구역의 식물들 조회
router.get('/zone/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    // TODO: 특정 구역의 식물들 조회
    const plants = []; // 임시
    res.json(plants);
  } catch (error) {
    console.error('Error fetching plants by zone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plants/:id - 특정 식물 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: 특정 식물 상세 정보 조회 (성장 히스토리, 건강 이벤트 포함)
    const plant = null; // 임시
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/plants - 새 식물 심기
router.post('/', async (req, res) => {
  try {
    const { farm_zone_id, plant_type, position_x, position_y, position_z } = req.body;
    
    if (!farm_zone_id || !plant_type || position_x === undefined || position_y === undefined || position_z === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const plantId = await plantSimulator.plantSeed(farm_zone_id, plant_type, position_x, position_y, position_z);
    
    res.status(201).json({ 
      id: plantId, 
      message: `${plant_type} seed planted successfully` 
    });
  } catch (error) {
    console.error('Error planting seed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/plants/:id/harvest - 식물 수확
router.put('/:id/harvest', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await plantSimulator.harvestPlant(parseInt(id));
    
    if (!success) {
      return res.status(404).json({ error: 'Plant not found or cannot be harvested' });
    }
    
    res.json({ message: 'Plant harvested successfully' });
  } catch (error) {
    console.error('Error harvesting plant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plants/:id/growth-history - 식물 성장 히스토리 조회
router.get('/:id/growth-history', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: 식물 성장 히스토리 조회
    const history = []; // 임시
    res.json(history);
  } catch (error) {
    console.error('Error fetching growth history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plants/:id/health-events - 식물 건강 이벤트 조회
router.get('/:id/health-events', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: 식물 건강 이벤트 조회
    const events = []; // 임시
    res.json(events);
  } catch (error) {
    console.error('Error fetching health events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/plants/simulation/start - 성장 시뮬레이션 시작
router.post('/simulation/start', async (req, res) => {
  try {
    plantSimulator.start();
    res.json({ message: 'Plant growth simulation started' });
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/plants/simulation/stop - 성장 시뮬레이션 중지
router.post('/simulation/stop', async (req, res) => {
  try {
    plantSimulator.stop();
    res.json({ message: 'Plant growth simulation stopped' });
  } catch (error) {
    console.error('Error stopping simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plants/stats/overview - 전체 식물 통계
router.get('/stats/overview', async (req, res) => {
  try {
    // TODO: 전체 식물 통계 계산
    const stats = {
      total_plants: 0,
      by_growth_stage: {
        seed: 0,
        sprout: 0,
        growing: 0,
        mature: 0,
        harvest: 0,
        dead: 0
      },
      by_health_status: {
        healthy: 0,
        stressed: 0,
        sick: 0,
        dead: 0
      },
      by_plant_type: {
        lettuce: 0,
        spinach: 0,
        kale: 0,
        arugula: 0,
        basil: 0,
        mint: 0
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching plant stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;