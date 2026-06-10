"use client";

import { type RefObject, useEffect } from "react";
import { geoContains } from "d3-geo";
import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import {
  CAMERA_DISTANCE,
  GLOBE_RADIUS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE,
  round,
} from "./constants";
import {
  makeActiveCountryTexture,
  makeBaseGlobeCanvas,
  makeCanvasTexture,
} from "./globe-texture";
import {
  dragQuaternion,
  localPointToLonLat,
  lonLatToVector,
} from "./globe-utils";
import type { CountryFeature, GlobeHandle } from "./types";

type UseInteractiveGlobeParams = {
  mountRef: RefObject<HTMLDivElement | null>;
  cardRef: RefObject<HTMLElement | null>;
  connectorLayerRef: RefObject<HTMLDivElement | null>;
  tooltipRef: RefObject<HTMLDivElement | null>;
  connectorRef: RefObject<SVGPathElement | null>;
  dotRef: RefObject<HTMLDivElement | null>;
  cardDotRef: RefObject<HTMLDivElement | null>;
  globeRef: RefObject<GlobeHandle | null>;
  selectedCountryRef: RefObject<CountryFeature | undefined>;
  selectedCentroidRef: RefObject<{ lon: number; lat: number }>;
  countryFeatures: CountryFeature[];
  selectedId: string;
  setSelectedId: (id: string) => void;
};

