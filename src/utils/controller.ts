import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  OrthographicCamera,
  Light,
  Mesh,
  PCFSoftShadowMap,
} from "three";
import randomBetween from "./randomBetween";

export interface ThreeController {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: OrthographicCamera | PerspectiveCamera;
  render: VoidFunction;
}

export function createThreeController(containerSelector: string) {
  const container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) throw new Error("No canvas found");

  // basic threejs objects
  const { clientWidth: width, clientHeight: height } = container;
  const scene = new Scene();
  const camera = new PerspectiveCamera(90, width / height);
  const renderer = new WebGLRenderer({
    antialias: true,
  });

  renderer.setSize(width, height);
  container.append(renderer.domElement);

  window.addEventListener("resize", () => {
    const container = renderer.domElement.parentElement!;
    const { width, height } = container.getBoundingClientRect();

    renderer.setPixelRatio(window.devicePixelRatio);
    if ("aspect" in camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    renderer.setSize(width, height);
    renderer.render(scene, camera);
  });

  const controller: ThreeController = {
    scene,
    camera,
    renderer,
    render() {
      this.renderer.render(this.scene, this.camera);
    },
  };
  return controller;
}

export function enableShadows(
  ...controllerOrLightOrMeshArr: (ThreeController | Light | Mesh)[]
) {
  for (const clm of controllerOrLightOrMeshArr) {
    if (clm instanceof Light) {
      clm.castShadow = true;

      if (clm.shadow) clm.shadow.bias = 0.0001;
    } else if (clm instanceof Mesh) {
      clm.castShadow = true;
      clm.receiveShadow = true;
    } else {
      clm.renderer.shadowMap.enabled = true;
      clm.renderer.shadowMap.type = PCFSoftShadowMap;
    }
  }

  return controllerOrLightOrMeshArr;
}

export function randomTransform(
  {
    minTranslate = -0.5,
    maxTranslate = 0.5,
    minRotate = -180,
    maxRotate = 180,
    random = Math.random,
  }: {
    minTranslate?: number;
    maxTranslate?: number;
    minRotate?: number;
    maxRotate?: number;
    random?: () => number;
  } = {},
  ...meshes: Mesh[]
) {
  for (const mesh of meshes) {
    mesh.position.set(
      randomBetween(minTranslate, maxTranslate, random),
      randomBetween(minTranslate, maxTranslate, random),
      randomBetween(minTranslate, maxTranslate, random)
    );

    mesh.rotation.set(
      randomBetween(minRotate, maxRotate, random),
      randomBetween(minRotate, maxRotate, random),
      randomBetween(minRotate, maxRotate, random)
    );
  }

  return meshes;
}
