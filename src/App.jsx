import React, { useState, useEffect } from 'react';
import MachineCard from './components/MachineCard';
import NotificationPanel from './components/NotificationPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  const [machines, setMachines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for tracking the selected machine (default m1 initially, but will wait for fetch)
  const [selectedMachineId, setSelectedMachineId] = useState('m1');
  const [chartHistory, setChartHistory] = useState({});

  // Fungsi untuk membunyikan suara alert (Siren/Lebih menegangkan)
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sawtooth'; // Menggunakan sawtooth untuk suara lebih keras/kasar
      
      // Efek sirine naik turun cepat
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
      oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.4);
      oscillator.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.6);
      oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.8);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime + 0.7);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio API tidak didukung atau diblokir browser', e);
    }
  };

  // Real-time tick fetching from backend every 1 second
  useEffect(() => {
    const fetchInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/data');
        if (!response.ok) return;
        const data = await response.json();
        
        setMachines(data.machines);
        
        setNotifications(prev => {
          // Bunyikan alert jika ada anomali baru (berdasarkan ID terbaru yang berbeda)
          if (data.notifications.length > 0 && 
              (!prev.length || data.notifications[0].id !== prev[0].id)) {
              playAlertSound();
          }
          return data.notifications;
        });
        
        const now = new Date();
        const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        setChartHistory(prevHistory => {
          const newHistory = { ...prevHistory };
          data.machines.forEach(m => {
            if (!newHistory[m.id]) newHistory[m.id] = [];
            newHistory[m.id] = [...newHistory[m.id], { 
              time: timeLabel, 
              temperature: Number(m.temp.toFixed(1)), 
              power: Number(m.current.toFixed(1)) 
            }];
            if (newHistory[m.id].length > 20) newHistory[m.id].shift(); // Hanya simpan 20 data terakhir
          });
          return newHistory;
        });

        setCurrentTime(new Date());

      } catch (err) {
        console.error('Error fetching data from backend:', err);
      }
    }, 1000);

    return () => clearInterval(fetchInterval);
  }, []);

  const formatHeaderTime = (date) => {
    return date.toLocaleTimeString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
  };

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const currentChartData = chartHistory[selectedMachineId] || [];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(12px)', margin: '-32px -24px 40px -24px', padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', padding: '10px', borderRadius: '12px', color: 'white', fontWeight: 800 }}>CPO</div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Plant Monitoring</h1>
        </div>
        <div className="header-time">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {formatHeaderTime(currentTime)}
        </div>
      </header>

      <main className="main-grid">
        <div className="left-column">
          {/* Sticky Chart Container */}
          <div className="chart-container glass-panel" style={{ 
            marginBottom: '32px', 
            height: '340px', 
            paddingBottom: '10px',
            position: 'sticky',
            top: '100px', // Offset from header
            zIndex: 10
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: 600 }}>
              Grafik Historis: {selectedMachine?.name || 'Memuat...'}
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={currentChartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickMargin={10} />
                <YAxis yAxisId="left" stroke="#ef4444" fontSize={11} domain={['dataMin - 5', 'dataMax + 5']} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(22, 28, 45, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area yAxisId="left" type="monotone" dataKey="temperature" name="Suhu (°C)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" activeDot={{ r: 6 }} dot={false} isAnimationActive={false} />
                <Area yAxisId="right" type="monotone" dataKey="power" name="Arus (A)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPower)" activeDot={{ r: 6 }} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <section className="machines-grid">
            {machines.length === 0 ? <p style={{color: '#94a3b8', fontStyle: 'italic'}}>Menghubungkan ke Backend...</p> : 
              machines.map(machine => (
                <MachineCard 
                  key={machine.id} 
                  machine={machine} 
                  isSelected={selectedMachineId === machine.id}
                  onClick={() => setSelectedMachineId(machine.id)}
                />
              ))
            }
          </section>
        </div>

        <aside>
          <div style={{ position: 'sticky', top: '100px', height: 'calc(100vh - 120px)' }}>
            <NotificationPanel notifications={notifications} />
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
