import {
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  PlaneGeometry,
  SphereGeometry,
  Texture,
  TextureLoader,
  TorusKnotGeometry,
} from "three";
import {
  createThreeController,
  enableShadows,
  randomTransform,
} from "./utils/controller";

import { addBasicLights } from "./utils/lights";
import { Refractor } from "three/examples/jsm/objects/Refractor.js";
import seededRandom from "./utils/seededRandom";
import { addOrbit } from "./utils/addOrbit";
import { loadEnv } from "./utils/loadEnv";
import { GUI } from "dat.gui";

const gui = new GUI();
const controller = createThreeController("#material-scene");
const textureCube = loadEnv();

controller.scene.background = textureCube;
controller.scene.environment = textureCube;
const lights = addBasicLights(controller, gui);

controller.camera.position.set(0, 0, 5);

const plane = createPlane(20);
const box = createBox();
const knot = createKnot();
const sphere1 = createCustomShaderSphere();
const sphere2 = createPhysicalSphere(textureCube);
const sphere3 = createPhongSphere(textureCube);

plane.position.set(0, 0, -4);

const randomNumber = seededRandom(3);
randomTransform(
  { minTranslate: -4, maxTranslate: 4, random: randomNumber },
  box,
  knot,
  sphere1,
  sphere2
);

enableShadows(
  controller,
  box,
  sphere1,
  sphere2,
  sphere3,
  lights.mainLight,
  // lights.subLight
);
knot.castShadow = true;
plane.receiveShadow = true;

controller.scene.add(plane, box, knot, sphere1, sphere2, sphere3);

addOrbit(controller);

controller.render();

function createBox() {
  const params = { color: 0xff0000 };
  const g = new BoxGeometry(1, 1);
  const m = new MeshBasicMaterial(params);
  const f = gui.addFolder("Box Material");
  f.addColor(params, "color").onFinishChange(() => {
    m.color.set(params.color);
    controller.render();
  });
  f.add(m, "opacity", 0, 1).onFinishChange(() => controller.render());
  // f.add(m,"map").onFinishChange(()=>controller.render())
  return new Mesh(g, m);
}

function createKnot() {
  const threeTone = new TextureLoader().load("/threeTone.jpg");
  threeTone.minFilter = NearestFilter;
  threeTone.magFilter = NearestFilter;

  const fourTone = new TextureLoader().load("/fourTone.jpg");
  fourTone.minFilter = NearestFilter;
  fourTone.magFilter = NearestFilter;

  const fiveTone = new TextureLoader().load("/fiveTone.jpg");
  fiveTone.minFilter = NearestFilter;
  fiveTone.magFilter = NearestFilter;
  const params = { color: 0x9900ff, gradientMap: threeTone };
  const tones: { [k: string]: Texture } = { threeTone, fourTone, fiveTone };

  const g = new TorusKnotGeometry();
  const m = new MeshToonMaterial(params);
  const f = gui.addFolder("Knot Material");

  f.addColor(params, "color").onFinishChange(() => {
    m.color.set(params.color);
    controller.render();
  });
  f.add(m, "opacity", 0, 1).onFinishChange(() => controller.render());
  f.add(params, "gradientMap", Object.keys(tones)).onFinishChange((tone) => {
    m.gradientMap = tones[tone];
    controller.render();
  });
  return new Mesh(g, m);
}

function createPlane(size = 5) {
  const g = new PlaneGeometry(size, size);
  const m = new MeshStandardMaterial({ color: 0xbbbbbb, side: DoubleSide });
  return new Mesh(g, m);
}

// Custom Shader Refractive
// Based on https://threejs.org/examples/?q=refrac#webgl_refraction and three/jsm/shaders/WaterRefractionShader.js
// Refractor is used to capture area behind mesh and save it into a texture
function createCustomShaderSphere() {
  const g = new SphereGeometry();
  const color = 0xeeeeee;
  const shader = {
    uniforms: {
      color: {
        value: new Color(color),
      },
      tDiffuse: {
        value: null,
      },

      tDudv: {
        value: null,
      },

      textureMatrix: {
        value: null,
      },
    },

    vertexShader: `
			uniform mat4 textureMatrix;
	
			varying vec2 vUv;
			varying vec4 vUvRefraction;
	
			void main() {
	
				vUv = uv;
	
				vUvRefraction = textureMatrix * vec4( position, 1.0 );
	
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	
			}`,

    fragmentShader: `
			uniform vec3 color;
			uniform sampler2D tDiffuse;
			uniform sampler2D tDudv;
	
			varying vec2 vUv;
			varying vec4 vUvRefraction;
	
			float blendOverlay( float base, float blend ) {
				return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
			}
	
			vec3 blendOverlay( vec3 base, vec3 blend ) {
				return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ),blendOverlay( base.b, blend.b ) );
			}
	
			void main() {
				vec2 distortedUv = texture2D( tDudv, vec2( vUv.x, vUv.y ) ).rg * 0.2;
				distortedUv = vUv.xy + vec2( distortedUv.x, distortedUv.y );
				vec2 distortion = ( texture2D( tDudv, distortedUv ).rg * 2.0 - 1.0 ) * 0.2;
	
				vec4 uv = vec4( vUvRefraction );
				uv.xy += distortion;
	
				vec4 base = texture2DProj( tDiffuse, uv );
	
				gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );
	
				#include <tonemapping_fragment>
				#include <colorspace_fragment>
	
			}`,
  };

  return new Refractor(g, {
    color,
    shader,
    textureWidth: 1024,
    textureHeight: 1024,
  });
}

// Physical Shader Refractive
function createPhysicalSphere(envMap?: Texture) {
  const g = new SphereGeometry();
  const params = {
    color: 0xffffff,
    transmission: 1,
    roughness: 0,
    thickness: 0.5,
    envMap,
  };

  const m = new MeshPhysicalMaterial(params);
  const f = gui.addFolder("Physical Sphere");
  f.addColor(params, "color").onFinishChange(() => {
    m.color.set(params.color);
    controller.render();
  });
  f.add(m, "transmission", 0, 1).onFinishChange(() => controller.render());
  f.add(m, "roughness", 0, 1).onFinishChange(() => controller.render());
  f.add(m, "thickness", 0, 1).onFinishChange(() => controller.render());
  f.add(m, "ior", 1, 2).onFinishChange(() => controller.render());

  return new Mesh(g, m);
}

// Phong Shader Refractive
function createPhongSphere(envMap?: Texture) {
	const params = {
		color: 0xccddff,
		refractionRatio: 0.98,
		envMap,
		reflectivity: 0.9,
		transparent: true,
	};
  const m = new MeshPhongMaterial(params);
  const g = new SphereGeometry();
	
  const f = gui.addFolder("Phong Sphere");
  f.addColor(params, "color").onFinishChange(() => {
    m.color.set(params.color);
    controller.render();
  });
  f.add(m, "refractionRatio", 0, 1).onFinishChange(() => controller.render());
  f.add(m, "reflectivity", 0, 1).onFinishChange(() => controller.render());
  f.add(m, "transparent",).onFinishChange(() => controller.render());
  return new Mesh(g, m);
}
