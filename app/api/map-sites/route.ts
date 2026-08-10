import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { publishedMapSiteWhere } from "@/lib/site/public-map";

// Country centroid coordinates for fallback
const COUNTRY_COORDS: Record<string, [number, number]> = {
  nicaragua: [12.87, -85.21],
  méxico: [23.63, -102.55],
  mexico: [23.63, -102.55],
  "estados unidos": [37.09, -95.71],
  "costa rica": [9.75, -83.75],
  "el salvador": [13.79, -88.90],
  guatemala: [15.78, -90.23],
  honduras: [15.20, -86.24],
  panamá: [8.54, -80.78],
  panama: [8.54, -80.78],
  colombia: [4.57, -74.30],
  españa: [40.46, -3.75],
  espana: [40.46, -3.75],
  brasil: [-14.24, -51.93],
  brazil: [-14.24, -51.93],
  argentina: [-38.42, -63.62],
  venezuela: [6.42, -66.59],
  chile: [-35.68, -71.54],
  perú: [-9.19, -75.02],
  peru: [-9.19, -75.02],
};

// City-level lookup (city name lowercase → [lat, lon])
const CITY_COORDS: Record<string, [number, number]> = {
  // Nicaragua
  managua: [12.13, -86.29],
  león: [12.43, -86.88],
  leon: [12.43, -86.88],
  granada: [11.93, -85.96],
  masaya: [11.97, -86.09],
  "san juan del sur": [11.25, -85.87],
  // México
  "ciudad de méxico": [19.43, -99.13],
  "ciudad de mexico": [19.43, -99.13],
  cdmx: [19.43, -99.13],
  monterrey: [25.69, -100.32],
  guadalajara: [20.66, -103.35],
  cancún: [21.16, -86.85],
  cancun: [21.16, -86.85],
  puebla: [19.04, -98.20],
  tijuana: [32.53, -117.04],
  mérida: [20.97, -89.62],
  merida: [20.97, -89.62],
  "san luis potosí": [22.15, -100.98],
  "san luis potosi": [22.15, -100.98],
  querétaro: [20.59, -100.39],
  queretaro: [20.59, -100.39],
  // Estados Unidos
  "new york": [40.71, -74.01],
  "nueva york": [40.71, -74.01],
  "los angeles": [34.05, -118.24],
  miami: [25.77, -80.19],
  houston: [29.76, -95.37],
  chicago: [41.88, -87.63],
  dallas: [32.78, -96.80],
  // Costa Rica
  "san josé": [9.93, -84.08],
  "san jose": [9.93, -84.08],
  liberia: [10.63, -85.43],
  jacó: [9.61, -84.63],
  jaco: [9.61, -84.63],
  // El Salvador
  "san salvador": [13.69, -89.19],
  "santa ana": [13.99, -89.56],
  // Guatemala
  "ciudad de guatemala": [14.64, -90.51],
  antigua: [14.56, -90.73],
  quetzaltenango: [14.83, -91.52],
  // Honduras
  tegucigalpa: [14.07, -87.21],
  "san pedro sula": [15.50, -88.03],
  // Panamá
  "ciudad de panamá": [8.99, -79.52],
  "ciudad de panama": [8.99, -79.52],
  colón: [9.36, -79.90],
  colon: [9.36, -79.90],
  // Colombia
  bogotá: [4.71, -74.07],
  bogota: [4.71, -74.07],
  medellín: [6.25, -75.56],
  medellin: [6.25, -75.56],
  cali: [3.44, -76.52],
  cartagena: [10.39, -75.48],
  barranquilla: [10.96, -74.80],
  bucaramanga: [7.13, -73.13],
  pereira: [4.81, -75.69],
  // España
  madrid: [40.42, -3.70],
  barcelona: [41.39, 2.16],
  valencia: [39.47, -0.38],
  sevilla: [37.39, -5.99],
  bilbao: [43.26, -2.93],
  málaga: [36.72, -4.42],
  malaga: [36.72, -4.42],
  // Brasil
  "são paulo": [-23.55, -46.63],
  "sao paulo": [-23.55, -46.63],
  "rio de janeiro": [-22.91, -43.17],
  brasília: [-15.78, -47.93],
  brasilia: [-15.78, -47.93],
  "belo horizonte": [-19.92, -43.94],
  salvador: [-12.97, -38.50],
  fortaleza: [-3.72, -38.54],
  curitiba: [-25.43, -49.27],
  manaus: [-3.10, -60.02],
  recife: [-8.05, -34.88],
  porto: [-30.03, -51.23],
  "porto alegre": [-30.03, -51.23],
  // Argentina
  "buenos aires": [-34.61, -58.38],
  córdoba: [-31.42, -64.19],
  cordoba: [-31.42, -64.19],
  rosario: [-32.95, -60.64],
  mendoza: [-32.89, -68.85],
  tucumán: [-26.82, -65.22],
  tucuman: [-26.82, -65.22],
  salta: [-24.79, -65.41],
  "mar del plata": [-38.00, -57.56],
  // Venezuela
  caracas: [10.49, -66.88],
  maracaibo: [10.63, -71.64],
  barquisimeto: [10.07, -69.32],
  maturín: [9.75, -63.18],
  maturin: [9.75, -63.18],
  // Chile
  santiago: [-33.46, -70.65],
  valparaíso: [-33.05, -71.62],
  valparaiso: [-33.05, -71.62],
  concepción: [-36.83, -73.05],
  concepcion: [-36.83, -73.05],
  antofagasta: [-23.65, -70.40],
  temuco: [-38.74, -72.59],
  // Perú
  lima: [-12.05, -77.04],
  arequipa: [-16.41, -71.54],
  cusco: [-13.53, -71.97],
  cuzco: [-13.53, -71.97],
  trujillo: [-8.11, -79.03],
  chiclayo: [-6.77, -79.84],
  piura: [-5.19, -80.63],
};

function resolveCoords(location: string | null): [number, number] | null {
  if (!location) return null;
  const parts = location.split(",").map((p) => p.trim().toLowerCase());
  // Try city first
  for (const part of parts) {
    if (CITY_COORDS[part]) return CITY_COORDS[part];
  }
  // Try country (last part)
  const country = parts[parts.length - 1];
  return COUNTRY_COORDS[country] ?? null;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await consumeRateLimit("map-sites", ip, 60, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  try {
    const sites = await prisma.site.findMany({
      where: publishedMapSiteWhere,
      select: {
        id: true,
        businessName: true,
        location: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    const markers = sites
      .map((site) => {
        const coords = resolveCoords(site.location);
        if (!coords) return null;
        return {
          id: site.id,
          label: site.businessName,
          location: site.location,
          lat: coords[0],
          lon: coords[1],
          createdAt: site.createdAt.toISOString(),
        };
      })
      .filter(Boolean);

    return NextResponse.json(markers);
  } catch {
    return NextResponse.json([]);
  }
}
