import { OrbitControls, Stage } from '@react-three/drei'
import { Table } from './Table'
import { useConfiguratorStore } from '../../store/hooks';


function Scene() {
    const { legs } = useConfiguratorStore();

  return (
    <>
     <Stage
        intensity={1.5}
        environment="apartment"
        // shadows={{
        //   type: "accumulative",
        //   color: "#ececec",
        //   colorBlend: 2,
        //   opacity: 2,
        // }}
        adjustCamera={2}
      >
       <Table />
    </Stage>
    <OrbitControls
      makeDefault
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
    />
  </>
  )
}

export default Scene