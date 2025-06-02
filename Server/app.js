import mqtt from "mqtt";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";



// MQTT Configuration for EMQX
const protocol = 'mqtt';
const host = '3.87.127.15'; //change this ba2a 
const port = '1883';
const clientId = `MQTT-SafetyInspectionDashboard`;
const connectUrl = `${protocol}://${host}:${port}`;


// MQTT Topics - matching your ESP32 code
const COMMAND_TOPIC = 'esp32/commands';
const STATUS_TOPIC = 'esp32/status';
const HEART_TOPIC = 'esp32/heart';
const ACCEL_TOPIC = 'esp32/accel';
const AIR_TOPIC = 'esp32/air';



// Create MQTT client
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'esp32',
  password: 'yourpassword',
  reconnectPeriod: 1000,
});


// Express app setup
const app = express();
app.use(cors()); // feh separate backend w frontend
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// Enhanced device state to store all sensor data
const deviceState = {
  led: 'off',
  lastUpdate: null,
  connection_status: 'disconnected',
  sensors: {
    heart: {
      bpm: null,
      spo2: null,
      finger_detected: false,
      lastUpdate: null,
      sensor_id: null
    },
    air_quality: {
      value: null,
      raw_value: null,
      lastUpdate: null,
      sensor_id: null
    },
    accelerometer: {
      x: null,
      y: null,
      z: null,
      lastUpdate: null,
      sensor_id: null
    }
  },
  system: {
    wifi_rssi: null,
    uptime: null,
    free_heap: null
  }
};



// Store recent sensor readings for charts/history
const sensorHistory = {
  heart: [],
  air_quality: [],
  accelerometer: []
};
const MAX_HISTORY_LENGTH = 100;



// MQTT Connection Handler
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  deviceState.connection_status = 'connected';
  
  // Subscribe to all sensor topics
  const topics = [STATUS_TOPIC, HEART_TOPIC, ACCEL_TOPIC, AIR_TOPIC];
  
  topics.forEach(topic => {
    client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`✓ Subscribed to ${topic}`);
      } else {
        console.error(`✗ Failed to subscribe to ${topic}:`, err);
      }
    });
  });
});



client.on('disconnect', () => {
  console.log('Disconnected from MQTT broker');
  deviceState.connection_status = 'disconnected';
});



client.on('message', (topic, message) => {
  const msg = message.toString();
  console.log(`📨 Received on ${topic}: ${msg}`);

  try {
    const data = JSON.parse(msg);
    const timestamp = new Date();

    switch (topic) {
      case STATUS_TOPIC:
        handleStatusMessage(data, timestamp);
        break;
        
      case HEART_TOPIC:
        handleHeartRateMessage(data, timestamp);
        break;
        
      case AIR_TOPIC:
        handleAirQualityMessage(data, timestamp);
        break;
        
      case ACCEL_TOPIC:
        handleAccelerometerMessage(data, timestamp);
        break;
        
      default:
        console.log(`Unhandled topic: ${topic}`);
    }
    
    deviceState.lastUpdate = timestamp;
    
  } catch (e) {
    console.error('Error parsing JSON message:', e);
    console.error('Raw message:', msg);
  }
});



// Message Handlers
function handleStatusMessage(data, timestamp) {
  console.log('📊 Status update received');
  
  if (data.led !== undefined) {
    deviceState.led = data.led ? 'on' : 'off';
  }
  
  // Update system information
  if (data.wifi_rssi !== undefined) deviceState.system.wifi_rssi = data.wifi_rssi;
  if (data.uptime !== undefined) deviceState.system.uptime = data.uptime;
  if (data.free_heap !== undefined) deviceState.system.free_heap = data.free_heap;
}




function handleHeartRateMessage(data, timestamp) {
  console.log(`💓 Heart Rate: ${data.bpm} BPM, SpO2: ${data.spo2}%`);
  
  deviceState.sensors.heart = {
    bpm: data.bpm || null,
    spo2: data.spo2 || null,
    finger_detected: data.finger_detected || false,
    lastUpdate: timestamp,
    sensor_id: data.sensor_id || null
  };
  
  // Add to history
  if (data.bpm && data.bpm > 0) {
    addToHistory('heart', {
      bpm: data.bpm,
      spo2: data.spo2,
      timestamp: timestamp
    });
  }
}



