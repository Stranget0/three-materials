import { ThreeController } from "./controller";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function addOrbit(controller: ThreeController) {
	const controls = new OrbitControls(
		controller.camera,
		controller.renderer.domElement
	);

	animate();
	function animate() {
		requestAnimationFrame(animate);
		controls.update();
		controller.render();
	}
}
