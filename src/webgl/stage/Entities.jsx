import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { allEntities } from "../objects/registry";
import { useConfig } from "../../store/useConfig";
import { useUI } from "../../store/useUI";
import { SLUGS } from "../../data/catalog";

/** Mounts every configurable object once; they live for the whole session. */
export function Entities() {
  const entities = useMemo(() => allEntities(), []);

  // push config changes into the entities (material drops bleed from the drop point)
  useEffect(() => {
    const { configs } = useConfig.getState();
    for (const e of entities) e.configure(configs[e.slug], { immediate: true });
    return useConfig.subscribe((s, prev) => {
      for (const slug of SLUGS) {
        if (s.configs[slug] !== prev.configs[slug]) {
          const e = entities.find((x) => x.slug === slug);
          e.configure(s.configs[slug], { from: s.drop });
        }
      }
    });
  }, [entities]);

  useFrame((state, dt) => {
    for (const e of entities) e.update(dt, state);
  }, -5);

  return entities.map((e) => (
    <primitive
      key={e.slug}
      object={e.root}
      onPointerOver={(ev) => {
        ev.stopPropagation();
        useUI.getState().setHover(e.slug);
      }}
      onPointerOut={() => useUI.getState().hover === e.slug && useUI.getState().setHover(null)}
    />
  ));
}
