const TEMP_ALERT = 30;
const HUMIDITY_ALERT = 70;
const AIR_ALERT = 1000;
const MOTION_THRESHOLD = 15;
const HEART_RATE_LOW = 50;
const HEART_RATE_HIGH = 120;

// async function fetchEnvironmentData() {
//     try {
//         const res = await fetch('http://localhost:3000/api/temperature');
//         const result = await res.json();
//         const temp = result.data.temperature;
//         const humidity = result.data.humidity;

//         document.getElementById('temperature').textContent = `${temp} °C`;
//         document.getElementById('humidity').textContent = `${humidity} %`;

//         const tempAlert = document.getElementById('temp-alert');
//         tempAlert.textContent = temp > TEMP_ALERT ? "WARNING: High Temperature!" : "Normal";
//         tempAlert.classList.toggle('alert', temp > TEMP_ALERT);

//         const humidityAlert = document.getElementById('humidity-alert');
//         humidityAlert.textContent = humidity > HUMIDITY_ALERT ? "WARNING: High Humidity!" : "Normal";
//         humidityAlert.classList.toggle('alert', humidity > HUMIDITY_ALERT);
//     } catch (err) {
//         console.error("Failed to fetch environment data:", err);
//     }
// }

async function fetchAirQualityData() {
    try {
        const res = await fetch('http://localhost:3000/api/air_quality');
        const result = await res.json();
        const airQuality = result.data.value;

        document.getElementById('air-quality').textContent = `${airQuality} ppm`;
        const airAlert = document.getElementById('air-alert');
        airAlert.textContent = airQuality > AIR_ALERT ? "DANGER: Poor air quality!" : "Normal";
        airAlert.classList.toggle('alert', airQuality > AIR_ALERT);
    } catch (err) {
        console.error("Failed to fetch air quality data:", err);
    }
}

async function fetchAccelerationData() {
    try {
        const res = await fetch('http://localhost:3000/api/accelerometer');
        const result = await res.json();
        const { x, y, z } = result.data;

        document.getElementById('accel-x').textContent = `${x.toFixed(2)} m/s²`;
        document.getElementById('accel-y').textContent = `${y.toFixed(2)} m/s²`;
        document.getElementById('accel-z').textContent = `${z.toFixed(2)} m/s²`;

        const total = Math.sqrt(x * x + y * y + z * z);
        const motionAlert = document.getElementById('motion-alert');
        motionAlert.textContent = total > MOTION_THRESHOLD ? "WARNING: Sudden movement!" : "No motion";
        motionAlert.classList.toggle('alert', total > MOTION_THRESHOLD);
    } catch (err) {
        console.error("Failed to fetch acceleration data:", err);
    }
}

async function fetchHeartRateData() {
    try {
        const res = await fetch('http://localhost:3000/api/heart_rate');
        const result = await res.json();
        const heartRate = result.data.bpm;

        document.getElementById('heart-rate').textContent = `${heartRate} bpm`;
        const heartAlert = document.getElementById('heart-alert');
        heartAlert.textContent = heartRate < HEART_RATE_LOW || heartRate > HEART_RATE_HIGH ? "ALERT: Abnormal Heart Rate!" : "Normal";
        heartAlert.classList.toggle('alert', heartRate < HEART_RATE_LOW || heartRate > HEART_RATE_HIGH);
    } catch (err) {
        console.error("Failed to fetch heart rate data:", err);
    }
}

function pollAllSensors() {
    // fetchEnvironmentData();
    fetchAirQualityData();
    fetchAccelerationData();
    fetchHeartRateData();
}

setInterval(pollAllSensors, 2000);
pollAllSensors();
