
const TEMP_ALERT = 30;       // °C
const HUMIDITY_ALERT = 70;   // %
const AIR_ALERT = 1000;      // ppm
const MOTION_THRESHOLD = 15; // m/s² (for sudden movement)

//! ADD THE HEART MONITOR READINGS
//! ADD THE THRESHOLDS AND THE WARNINGS
//! ADD THE READINGS TO THE FRONTEND
//! CALL IT A DAY

async function fetchEnvironmentData() {
    try {
        const response = await fetch('http://localhost:3000/api/temperature');
        const data = await response.json();
        console.log(data.data)

    } catch (err) {
        console.error("Failed to fetch environment data:", err);
    }
}

async function fetchAirQualityData() {
    try {
        const response = await fetch('http://localhost:3000/api/air_quality');
        const data = await response.json();
        console.log(data.data)

        const airElement = document.getElementById('air-quality');
        const airAlertElement = document.getElementById('air-alert');

        // airElement.textContent = `${data.air_quality.toFixed(0)} ppm`;

        if (data.air_quality > AIR_ALERT) {
            airAlertElement.textContent = "DANGER: Poor air quality!";
            airAlertElement.classList.add('alert');
            sendAlert("Air quality alert!");
        } else {
            airAlertElement.textContent = "Normal";
            airAlertElement.classList.remove('alert');
        }
    } catch (err) {
        console.error("Failed to fetch air quality data:", err);
    }
}

async function fetchAccelerationData() {
    try {
        const response = await fetch('http://localhost:3000/api/accelerometer');
        const data = await response.json();

        const x = data.accel_x;
        const y = data.accel_y;
        const z = data.accel_z;

        console.log(data.data)

        // document.getElementById('accel-x').textContent = `${x.toFixed(2)} m/s²`;
        // document.getElementById('accel-y').textContent = `${y.toFixed(2)} m/s²`;
        // document.getElementById('accel-z').textContent = `${z.toFixed(2)} m/s²`;

        // const totalAccel = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
        // const motionAlert = document.getElementById('motion-alert');

        // if (totalAccel > MOTION_THRESHOLD) {
        //     motionAlert.textContent = "WARNING: Sudden movement!";
        //     motionAlert.classList.add('alert');
        //     sendAlert("Motion detected!");
        // } else {
        //     motionAlert.textContent = "No motion";
        //     motionAlert.classList.remove('alert');
        // }
    } catch (err) {
        console.error("Failed to fetch acceleration data:", err);
    }
}



function sendAlert(message) {
    console.log("ALERT:", message);
    fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
}



// Poll every 2 seconds
function pollAllSensors() {
    fetchEnvironmentData();
    fetchAirQualityData();
    fetchAccelerationData();
}

setInterval(pollAllSensors, 2000);
pollAllSensors(); // Initial load
