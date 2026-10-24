import {
    EffectComposer,
    Vignette,
  } from "@react-three/postprocessing";
  
  const Effects = () => {
    return (
      <>
        <EffectComposer multisampling={0} disableNormalPass={true}>
          <Vignette eskil={false} offset={0.005} darkness={1} />
        </EffectComposer>
      </>
    );
  };
  export default Effects;
  