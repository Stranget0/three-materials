import { Color, DirectionalLight, HemisphereLight, type Light } from "three";
import type { GUI } from "dat.gui";
import { ThreeController } from "./controller";

export function addBasicLights(controller: ThreeController, gui?: GUI) {
  const mainLight = new DirectionalLight(16777215, 1);
  const hemiLight = new HemisphereLight(16711422, 524288, 0.8);
  const subLight = new DirectionalLight(16777215, 0.5);

  mainLight.position.set(-0.8, -0.3, 6);
  subLight.position.set(-1, 1, 0);
  controller.scene.add(mainLight, hemiLight, subLight);
  controller.render();

  if (gui) {
    const f = gui.addFolder("Light");
    handleOptions(mainLight, f.addFolder("main"));
    handleOptions(subLight, f.addFolder("sub"));
    handleOptions(hemiLight, f.addFolder("hemi"));
  }
  function handleOptions(l: Light, f: GUI) {
    const params = { color: new Color(l.color).toJSON() };
		f.add(l, "visible").onFinishChange(() => controller.render());
    f.addColor(params, "color").onFinishChange((v) => {
      l.color.set(v);
      controller.render();
    });

    f.add(l, "intensity", 0, 1).onFinishChange(() => controller.render());

    const p = f.addFolder("position");
    p.add(l.position, "x").onFinishChange(() => controller.render());
    p.add(l.position, "y").onFinishChange(() => controller.render());
    p.add(l.position, "z").onFinishChange(() => controller.render());

		if(l.shadow){
			const s= f.addFolder("shadow")
			s.add(l,"castShadow").onFinishChange(()=> controller.render());
			s.add(l.shadow,"radius",0, 25,1).onFinishChange(()=> controller.render());
			s.add(l.shadow,"blurSamples", 1, 25, 1).onFinishChange(()=> controller.render());
		}
  }
  return { mainLight, hemiLight, subLight };
}
