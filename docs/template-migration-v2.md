# Catálogo de migración de plantillas V1 → V2

Las seis plantillas completas conservadas son `conversion`, `editorial`, `catalog`, `local`, `immersive` y `minimal`. Las demás entradas se reducen a una base V2 y, cuando aportan composición estructural real, a una sección de biblioteca.

| Base V2 | Presets V1 migrados | Secciones únicas recuperadas |
|---|---|---|
| conversion | Service, StudioSplit, Reverse, Metrics, Timeline, SplitStats, Blueprint | split hero, services bento, about stats, contact card |
| editorial | Editorial, Overlap, Collage, Portrait, Masthead, Folio, Journal, Atelier | reviews quotes, about overlap, gallery filmstrip |
| catalog | Catalog, Gridline, Columns, Accent, Market, Showcase, Boutique, Stack | services bento, poster hero |
| local | Local, Framed, Badges, Corner, Neighbor, Homestead, Storefront | contact card |
| immersive | Immersive, Manifesto, Panorama, Noir, Velocity, Pulse, Horizon, BigType | poster hero, gallery filmstrip, services bento |
| minimal | Minimal, Statement, Quote, Numbered, Ledger, Blank, Serif, Mono | reviews quotes |

El registro ejecutable y completo está en `LEGACY_TEMPLATE_MIGRATION`. Una entrada sin sección recuperada significa que su diferencia era únicamente tipografía, color, orden o decoración; el fingerprint estructural coincide con la base y se elimina como duplicado.

Biblioteca V2 inicial: split hero, poster hero, about overlap, about stats, services bento, gallery filmstrip, reviews quotes, FAQ split y contact card.
