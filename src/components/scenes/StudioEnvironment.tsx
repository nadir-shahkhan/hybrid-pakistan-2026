import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import { useDeviceQuality } from '../../hooks/useDeviceQuality';

export function StudioEnvironment({ reflective = false }: { reflective?: boolean }) {
  const { lowPower } = useDeviceQuality();

  return (
    <>
      <color attach="background" args={[reflective ? '#455154' : '#080c0d']} />
      <fog attach="fog" args={[reflective ? '#455154' : '#080c0d', 13, 58]} />
      <ambientLight intensity={reflective ? .95 : .5} />
      <hemisphereLight args={['#eff7fa', reflective ? '#687171' : '#07100e', reflective ? 2 : 1.1]} />
      <spotLight
        position={[5, 10, 5]}
        angle={0.42}
        penumbra={0.9}
        intensity={110}
        color="#f1f7ff"
        castShadow={!lowPower}
        shadow-mapSize={[lowPower ? 256 : 1024, lowPower ? 256 : 1024]}
      />
      <spotLight position={[-8, 6, -4]} angle={0.5} penumbra={1} intensity={80} color={reflective ? '#e1edf0' : '#35d0b5'} />
      <pointLight position={[7, 3, -6]} intensity={reflective ? 55 : 35} color={reflective ? '#fff5e7' : '#4385ff'} />
      <Environment resolution={reflective ? 256 : 128}>
        {reflective && <color attach="background" args={['#8b999e']} />}
        {reflective && <Lightformer form="rect" intensity={3} color="#fffdf7" position={[0,5,0]} rotation-x={Math.PI/2} scale={[9,4,1]} />}
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 6, -5]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={3} color={reflective ? '#e3eeee' : '#a5fff0'} position={[-5, 3, 2]} rotation-y={Math.PI / 2} scale={[6, 1, 1]} />
        <Lightformer form="rect" intensity={3} color={reflective ? '#f4ece0' : '#8fb5ff'} position={[5, 2, 0]} rotation-y={-Math.PI / 2} scale={[5, 1, 1]} />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.27} receiveShadow>
        <planeGeometry args={[90, 90]} />
        {reflective && !lowPower ? (
          <MeshReflectorMaterial
            color="#485152"
            metalness={0.72}
            roughness={0.42}
            mirror={0.4}
            blur={[280, 70]}
            resolution={512}
            mixBlur={1.2}
            mixStrength={1.1}
            depthScale={0.5}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.4}
          />
        ) : (
          <meshStandardMaterial color="#0c1213" metalness={0.6} roughness={0.5} />
        )}
      </mesh>
      <gridHelper args={[70, 70, '#253436', '#152022']} position-y={-0.255} material-transparent material-opacity={0.24} />
    </>
  );
}
