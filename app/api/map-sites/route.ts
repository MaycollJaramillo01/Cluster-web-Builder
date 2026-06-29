import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  // España
  madrid: [40.42, -3.70],
  barcelona: [41.39, 2.16],
  valencia: [39.47, -0.38],
  sevilla: [37.39, -5.99],
  bilbao: [43.26, -2.93],
  málaga: [36.72, -4.42],
  malaga: [36.72, -4.42],
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

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      where: { location: { not: null } },
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
