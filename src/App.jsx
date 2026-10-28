import { useMemo, useState } from 'react'
import './App.css'

const algorithms = [
  { id: 'fcfs', name: 'FCFS', fullName: 'First-Come, First-Served', color: '#67e8c1' },
  { id: 'sjf', name: 'SJF', fullName: 'Shortest Job First', color: '#8f9cff' },
  { id: 'rr', name: 'Round Robin', fullName: 'Round Robin', color: '#ffc878' },
]

function schedule(processes, algorithm, quantum) {
  const ordered = algorithm === 'sjf'
    ? [...processes].sort((a, b) => a.bt - b.bt || a.index - b.index)
    : [...processes]
  const segments = []
  const completed = new Map()
  let time = 0

  if (algorithm === 'rr') {
    const remaining = new Map(processes.map((process) => [process.id, process.bt]))
    while (remaining.size > 0) {
      for (const process of processes) {
        const left = remaining.get(process.id)
        if (left === undefined) continue
        const duration = Math.min(left, quantum)
        segments.push({ process: process.id, start: time, end: time + duration, colorIndex: process.index })
        time += duration
        if (duration === left) {
          completed.set(process.id, time)
          remaining.delete(process.id)
        } else {
          remaining.set(process.id, left - duration)
        }
      }
    }
  } else {
    for (const process of ordered) {
      segments.push({ process: process.id, start: time, end: time + process.bt, colorIndex: process.index })
      time += process.bt
      completed.set(process.id, time)
    }
  }

  const rows = processes.map((process) => {
    const firstRun = segments.find((segment) => segment.process === process.id)
    const ct = completed.get(process.id)
    const tat = ct - process.at
    return { ...process, st: firstRun.start, ct, tat, wt: tat - process.bt }
  })

  return {
    rows,
    segments,
    avgWt: rows.reduce((sum, row) => sum + row.wt, 0) / rows.length,
    totalTime: time,
  }
}

