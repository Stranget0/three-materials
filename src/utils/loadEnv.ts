import { CubeTextureLoader, CubeRefractionMapping } from "three";

export function loadEnv() {
	const r = '/';

	const urls = [
		r + 'px.jpg', r + 'nx.jpg',
		r + 'py.jpg', r + 'ny.jpg',
		r + 'pz.jpg', r + 'nz.jpg'
	];

	const textureCube = new CubeTextureLoader().load(urls);
	textureCube.mapping = CubeRefractionMapping;
	return textureCube;
}
