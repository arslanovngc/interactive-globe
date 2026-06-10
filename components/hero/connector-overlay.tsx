import type { RefObject } from "react";

type ConnectorOverlayProps = {
  layerRef: RefObject<HTMLDivElement | null>;
  connectorRef: RefObject<SVGPathElement | null>;
  dotRef: RefObject<HTMLDivElement | null>;
  cardDotRef: RefObject<HTMLDivElement | null>;
  initialPath: string;
};

export function ConnectorOverlay({
  layerRef,
  connectorRef,
  dotRef,
  cardDotRef,
  initialPath,
}: ConnectorOverlayProps) {
  return (
    <div ref={layerRef} className="connector-layer" aria-hidden="true">
      <svg className="connector">
        <path ref={connectorRef} d={initialPath} />
      </svg>
      <div ref={dotRef} className="connector-dot" />
      <div ref={cardDotRef} className="connector-dot" />
    </div>
  );
}
