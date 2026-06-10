'use client';

import { useMemo, useRef, useState } from 'react';
import { geoCentroid } from 'd3-geo';
import { CARD_ANCHOR, MAP_HEIGHT, MAP_WIDTH, round } from './constants';
import { ConnectorOverlay } from './connector-overlay';
import { getCountryFeatures } from './countries';
import { CountryCard } from './country-card';
import { useInteractiveGlobe } from './use-interactive-globe';
import type { CountryFeature, GlobeHandle } from './types';

function initialConnectorPath() {
  const selectedPoint = { x: round(520), y: round(250) };
  const midX = selectedPoint.x + 136;
  const midY = selectedPoint.y;
  const turnY = CARD_ANCHOR.y;

  return `M ${selectedPoint.x} ${selectedPoint.y} H ${midX} Q ${
    midX + 24
  } ${midY} ${midX + 24} ${midY + 24} V ${turnY - 24} Q ${midX + 24} ${turnY} ${midX + 48} ${turnY} H ${CARD_ANCHOR.x}`;
}

export function HeroMap() {
  const [selectedId, setSelectedId] = useState('643');
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const connectorLayerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const connectorRef = useRef<SVGPathElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const cardDotRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeHandle | null>(null);
  const selectedCountryRef = useRef<CountryFeature | undefined>(undefined);
  const selectedCentroidRef = useRef({ lon: 90, lat: 62 });

  const countryFeatures = useMemo(() => getCountryFeatures(), []);
  const selectedCountry = countryFeatures.find((country) => String(country.id).padStart(3, '0') === selectedId);
  const selectedName = selectedCountry?.properties?.name ?? 'Russia';
  const selectedCentroidArray = selectedCountry ? geoCentroid(selectedCountry as never) : [90, 62];

  selectedCountryRef.current = selectedCountry;
  selectedCentroidRef.current = {
    lon: selectedCentroidArray[0],
    lat: selectedCentroidArray[1],
  };

  useInteractiveGlobe({
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
  });

  return (
    <>
      <main className='hero'>
        <section className='hero__inner' aria-label='Interactive country map'>
          <div className='map-shell'>
            <div className='map-stage'>
              <div ref={mountRef} className='globe-canvas' aria-label='Draggable interactive globe' />

              <div
                ref={tooltipRef}
                className='country-tooltip'
                style={{
                  left: `${(520 / MAP_WIDTH) * 100}%`,
                  top: `${(250 / MAP_HEIGHT) * 100}%`,
                }}
              >
                <span className='country-tooltip__content'>
                  <span className='country-tooltip__name'>{selectedName}</span>
                </span>
              </div>
            </div>
          </div>

          <CountryCard cardRef={cardRef} countryName={selectedName} />
          <ConnectorOverlay
            layerRef={connectorLayerRef}
            connectorRef={connectorRef}
            dotRef={dotRef}
            cardDotRef={cardDotRef}
            initialPath={initialConnectorPath()}
          />
        </section>
      </main>
    </>
  );
}
