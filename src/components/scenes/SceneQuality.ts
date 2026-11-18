import { createContext, useContext } from 'react';

export const SceneQualityContext = createContext({ lowPower: false });

export function useSceneQuality() {
  return useContext(SceneQualityContext);
}
