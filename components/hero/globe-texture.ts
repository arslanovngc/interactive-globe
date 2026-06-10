import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
} from "three";
import { TEXTURE_HEIGHT, TEXTURE_WIDTH } from "./constants";
import { mapStyle } from "./map-style";
import type { CountryFeature } from "./types";

function drawFeature(
  context: CanvasRenderingContext2D,
  country: CountryFeature,
  selected: boolean,
) {
  const polygons =
    country.geometry.type === "MultiPolygon"
      ? (country.geometry.coordinates as number[][][][])
      : [country.geometry.coordinates as number[][][]];
  const fill = selected ? mapStyle.activeCountry : mapStyle.country;
  const stroke = selected ? mapStyle.activeCountryBorder : mapStyle.countryBorder;

  for (const offset of [-TEXTURE_WIDTH, 0, TEXTURE_WIDTH]) {
    context.beginPath();
    polygons.forEach((polygon) => {
      polygon.forEach((ring) => {
        let previousLon: number | null = null;
        ring.forEach(([rawLon, lat], index) => {
          let lon = rawLon;
          if (previousLon !== null) {
            while (lon - previousLon > 180) lon -= 360;
            while (lon - previousLon < -180) lon += 360;
          }
          previousLon = lon;
          const x = ((lon + 180) / 360) * TEXTURE_WIDTH + offset;
          const y = ((90 - lat) / 180) * TEXTURE_HEIGHT;
          if (index === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        });
        context.closePath();
      });
    });

    context.fillStyle = fill;
    context.fill();

    if (selected) {
      context.save();
      context.clip();
      context.strokeStyle = mapStyle.activeCountryInnerShadow;
      context.lineWidth = 14;
      context.stroke();
      context.strokeStyle = mapStyle.activeCountryInnerShadow;
      context.lineWidth = 7;
      context.stroke();
      context.restore();
    }

    context.strokeStyle = stroke;
    context.lineWidth = selected ? 2.2 : 1.15;
    context.stroke();
  }
}

export function makeBaseGlobeCanvas(features: CountryFeature[]) {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = mapStyle.ocean;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  features.forEach((country) => drawFeature(context, country, false));

  return canvas;
}

export function makeCanvasTexture(canvas: HTMLCanvasElement, maxAnisotropy: number) {
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function makeActiveCountryTexture(
  selectedCountry: CountryFeature | undefined,
  maxAnisotropy: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  if (selectedCountry) {
    drawFeature(context, selectedCountry, true);
  }

  return makeCanvasTexture(canvas, maxAnisotropy);
}
