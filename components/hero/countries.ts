import { feature } from "topojson-client";
import countries from "world-atlas/countries-10m.json";
import type { CountryFeature } from "./types";

export function getCountryFeatures() {
  const topology = countries as {
    objects: {
      countries: unknown;
    };
  };
  const collection = feature(
    topology as unknown as Parameters<typeof feature>[0],
    topology.objects.countries as unknown as Parameters<typeof feature>[1],
  ) as unknown as { features: CountryFeature[] };
  return collection.features;
}
