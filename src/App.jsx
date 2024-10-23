import { Canvas } from '@react-three/fiber'
import { Effects, Scene } from './components/canvas'
import { Configurator } from './components/UI'

function App() {

  return (
    <div className="relative z-0 w-screen h-screen overscroll-none overflow-y-hidden scrollbar-thin -ms-overflow-y-hidden">
     <Canvas shadows camera={{ position: [4, 4, -12], fov: 35 }}>
        <Scene />
        {/* <Effects /> */}
    </Canvas>
    <Configurator />
    </div>
  )
}

export default App
