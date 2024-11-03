import { useState , Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Effects, Scene , Loader } from './components/canvas'
import { Configurator } from './components/UI'

function App() {
  const [started, setStarted] = useState(false);
  return (
    <div className="relative z-0 w-screen h-screen overscroll-none overflow-y-hidden scrollbar-thin -ms-overflow-y-hidden">
     <Loader started={started} setStarted={setStarted} />
     <Canvas shadows camera={{ position: [4, 4, -12], fov: 35 }}>
     <Suspense>{started && <Scene />}</Suspense>
        {/* <Effects /> */}
    </Canvas>
    <Configurator />
    </div>
  )
}

export default App