function App() {
  const [theme, setTheme] = useState('dark')
  const [count, setCount] = useState(5)
  const [burstTimes, setBurstTimes] = useState([5, 3, 8, 6, 2])
  const [quantum, setQuantum] = useState(2)
  const [activeAlgorithm, setActiveAlgorithm] = useState('fcfs')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const processes = useMemo(
    () => burstTimes.slice(0, count).map((bt, index) => ({ id: `P${index + 1}`, index, at: 0, bt })),
    [burstTimes, count],
  )

  const changeCount = (value) => {
    const nextCount = value === '' ? '' : Number(value)
    setCount(nextCount)
    if (Number.isInteger(nextCount) && nextCount > 0 && nextCount <= 30) {
      setBurstTimes((current) => Array.from({ length: nextCount }, (_, index) => current[index] ?? 1))
    }
    setResults(null)
    setError('')
  }

  const updateBurstTime = (index, value) => {
    setBurstTimes((current) => current.map((bt, i) => i === index ? (value === '' ? '' : Number(value)) : bt))
    setResults(null)
    setError('')
  }

  const randomizeBurstTimes = () => {
    if (!Number.isInteger(count) || count < 1 || count > 30) {
      setError('กรุณาระบุจำนวนโปรเซสเป็นจำนวนเต็มตั้งแต่ 1 ถึง 30')
      return
    }
    setBurstTimes(Array.from({ length: count }, () => Math.floor(Math.random() * 9) + 1))
    setResults(null)
    setError('')
  }

  const runSimulation = (event) => {
    event.preventDefault()
    if (!Number.isInteger(count) || count < 1 || count > 30) {
      setError('จำนวนโปรเซสต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 30')
      return
    }
    if (processes.length !== count || processes.some(({ bt }) => !Number.isInteger(bt) || bt <= 0)) {
      setError('กรุณากรอก Burst Time เป็นจำนวนเต็มบวกให้ครบทุกโปรเซส')
      return
    }
    if (!Number.isInteger(quantum) || quantum <= 0) {
      setError('Time Quantum ต้องเป็นจำนวนเต็มบวก')
      return
    }

    setResults({
      fcfs: schedule(processes, 'fcfs', quantum),
      sjf: schedule(processes, 'sjf', quantum),
      rr: schedule(processes, 'rr', quantum),
    })
    setError('')
  }

  const selectedResult = results?.[activeAlgorithm]

  return (
    <div className={`app-shell ${theme}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CPU Lab home">
          <span className="brand-icon" aria-hidden="true"><span /><span /><span /></span>
          <span>CPU<span className="brand-light">LAB</span></span>
        </a>
        <nav className="topnav" aria-label="เมนูหลัก">
          <a href="#simulator">ตัวจำลอง</a>
          <a href="#results">ผลลัพธ์</a>
        </nav>
        <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span>
          {theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> OPERATING SYSTEMS · INTERACTIVE LAB</div>
            <h1>CPU Scheduling<br /><span>Simulator</span></h1>
            <p>ทดลองจัดสรรเวลา CPU และเปรียบเทียบอัลกอริทึม<br className="desktop-break" /> ผ่านภาพจำลองการทำงานแบบเข้าใจง่าย</p>
            <a className="hero-link" href="#simulator">เริ่มจำลอง <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-art" aria-label="ภาพประกอบลำดับการจัดสรร CPU" role="img">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="cpu-chip"><span>CPU</span><i /><i /><i /><i /></div>
            <div className="float-card float-card-one"><b>P1</b><span>RUNNING</span></div>
            <div className="float-card float-card-two"><b>P2</b><span>READY</span></div>
            <div className="float-card float-card-three"><b>P3</b><span>READY</span></div>
            <div className="art-caption">PROCESS QUEUE <span>● ● ●</span></div>
          </div>
        </section>

        <section className="algorithm-strip" aria-label="อัลกอริทึมที่รองรับ">
          {algorithms.map((algorithm, index) => (
            <div className="algorithm-intro" key={algorithm.id}>
              <span className="algorithm-number">0{index + 1}</span>
              <div><b>{algorithm.name}</b><span>{algorithm.fullName}</span></div>
            </div>
          ))}
        </section>

        <section className="workspace" id="simulator">
          <div className="section-heading">
            <div><span className="section-kicker">SIMULATION SETUP</span><h2>ตั้งค่าการจำลอง</h2></div>
            <span className="arrival-note"><span className="tiny-dot" /> Arrival Time ของทุกโปรเซส = 0</span>
          </div>

          <form onSubmit={runSimulation}>
            <div className="setup-grid">
              <div className="setup-card process-card">
                <div className="card-title-row">
                  <div><span className="step-label">01 / PROCESS</span><h3>กำหนดโปรเซส</h3></div>
                  <span className="card-icon" aria-hidden="true">▦</span>
                </div>
                <label className="field-label" htmlFor="process-count">จำนวนโปรเซส <span>1–30</span></label>
                <div className="count-control">
                  <button type="button" aria-label="ลดจำนวนโปรเซส" onClick={() => changeCount(Math.max(1, (Number(count) || 1) - 1))}>−</button>
                  <input id="process-count" type="number" min="1" max="30" step="1" value={count} onChange={(event) => changeCount(event.target.value)} />
                  <button type="button" aria-label="เพิ่มจำนวนโปรเซส" onClick={() => changeCount(Math.min(30, (Number(count) || 1) + 1))}>+</button>
                </div>
                <div className="process-preview">
                  {processes.slice(0, 8).map((process) => <span className="process-chip" key={process.id}>{process.id}</span>)}
                  {count > 8 && <span className="more-chip">+{count - 8}</span>}
                </div>
                <div className="field-hint">ระบบกำหนดชื่อโปรเซสให้อัตโนมัติ เริ่มจาก P1</div>
              </div>

              <div className="setup-card burst-card">
                <div className="card-title-row">
                  <div><span className="step-label">02 / BURST TIME</span><h3>กำหนด Burst Time</h3></div>
                  <button className="random-button" type="button" onClick={randomizeBurstTimes}><span aria-hidden="true">⤨</span> สุ่มค่า</button>
                </div>
                <p className="card-description">กรอกเวลาที่แต่ละโปรเซสต้องใช้ CPU (จำนวนเต็มบวก)</p>
                <div className="burst-grid">
                  {processes.map((process, index) => (
                    <label className="burst-field" key={process.id}>
                      <span>{process.id}</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={process.bt}
                        onChange={(event) => updateBurstTime(index, event.target.value)}
                        aria-label={`Burst Time ของ ${process.id}`}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="setup-card quantum-card">
                <div className="card-title-row">
                  <div><span className="step-label">03 / ROUND ROBIN</span><h3>ตั้งค่า Quantum</h3></div>
                  <span className="card-icon quantum-icon" aria-hidden="true">↻</span>
                </div>
                <label className="field-label" htmlFor="quantum">Time Quantum <span>หน่วยเวลา</span></label>
                <div className="quantum-input-wrap">
                  <input id="quantum" type="number" min="1" step="1" value={quantum} onChange={(event) => { setQuantum(event.target.value === '' ? '' : Number(event.target.value)); setResults(null) }} />
                  <span>UNIT</span>
                </div>
                <div className="field-hint">ค่าเริ่มต้น 2 · ใช้สำหรับ Round Robin</div>
              </div>
            </div>
            {error && <div className="error-message" role="alert"><span aria-hidden="true">!</span>{error}</div>}
            <div className="run-row">
              <span className="run-note"><span className="tiny-dot" /> ใช้ข้อมูลชุดเดียวกันในการเปรียบเทียบ</span>
              <button className="run-button" type="submit">ประมวลผลการจำลอง <span aria-hidden="true">↗</span></button>
            </div>
          </form>
        </section>

        {results && (
          <section className="results-section" id="results">
            <div className="section-heading result-heading">
              <div><span className="section-kicker">SCHEDULING RESULTS</span><h2>ผลการจำลอง</h2></div>
              <span className="success-badge"><span /> คำนวณสำเร็จ · {count} โปรเซส</span>
            </div>
            <div className="comparison-grid">
              {algorithms.map((algorithm) => (
                <button
                  type="button"
                  className={`comparison-card ${activeAlgorithm === algorithm.id ? 'selected' : ''}`}
                  key={algorithm.id}
                  style={{ '--algorithm-color': algorithm.color }}
                  onClick={() => setActiveAlgorithm(algorithm.id)}
                  aria-pressed={activeAlgorithm === algorithm.id}
                >
                  <span className="comparison-label">{algorithm.name}</span>
                  <strong>{results[algorithm.id].avgWt.toFixed(2)}</strong>
                  <span className="comparison-caption">AVG WAITING TIME</span>
                  {algorithm.id === 'rr' && <span className="quantum-caption">Quantum = {quantum}</span>}
                </button>
              ))}
            </div>

            <div className="results-panel">
              <div className="result-tabs" role="tablist" aria-label="เลือกอัลกอริทึม">
                {algorithms.map((algorithm) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeAlgorithm === algorithm.id}
                    className={activeAlgorithm === algorithm.id ? 'active' : ''}
                    key={algorithm.id}
                    onClick={() => setActiveAlgorithm(algorithm.id)}
                  >{algorithm.name}</button>
                ))}
                {activeAlgorithm === 'rr' && <span className="tab-quantum">TQ = {quantum}</span>}
              </div>
              <div className="result-content">
                <div className="result-subheading">
                  <div><h3>{algorithms.find((item) => item.id === activeAlgorithm).fullName}</h3><span>Process execution timeline</span></div>
                  <div className="avg-pill">AVG WT <b>{selectedResult.avgWt.toFixed(2)}</b></div>
                </div>
                <div className="gantt-wrap">
                  <div className="gantt-track" style={{ width: `max(100%, ${selectedResult.totalTime * 36}px)` }}>
                    {selectedResult.segments.map((segment, index) => (
                      <div
                        className="gantt-segment"
                        key={`${segment.process}-${index}`}
                        style={{
                          flexGrow: segment.end - segment.start,
                          '--process-color': `hsl(${(segment.colorIndex * 67 + 157) % 360} 62% 65%)`,
                        }}
                        title={`${segment.process}: ${segment.start}–${segment.end}`}
                      >
                        <b>{segment.process}</b><span>{segment.end - segment.start}</span>
                      </div>
                    ))}
                    <div className="gantt-times" aria-hidden="true">
                      {[...new Set([...selectedResult.segments.map((segment) => segment.start), selectedResult.totalTime])].map((time) => (
                        <span key={`time-${time}`} style={{ left: `${(time / selectedResult.totalTime) * 100}%` }}>{time}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>PROCESS</th><th>AT</th><th>BT</th><th>ST</th><th>CT</th><th>TAT</th><th>WT</th></tr></thead>
                    <tbody>{selectedResult.rows.map((row) => (
                      <tr key={row.id}><td><span className="table-process-dot" style={{ '--process-color': `hsl(${(row.index * 67 + 157) % 360} 62% 65%)` }} />{row.id}</td><td>{row.at}</td><td>{row.bt}</td><td>{row.st}</td><td>{row.ct}</td><td>{row.tat}</td><td className="waiting-cell">{row.wt}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="formula-note"><span>i</span> TAT = CT − AT <i /> WT = TAT − BT <i /> AVG WT = ผลรวม WT ÷ จำนวนโปรเซส</div>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="footer"><span>CPU LAB <b>·</b> OPERATING SYSTEMS</span><span>CPU Scheduling Algorithm Visualizer</span></footer>
    </div>
  )
}

export default App