export function useInteractiveGlobe({
  mountRef,
  cardRef,
  connectorLayerRef,
  tooltipRef,
  connectorRef,
  dotRef,
  cardDotRef,
  globeRef,
  selectedCountryRef,
  selectedCentroidRef,
  countryFeatures,
  selectedId,
  setSelectedId,
}: UseInteractiveGlobeParams) {
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, CAMERA_DISTANCE);

    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.setClearColor(new Color(0x000000), 0);
    mount.appendChild(renderer.domElement);

    const group = new Group();
    group.rotation.set(0.9, 2.96, 0);
    scene.add(group);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const baseCanvas = makeBaseGlobeCanvas(countryFeatures);
    if (!baseCanvas) {
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      return;
    }

    const baseTexture = makeCanvasTexture(baseCanvas, maxAnisotropy);
    const activeTexture = makeActiveCountryTexture(
      selectedCountryRef.current,
      maxAnisotropy,
    );
    const material = new MeshBasicMaterial({ map: baseTexture });
    const sphere = new Mesh(
      new SphereGeometry(GLOBE_RADIUS, 192, 128),
      material,
    );
    group.add(sphere);

    const activeMaterial = new MeshBasicMaterial({
      map: activeTexture ?? undefined,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
    });
    const activeSphere = new Mesh(
      new SphereGeometry(GLOBE_RADIUS * 1.0015, 192, 128),
      activeMaterial,
    );
    group.add(activeSphere);

    const halo = new Mesh(
      new SphereGeometry(GLOBE_RADIUS * 1.018, 192, 128),
      new MeshBasicMaterial({
        color: 0x7fb7ff,
        transparent: true,
        opacity: 0.08,
      }),
    );
    group.add(halo);

    globeRef.current = {
      group,
      sphere,
      activeSphere,
      baseTexture,
      activeTexture,
      maxAnisotropy,
    };

    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const drag = {
      active: false,
      moved: false,
      x: 0,
      y: 0,
      downX: 0,
      downY: 0,
    };

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };

    const updateOverlay = () => {
      const tooltip = tooltipRef.current;
      const connector = connectorRef.current;
      const dot = dotRef.current;
      const cardDot = cardDotRef.current;
      const card = cardRef.current;
      const layer = connectorLayerRef.current;

      if (
        !selectedCountryRef.current ||
        !tooltip ||
        !connector ||
        !dot ||
        !cardDot ||
        !card ||
        !layer
      ) {
        return;
      }

      const { lon, lat } = selectedCentroidRef.current;
      const local = lonLatToVector(lon, lat);
      const world = local.applyMatrix4(group.matrixWorld);
      const projected = world.project(camera);
      const x = ((projected.x + 1) / 2) * MAP_WIDTH;
      const y = ((-projected.y + 1) / 2) * MAP_HEIGHT;
      const clampedX = Math.min(Math.max(x, 170), 610);
      const clampedY = Math.min(Math.max(y, 120), 370);

      const stageRect = mount.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const startX = stageRect.left + (clampedX / MAP_WIDTH) * stageRect.width;
      const startY = stageRect.top + (clampedY / MAP_HEIGHT) * stageRect.height;
      const layerStart = {
        x: startX - layerRect.left,
        y: startY - layerRect.top,
      };
      const cardAnchor = {
        x: cardRect.left - layerRect.left,
        y: cardRect.top + cardRect.height / 2 - layerRect.top,
      };

      const midX = layerStart.x + 78;
      const direction = cardAnchor.y >= layerStart.y ? 1 : -1;
      const bend = 14;
      const line = `M ${round(layerStart.x)} ${round(layerStart.y)} H ${round(
        midX,
      )} Q ${round(midX + bend)} ${round(layerStart.y)} ${round(
        midX + bend,
      )} ${round(layerStart.y + direction * bend)} V ${round(
        cardAnchor.y - direction * bend,
      )} Q ${round(midX + bend)} ${round(cardAnchor.y)} ${round(
        midX + bend * 2,
      )} ${round(cardAnchor.y)} H ${round(cardAnchor.x)}`;

      tooltip.style.left = `${(clampedX / MAP_WIDTH) * 100}%`;
      tooltip.style.top = `${(clampedY / MAP_HEIGHT) * 100}%`;
      connector.setAttribute("d", line);
      dot.style.left = `${round(layerStart.x)}px`;
      dot.style.top = `${round(layerStart.y)}px`;
      cardDot.style.left = `${round(cardAnchor.x)}px`;
      cardDot.style.top = `${round(cardAnchor.y)}px`;
    };

    let frameId = 0;
    const animate = () => {
      renderer.render(scene, camera);
      updateOverlay();
      frameId = requestAnimationFrame(animate);
    };

    const onPointerDown = (event: PointerEvent) => {
      drag.active = true;
      drag.moved = false;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.downX = event.clientX;
      drag.downY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.active) {
        return;
      }
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.hypot(event.clientX - drag.downX, event.clientY - drag.downY) > 5) {
        drag.moved = true;
      }
      group.quaternion.premultiply(dragQuaternion(dx, dy));
      drag.x = event.clientX;
      drag.y = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      drag.active = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
      if (drag.moved) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(sphere)[0];
      if (!hit) {
        return;
      }
      const local = group.worldToLocal(hit.point.clone());
      const coordinates = localPointToLonLat(local);
      const country = countryFeatures.find((item) =>
        geoContains(item as never, [coordinates.lon, coordinates.lat]),
      );
      if (country?.id !== undefined) {
        setSelectedId(String(country.id).padStart(3, "0"));
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) {
        return;
      }
      event.preventDefault();
      const nextDistance = camera.position.z + event.deltaY * 0.004;
      camera.position.z = Math.min(
        Math.max(nextDistance, MIN_CAMERA_DISTANCE),
        MAX_CAMERA_DISTANCE,
      );
      camera.updateProjectionMatrix();
    };

    resize();
    animate();
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resize);

    return () => {
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      sphere.geometry.dispose();
      activeSphere.geometry.dispose();
      halo.geometry.dispose();
      material.dispose();
      activeMaterial.dispose();
      baseTexture.dispose();
      activeTexture?.dispose();
      mount.removeChild(renderer.domElement);
      globeRef.current = null;
    };
  }, [countryFeatures, setSelectedId]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) {
      return;
    }
    const nextTexture = makeActiveCountryTexture(
      selectedCountryRef.current,
      globe.maxAnisotropy,
    );
    if (!nextTexture) {
      return;
    }
    globe.activeTexture?.dispose();
    globe.activeTexture = nextTexture;
    globe.activeSphere.material.map = nextTexture;
    globe.activeSphere.material.needsUpdate = true;
  }, [countryFeatures, globeRef, selectedCountryRef, selectedId]);
}
