import { useState } from "react";
import "./App.css";
import MachineList from "../features/machines/components/MachineList";
import { MachineDetail } from "../features/machines/components/MachineDetail";

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <span className="dashboard__logo" aria-hidden="true">
            🚜
          </span>
          <div>
            <h1 className="dashboard__title">AgriTelemetry</h1>
            <p className="dashboard__tagline">Fleet telemetry monitoring</p>
          </div>
        </div>
      </header>

      <main className="dashboard__main">
        <section className="panel" aria-label="Machine list">
          <MachineList selectedId={selectedId} onSelect={setSelectedId} />
        </section>
        <section className="panel" aria-label="Machine detail">
          <MachineDetail machineId={selectedId} />
        </section>
      </main>
    </div>
  );
}

export default App;
