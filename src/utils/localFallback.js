export const INITIAL_MACHINES = [
  { id: 'm1', name: 'Sterilizer Unit A', status: 'ok', temp: 135, humidity: 85, voltage: 380, current: 45 },
  { id: 'm2', name: 'Digester 1', status: 'ok', temp: 95, humidity: 40, voltage: 380, current: 60 },
  { id: 'm3', name: 'Screw Press 1', status: 'ok', temp: 90, humidity: 30, voltage: 380, current: 85 },
  { id: 'm4', name: 'Clarifier Station', status: 'ok', temp: 90, humidity: 50, voltage: 380, current: 40 },
  { id: 'm5', name: 'Boiler Main', status: 'ok', temp: 250, humidity: 10, voltage: 380, current: 120 },
  { id: 'm6', name: 'Loading Ramp', status: 'ok', temp: 32, humidity: 70, voltage: 220, current: 15 },
  { id: 'm7', name: 'Thresher', status: 'ok', temp: 45, humidity: 60, voltage: 380, current: 55 },
  { id: 'm8', name: 'Kernel Silo', status: 'ok', temp: 60, humidity: 15, voltage: 380, current: 30 },
];

export const ANOMALIES = {
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

let localMachines = [...INITIAL_MACHINES];
let localNotifications = [];
let localTick = 0;
let machineAnomaliesExpires = {};

export function localGenerateData() {
  localTick++;
  
  // Reset expired anomalies
  Object.keys(machineAnomaliesExpires).forEach(machineId => {
    if (localTick >= machineAnomaliesExpires[machineId]) {
      localMachines = localMachines.map(m => m.id === machineId ? { ...m, status: 'ok' } : m);
      delete machineAnomaliesExpires[machineId];
    }
  });

  localMachines = localMachines.map(machine => {
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

  if (localTick % 10 === 0) {
    const rm = localMachines[Math.floor(Math.random() * localMachines.length)];
    const rAnom = ANOMALIES[rm.id][Math.floor(Math.random() * ANOMALIES[rm.id].length)];
    
    const newA = {
      id: Date.now().toString(),
      machineId: rm.id,
      machineName: rm.name,
      title: rAnom.title,
      desc: rAnom.desc,
      type: rAnom.type,
      timestamp: new Date().toISOString()
    };

    localMachines = localMachines.map(m => m.id === newA.machineId ? { ...m, status: newA.type } : m);
    localNotifications = [newA, ...localNotifications].slice(0, 50);
    machineAnomaliesExpires[newA.machineId] = localTick + 5;
  }

  return { machines: localMachines, notifications: localNotifications };
}
