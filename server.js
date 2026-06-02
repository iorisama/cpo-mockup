import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
const port = 3001;

const INITIAL_MACHINES = [
  { id: 'm1', name: 'Sterilizer Unit A', status: 'ok', temp: 135, humidity: 85, voltage: 380, current: 45 },
  { id: 'm2', name: 'Digester 1', status: 'ok', temp: 95, humidity: 40, voltage: 380, current: 60 },
  { id: 'm3', name: 'Screw Press 1', status: 'ok', temp: 90, humidity: 30, voltage: 380, current: 85 },
  { id: 'm4', name: 'Clarifier Station', status: 'ok', temp: 90, humidity: 50, voltage: 380, current: 40 },
  { id: 'm5', name: 'Boiler Main', status: 'ok', temp: 250, humidity: 10, voltage: 380, current: 120 },
  { id: 'm6', name: 'Loading Ramp', status: 'ok', temp: 32, humidity: 70, voltage: 220, current: 15 },
  { id: 'm7', name: 'Thresher', status: 'ok', temp: 45, humidity: 60, voltage: 380, current: 55 },
  { id: 'm8', name: 'Kernel Silo', status: 'ok', temp: 60, humidity: 15, voltage: 380, current: 30 },
];

const ANOMALIES = {
  'm1': [
    { title: 'Penurunan Tekanan Steam', desc: 'Tekanan steam pada Sterilizer drop di bawah batas minimum.', type: 'error' },
    { title: 'Valve Bocor', desc: 'Terdeteksi kebocoran pada valve pembuangan.', type: 'warning' }
  ],
  'm2': [
    { title: 'Suhu Terlalu Rendah', desc: 'Suhu pelumatan di bawah standar 90°C, ekstraksi bisa tidak optimal.', type: 'warning' },
    { title: 'Motor Overload', desc: 'Beban motor berlebih karena umpan terlalu padat.', type: 'error' }
  ],
  'm3': [
    { title: 'Tekanan Hidrolik Turun', desc: 'Sistem hidrolik tidak mencapai tekanan standar pengepresan.', type: 'warning' },
    { title: 'Arus Listrik Melonjak', desc: 'Terdeteksi lonjakan arus listrik (overcurrent) pada motor press.', type: 'error' },
    { title: 'Cone Macet', desc: 'Sistem hidrolik cone pada press macet.', type: 'error' }
  ],
  'm4': [
    { title: 'Kadar Kotoran Tinggi', desc: 'Sensor mendeteksi kadar kotoran tinggi pada tangki CST.', type: 'warning' },
    { title: 'Pompa Macet', desc: 'Pompa distribusi minyak mentah berhenti beroperasi.', type: 'error' }
  ],
  'm5': [
    { title: 'Level Air Kritis', desc: 'Level air pada Boiler mendekati batas bawah.', type: 'error' },
    { title: 'Overpressure Steam', desc: 'Tekanan uap melebihi batas aman operasional.', type: 'error' }
  ],
  'm6': [
    { title: 'Sensor Macet', desc: 'Sensor hidrolik pintu ramp tidak merespon.', type: 'warning' }
  ],
  'm7': [
    { title: 'Bantingan Tidak Optimal', desc: 'RPM drum thresher menurun.', type: 'warning' }
  ],
  'm8': [
    { title: 'Heater Mati', desc: 'Elemen pemanas pada Kernel Silo tidak berfungsi.', type: 'error' }
  ]
};

let machines = [...INITIAL_MACHINES];
let notifications = [];
let tickCount = 0;
let machineAnomaliesExpires = {};

const generateNextTick = () => {
  machines = machines.map(machine => {
    const tempChange = (Math.random() - 0.5) * 2;
    const humChange = (Math.random() - 0.5) * 2;
    const voltChange = (Math.random() - 0.5) * 5;
    const currChange = (Math.random() - 0.5) * 3;

    return {
      ...machine,
      temp: Math.max(0, Math.round((machine.temp + tempChange) * 10) / 10),
      humidity: Math.max(0, Math.round((machine.humidity + humChange) * 10) / 10),
      voltage: Math.max(0, Math.round((machine.voltage + voltChange) * 10) / 10),
      current: Math.max(0, Math.round((machine.current + currChange) * 10) / 10),
    };
  });
};

const generateRandomAnomaly = () => {
  const randomMachine = machines[Math.floor(Math.random() * machines.length)];
  const machineAnomalies = ANOMALIES[randomMachine.id];
  const randomAnomaly = machineAnomalies[Math.floor(Math.random() * machineAnomalies.length)];

  const newAnomaly = {
    id: Date.now().toString(),
    machineId: randomMachine.id,
    machineName: randomMachine.name,
    title: randomAnomaly.title,
    desc: randomAnomaly.desc,
    type: randomAnomaly.type,
    timestamp: new Date().toISOString()
  };

  // Update machine status
  machines = machines.map(m => m.id === newAnomaly.machineId ? { ...m, status: newAnomaly.type } : m);
  notifications = [newAnomaly, ...notifications].slice(0, 50);
  
  // Reset after 5 seconds
  machineAnomaliesExpires[newAnomaly.machineId] = tickCount + 5;
};

// Simulation Loop
setInterval(() => {
  tickCount++;

  // Reset expired anomalies
  Object.keys(machineAnomaliesExpires).forEach(machineId => {
    if (tickCount >= machineAnomaliesExpires[machineId]) {
      machines = machines.map(m => m.id === machineId ? { ...m, status: 'ok' } : m);
      delete machineAnomaliesExpires[machineId];
    }
  });

  generateNextTick();

  // Every 10 seconds, generate an anomaly
  if (tickCount % 10 === 0) {
    generateRandomAnomaly();
  }

  const data = { machines, notifications };
  
  // Write to a file for Unity to read
  fs.writeFileSync(path.join(__dirname, 'unity_data.json'), JSON.stringify(data, null, 2));

}, 1000);

// API Endpoint for React frontend
app.get('/api/data', (req, res) => {
  res.json({ machines, notifications });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
  console.log(`JSON data being written to ${path.join(__dirname, 'unity_data.json')}`);
});