function handleAirQualityMessage(data, timestamp) {
  console.log(`🌬️ Air Quality: ${data.air_quality}`);
  
  deviceState.sensors.air_quality = {
    value: data.air_quality || null,
    raw_value: data.raw_value || null,
    lastUpdate: timestamp,
    sensor_id: data.sensor_id || null
  };
  
  // Add to history
  if (data.air_quality !== null) {
    addToHistory('air_quality', {
      value: data.air_quality,
      timestamp: timestamp
    });
  }

}



function handleAccelerometerMessage(data, timestamp) {
  console.log(`📱 Accelerometer - X: ${data.x}, Y: ${data.y}, Z: ${data.z}`);
  
  deviceState.sensors.accelerometer = {
    x: data.x || null,
    y: data.y || null,
    z: data.z || null,
    lastUpdate: timestamp,
    sensor_id: data.sensor_id || null
  };
  
  // Add to history
  if (data.x !== null && data.y !== null && data.z !== null) {
    addToHistory('accelerometer', {
      x: data.x,
      y: data.y,
      z: data.z,
      timestamp: timestamp
    });
  }
}

// Helper function to manage sensor history
function addToHistory(sensorType, data) {
  sensorHistory[sensorType].push(data);
  
  // Keep only the last MAX_HISTORY_LENGTH readings
  if (sensorHistory[sensorType].length > MAX_HISTORY_LENGTH) {
    sensorHistory[sensorType].shift();
  }
}


//! Get current heart rate data
app.get('/api/heart_rate', (req, res) => {
  res.json({
    success: true,
    data: deviceState.sensors.heart,
  });
});


// Get current air quality data
app.get('/api/air_quality', (req, res) => {
  res.json({
    success: true,
    data: deviceState.sensors.air_quality,
  });
});

// Get current accelerometer data
app.get('/api/accelerometer', (req, res) => {
  res.json({
    success: true,
    data: deviceState.sensors.accelerometer,
  });
});

// Get all sensor data
app.get('/api/sensors', (req, res) => {

  console.log("thiss " + deviceState.sensors.air_quality.finger_detected)
  res.json({
    success: true,
    sensors: deviceState.sensors,
    system: deviceState.system,
    connection_status: deviceState.connection_status,
    lastUpdate: deviceState.lastUpdate
  });
});

// Get sensor history for charts
app.get('/api/history/:sensorType', (req, res) => {
  const { sensorType } = req.params;
  const { limit = 50 } = req.query;
  
  if (sensorHistory[sensorType]) {
    res.json({
      success: true,
      sensorType,
      data: sensorHistory[sensorType].slice(-parseInt(limit))
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Sensor type not found',
      availableTypes: Object.keys(sensorHistory)
    });
  }
});

// Get complete device state (existing, but enhanced)
app.get('/api/state', (req, res) => {
  res.json({
    success: true,
    ...deviceState,
    availableEndpoints: {
      sensors: '/api/sensors',
      heart_rate: '/api/heart_rate',
      temperature: '/api/temperature',
      air_quality: '/api/air_quality',
      accelerometer: '/api/accelerometer',
      history: '/api/history/:sensorType',
      led_control: 'POST /api/led'
    }
  });
});

// Send commands to ESP32
app.post('/api/command', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({
      success: false,
      message: 'Command is required'
    });
  }
  
  client.publish(COMMAND_TOPIC, command);
  
  res.json({
    success: true,
    message: `Command '${command}' sent to ESP32`
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    server: 'running',
    mqtt_connection: deviceState.connection_status,
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 MQTT Client ID: ${clientId}`);
  console.log('📋 Available API endpoints:');
  console.log('  GET  /api/state - Complete device state');
  console.log('  GET  /api/sensors - All sensor data');
  console.log('  GET  /api/heart_rate - Heart rate & SpO2');
  console.log('  GET  /api/air_quality - Air quality data');
  console.log('  GET  /api/accelerometer - Accelerometer data');
  console.log('  GET  /api/history/:sensorType - Sensor history');
  console.log('  POST /api/led - LED control');
  console.log('  POST /api/command - Send custom commands');
  console.log('  GET  /api/health - Server health check');
});