# Suite completa de pruebas

Fecha: 2026-06-29  
Proyecto: Cluster Web Builder  
Resultado final: **10 PASS / 0 FAIL**

## Resultados

| Prueba | Resultado | Evidencia |
| --- | --- | --- |
| `check:design` | PASS | 26 composiciones, 26 variantes About, 6 familias y 6 perfiles de movimiento |
| `lint` | PASS | 0 errores; 1 advertencia preexistente sobre `<img>` en `OnboardingWizard.tsx` |
| `test:ui` | PASS | 7 rutas × 4 viewports, sin overflow y sin controles sin etiqueta |
| `test:home-modes` | PASS | Modo guiado, avanzado, validación, móvil y payload `one_page` |
| `test:multi-user` | PASS | Publicación, formularios, contactos, ZIP y aislamiento multiusuario |
| `test:m3` | PASS | Plan, límites, dominio, proxy y marca blanca |
| `test:m4` | PASS | Selector 3/6, persistencia, orden estructural, paleta y proyecto único |
| `test:fast-prompt` | PASS | Pesca → Immersive; copy medido; 12.925 s |
| `test:marketing` | PASS | Home, builder separado, navegación y 10 páginas públicas |
| `build` | PASS | Next.js 16.2.9 compiló, TypeScript terminó y generó 29 rutas |

## Control de copy verificado

La prueba de prompt comprueba sobre el registro persistido:

- SEO title de 25-65 caracteres.
- Meta description de 80-165 caracteres.
- Hero title de 8-72 caracteres.
- Hero subtitle de 12-110 caracteres.
- Hero body de 45-240 caracteres.
- CTA de 1-5 palabras.
- Ausencia de frases genéricas prohibidas.

## Incidencia de infraestructura

La primera corrida dinámica apuntó al puerto 3033. Next.js cerró esa instancia porque el mismo proyecto ya estaba activo en el puerto 3000; siete pruebas registraron `ECONNREFUSED`. Se conservaron los logs de ese intento para trazabilidad.

La suite se repitió contra la instancia activa del puerto 3000 y las siete pruebas pasaron. No se contabiliza el primer intento como fallo del producto.

## Archivos

- `suite-results.json`: primer intento y diagnóstico ambiental.
- `suite-retry-results.json`: resultados dinámicos finales.
- `suite-build-result.json`: resultado del build.
- `suite-retry-*.log`: salida completa de cada prueba dinámica aprobada.
- `suite-build.log`: salida completa del build.

El proyecto quedó nuevamente disponible en `http://localhost:3000` después del build.
