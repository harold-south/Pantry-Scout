import { Router, type IRouter, type Request, type Response } from "express";
import { GetPantryEventsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const PROPERTY_DB: Record<string, string> = {
  "1882 W INDIANA AVE": "The Other Side Village (Mobile Market)",
  "886 N STAR CREST DR": "LDS Church (Westpointe Ward)",
  "868 N STAR CREST DR": "LDS Church (Westpointe Ward)",
  "6250 W 2200 W": "LDS Church (Bennion Stake Center)",
  "3300 S 4440 W": "LDS Church (Granger 9th Ward - Tongan)",
  "9228 W 2700 S": "Magna Senior Center / LDS Adjacent",
  "8059 W 2700 S": "LDS Church (Magna East Stake)",
  "3175 S 3450 W": "LDS Church (Granger East Stake Center)",
  "1141 W 400 N": "LDS Church (Rose Park Stake Center)",
  "808 N 800 W": "LDS Church (Riverside Ward)",
  "142 W 800 S": "LDS Church (Central Stake Center)",
  "2702 S MAIN ST": "LDS Church (Burton Ward)",
  "74 S ORCHARD DR": "LDS Church (NSL / Center of Hope)",
  "1149 N 300 W": "LDS Church (Lehi Peaks Ward)",
  "1251 W 900 N": "LDS Church (Lehi Stake Center)",
  "1151 S REDWOOD RD": "Salt Lake City Mission",
  "6250 2200 W": "LDS Church",
  "3930 W 7875 S": "LDS Church",
  "934 W FREMONT AVE": "LDS Church",
  "2840 S 9000 W": "Catholic Church",
  "2064 S 800 W": "LDS Church",
  "3970 S 5200 W": "LDS Church",
  "1621 S 1100 E": "LDS Church",
  "6755 W 3800 S": "LDS Church",
  "3400 S 1100 E": "LDS Church",
};

const DEFAULT_LAT = 40.7707;
const DEFAULT_LNG = -111.8911;
const EARTH_RADIUS_MILES = 3958.8;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cleanAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/,/g, "")
    .replace(/\./g, "")
    .replace(/\bSOUTH\b/g, "S")
    .replace(/\bWEST\b/g, "W")
    .replace(/\bNORTH\b/g, "N")
    .replace(/\bEAST\b/g, "E");
}

function lookupBuilding(address: string): string {
  const cleaned = cleanAddress(address);
  for (const [key, owner] of Object.entries(PROPERTY_DB)) {
    const cleanKey = cleanAddress(key);
    if (cleaned.includes(cleanKey)) {
      return owner;
    }
  }
  return "Private/Other Organization";
}

function formatDateMMDDYYYY(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}-${d}-${y}`;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

router.get("/events", async (req: Request, res: Response) => {
  const lat = req.query["lat"] ? parseFloat(req.query["lat"] as string) : DEFAULT_LAT;
  const lng = req.query["lng"] ? parseFloat(req.query["lng"] as string) : DEFAULT_LNG;
  const days = req.query["days"] ? parseInt(req.query["days"] as string, 10) : 5;

  const useLat = isNaN(lat) ? DEFAULT_LAT : lat;
  const useLng = isNaN(lng) ? DEFAULT_LNG : lng;
  const useDays = isNaN(days) || days <= 0 ? 5 : days;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + useDays);

  const windowStart = formatDateMMDDYYYY(today);
  const windowEnd = formatDateMMDDYYYY(endDate);

  try {
    const headers = { "User-Agent": "Mozilla/5.0" };

    const searchUrl = new URL("https://api.accessfood.org/api/MapInformation/LocationSearch");
    searchUrl.searchParams.set("radius", "60");
    searchUrl.searchParams.set("lat", String(useLat));
    searchUrl.searchParams.set("lng", String(useLng));
    searchUrl.searchParams.set("foodProgramAv", "FoodProgramTypeId-4");
    searchUrl.searchParams.set("regionId", "84");
    searchUrl.searchParams.set("isMapV2", "true");

    const locRes = await fetch(searchUrl.toString(), { headers });
    if (!locRes.ok) {
      throw new Error(`Location search failed: ${locRes.status}`);
    }
    const locData = await locRes.json() as { item1?: Array<{ locationId: number; address1?: string; city?: string; latitude: number; longitude: number; locationName?: string }> };
    const locations = locData.item1 ?? [];

    if (locations.length === 0) {
      const response = GetPantryEventsResponse.parse({
        events: [],
        totalCount: 0,
        windowStart,
        windowEnd,
      });
      return res.json(response);
    }

    const locMap = new Map(locations.map((l) => [l.locationId, l]));
    const ids = locations.map((l) => l.locationId).join(",");

    const hoursUrl = new URL(
      "https://api.accessfood.org/api/MapInformation/MultipleLocations_LocationServiceSpecialHoursByFirstPage"
    );
    hoursUrl.searchParams.set("LocationIds", ids);
    hoursUrl.searchParams.set("TimezoneOffsetMinutes", "420");
    hoursUrl.searchParams.set("PageSize", "500");

    const hoursRes = await fetch(hoursUrl.toString(), { headers });
    if (!hoursRes.ok) {
      throw new Error(`Hours fetch failed: ${hoursRes.status}`);
    }
    const hoursData = await hoursRes.json() as Array<{
      id?: number;
      data?: Array<{ data?: Array<{ specialDate?: string; startTime?: string; endTime?: string }> }>;
    }>;

    const events: Array<{
      date: string;
      day: string;
      name: string;
      address: string;
      time: string;
      distanceMiles: number;
      buildingName: string;
      isoDate: string;
    }> = [];

    for (const entry of hoursData) {
      const loc = entry.id != null ? locMap.get(entry.id) : undefined;
      if (!loc) continue;

      for (const service of entry.data ?? []) {
        for (const event of service.data ?? []) {
          try {
            const rawDate = event.specialDate?.split("T")[0];
            if (!rawDate) continue;

            const eventDate = new Date(rawDate + "T00:00:00");
            if (isNaN(eventDate.getTime())) continue;
            if (eventDate < today || eventDate > endDate) continue;

            const address = `${(loc.address1 ?? "").trim()}, ${(loc.city ?? "").trim()}`;
            const distanceMiles = haversineDistance(loc.latitude, loc.longitude, useLat, useLng);
            const startTime = (event.startTime ?? "").trim();
            const endTime = (event.endTime ?? "").trim();

            events.push({
              date: formatDateMMDDYYYY(eventDate),
              day: getDayName(eventDate),
              name: loc.locationName ?? "N/A",
              address,
              time: `${startTime} - ${endTime}`,
              distanceMiles: Math.round(distanceMiles * 10) / 10,
              buildingName: lookupBuilding(address),
              isoDate: rawDate,
            });
          } catch {
            continue;
          }
        }
      }
    }

    events.sort((a, b) => {
      const dateCmp = a.isoDate.localeCompare(b.isoDate);
      if (dateCmp !== 0) return dateCmp;
      return a.distanceMiles - b.distanceMiles;
    });

    const response = GetPantryEventsResponse.parse({
      events,
      totalCount: events.length,
      windowStart,
      windowEnd,
    });

    return res.json(response);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pantry events");
    return res.status(500).json({
      error: "fetch_failed",
      message: "Failed to retrieve pantry events from upstream service",
    });
  }
});

export default router;
