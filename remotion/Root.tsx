import {Composition} from "remotion";
import {R3CityIntro} from "./R3CityIntro";

export const RemotionRoot = () => {
  return (
    <Composition
      id="R3CityIntro"
      component={R3CityIntro}
      durationInFrames={240}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
