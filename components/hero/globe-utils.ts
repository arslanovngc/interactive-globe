import { Quaternion, Vector3 } from "three";
import { GLOBE_RADIUS } from "./constants";

export function lonLatToVector(lon: number, lat: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = ((lon + 180) / 360) * Math.PI * 2;

  return new Vector3(
    -GLOBE_RADIUS * Math.cos(theta) * Math.sin(phi),
    GLOBE_RADIUS * Math.cos(phi),
    GLOBE_RADIUS * Math.sin(theta) * Math.sin(phi),
  );
}

export function dragQuaternion(dx: number, dy: number) {
  const yaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx * 0.006);
  const pitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy * 0.004);
  return yaw.multiply(pitch);
}

export function localPointToLonLat(point: Vector3) {
  const normalized = point.clone().normalize();
  const theta = Math.atan2(normalized.z, -normalized.x);
  const wrappedTheta = theta < 0 ? theta + Math.PI * 2 : theta;
  return {
    lon: (wrappedTheta / (Math.PI * 2)) * 360 - 180,
    lat: 90 - Math.acos(normalized.y) * (180 / Math.PI),
  };
}
