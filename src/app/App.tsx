// import { useState } from 'react'
import reactLogo from '../assets/icons/react.svg'
import viteLogo from '../assets/icons/vite.svg'
// import heroImg from '../assets/images/hero.png' 
import  MachineList  from '../features/machines/components/MachineList'
import './App.css'
import MachineStatus from '../features/machines/components/MachineStatus'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
    <div id='page'>
      <section id='center-section'>
      <div id="center">
        <MachineStatus />
        {/*           
            <div className="hero">
              <img src={heroImg} className="base" width="170" height="179" alt="" />
              <img src={reactLogo} className="framework" alt="React logo" />
              <img src={viteLogo} className="vite" alt="Vite logo" />
            </div>
            <div>
              <h1>Get started</h1>
              <p>
                Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
              </p>
            </div>
            <button
              type="button"
              className="counter"
              onClick={() => setCount((count) => count + 1)}
            >
              Count is {count}
            </button> */}
      </div>
          
          <div className="ticks"></div>

        <div className="ticks"></div>
        <section id="spacer"></section>
    </section>

      <section id='right-section'>
        <MachineList />
      </section>
    </div>
      
    </>
  )
}

export default App
