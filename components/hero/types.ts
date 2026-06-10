import type { Mesh, MeshBasicMaterial, SphereGeometry, Texture } from "three";
import type { Group } from "three";

export type CountryFeature = {
  id: string | number;
  properties?: {
    name?: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
};

export type Point = {
  x: number;
  y: number;
};

export type GlobeHandle = {
  group: Group;
  sphere: Mesh<SphereGeometry, MeshBasicMaterial>;
  activeSphere: Mesh<SphereGeometry, MeshBasicMaterial>;
  baseTexture: Texture;
  activeTexture: Texture | null;
  maxAnisotropy: number;
};
