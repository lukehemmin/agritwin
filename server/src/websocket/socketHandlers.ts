import { Server as SocketIOServer, Socket } from 'socket.io';
import { Database } from 'sqlite';
import { logger } from '../utils/logger';
import { SensorSimulator } from '../services/SensorSimulator';

interface ClientData {
  subscribedZones: Set<string>;
  subscribedSensors: Set<string>;
}

const clientSubscriptions = new Map<string, ClientData>();
let sensorSimulator: SensorSimulator | null = null;

export function setupSocketHandlers(io: SocketIOServer, db: Database): void {
  // Initialize sensor simulator
  sensorSimulator = new SensorSimulator(db, io);
  sensorSimulator.start();

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Initialize client data
    clientSubscriptions.set(socket.id, {
      subscribedZones: new Set(),
      subscribedSensors: new Set()
    });

    // Handle sensor data subscription
    socket.on('subscribe:sensor-data', async () => {
      try {
        socket.join('sensor-data');
        logger.info(`Client ${socket.id} subscribed to real-time sensor data`);
        
        // Send current sensor data
        const currentData = await db.all(`
          SELECT 
            sd.id,
            sd.sensor_id,
            sd.value,
            sd.unit,
            sd.status,
            sd.timestamp,
            s.name as sensor_name,
            s.type as sensor_type,
            s.zone_id
          FROM sensor_data sd
          JOIN sensors s ON sd.sensor_id = s.id
          WHERE sd.id IN (
            SELECT MAX(id) 
            FROM sensor_data 
            GROUP BY sensor_id
          )
          AND s.is_active = 1
          ORDER BY sd.timestamp DESC
        `);

        logger.info(`Sending ${currentData.length} current sensor data points to client ${socket.id}`);
        socket.emit('sensor-data:current', currentData);
        
        // Also immediately send via update channel for consistency
        socket.emit('sensor-data:update', currentData);
        
      } catch (error) {
        logger.error('Error handling sensor data subscription:', error);
        socket.emit('error', { message: 'Failed to subscribe to sensor data' });
      }
    });

    // Handle zone-specific subscription
    socket.on('subscribe:zone', async (zoneId: string) => {
      try {
        if (!zoneId) {
          socket.emit('error', { message: 'Zone ID is required' });
          return;
        }

        const clientData = clientSubscriptions.get(socket.id);
        if (clientData) {
          clientData.subscribedZones.add(zoneId);
          socket.join(`zone-${zoneId}`);

          // Send current zone data
          const zoneData = await db.all(`
            SELECT 
              sd.sensor_id,
              sd.value,
              sd.unit,
              sd.status,
              sd.timestamp,
              s.name as sensor_name,
              s.type as sensor_type,
              s.position_x,
              s.position_y,
              s.position_z
            FROM sensor_data sd
            JOIN sensors s ON sd.sensor_id = s.id
            WHERE s.zone_id = ?
            AND sd.id IN (
              SELECT MAX(id) 
              FROM sensor_data 
              GROUP BY sensor_id
            )
            AND s.is_active = 1
          `, [zoneId]);

          socket.emit('zone-data:current', { zoneId, sensors: zoneData });
          logger.debug(`Client ${socket.id} subscribed to zone ${zoneId}`);
        }
      } catch (error) {
        logger.error('Error handling zone subscription:', error);
        socket.emit('error', { message: 'Failed to subscribe to zone data' });
      }
    });

    // Handle specific sensor subscription
    socket.on('subscribe:sensor', async (sensorId: string) => {
      try {
        if (!sensorId) {
          socket.emit('error', { message: 'Sensor ID is required' });
          return;
        }

        const clientData = clientSubscriptions.get(socket.id);
        if (clientData) {
          clientData.subscribedSensors.add(sensorId);
          socket.join(`sensor-${sensorId}`);

          // Send sensor history
          if (sensorSimulator) {
            const history = await sensorSimulator.getSensorHistory(sensorId, 24);
            socket.emit('sensor-history', { sensorId, data: history });
          }

          logger.debug(`Client ${socket.id} subscribed to sensor ${sensorId}`);
        }
      } catch (error) {
        logger.error('Error handling sensor subscription:', error);
        socket.emit('error', { message: 'Failed to subscribe to sensor data' });
      }
    });

    // Handle alerts subscription
    socket.on('subscribe:alerts', async () => {
      try {
        socket.join('alerts');

        // Send recent unresolved alerts
        const recentAlerts = await db.all(`
          SELECT 
            a.*,
            s.name as sensor_name,
            s.type as sensor_type,
            z.name as zone_name,
            z.id as zone_id
          FROM alerts a
          JOIN sensors s ON a.sensor_id = s.id
          JOIN farm_zones z ON s.zone_id = z.id
          WHERE a.is_resolved = 0
          ORDER BY a.created_at DESC
          LIMIT 20
        `);

        socket.emit('alerts:current', recentAlerts);
        logger.debug(`Client ${socket.id} subscribed to alerts`);
      } catch (error) {
        logger.error('Error handling alerts subscription:', error);
        socket.emit('error', { message: 'Failed to subscribe to alerts' });
      }
    });

    // Handle unsubscribe from all
    socket.on('unsubscribe:all', () => {
      const clientData = clientSubscriptions.get(socket.id);
      if (clientData) {
        // Leave all rooms
        socket.leave('sensor-data');
        socket.leave('alerts');
        
        clientData.subscribedZones.forEach(zoneId => {
          socket.leave(`zone-${zoneId}`);
        });
        
        clientData.subscribedSensors.forEach(sensorId => {
          socket.leave(`sensor-${sensorId}`);
        });

        // Clear subscriptions
        clientData.subscribedZones.clear();
        clientData.subscribedSensors.clear();

        logger.debug(`Client ${socket.id} unsubscribed from all`);
      }
    });

    // Handle sensor control commands
    socket.on('sensor:toggle', async (data: { sensorId: string; isActive: boolean }) => {
      try {
        await db.run(
          'UPDATE sensors SET is_active = ? WHERE id = ?',
          [data.isActive ? 1 : 0, data.sensorId]
        );

        // Broadcast sensor status change
        io.emit('sensor:status-changed', {
          sensorId: data.sensorId,
          isActive: data.isActive,
          timestamp: new Date().toISOString()
        });

        logger.info(`Sensor ${data.sensorId} ${data.isActive ? 'activated' : 'deactivated'}`);
      } catch (error) {
        logger.error('Error toggling sensor:', error);
        socket.emit('error', { message: 'Failed to toggle sensor' });
      }
    });

    // Handle alert resolution
    socket.on('alert:resolve', async (alertId: number) => {
      try {
        await db.run(
          'UPDATE alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
          [alertId]
        );

        // Broadcast alert resolution
        io.emit('alert:resolved', {
          alertId,
          resolvedAt: new Date().toISOString()
        });

        logger.info(`Alert ${alertId} resolved`);
      } catch (error) {
        logger.error('Error resolving alert:', error);
        socket.emit('error', { message: 'Failed to resolve alert' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      clientSubscriptions.delete(socket.id);
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to AgriTwin server',
      timestamp: new Date().toISOString()
    });
  });

  // Handle server shutdown
  process.on('SIGTERM', () => {
    if (sensorSimulator) {
      sensorSimulator.stop();
    }
  });
}