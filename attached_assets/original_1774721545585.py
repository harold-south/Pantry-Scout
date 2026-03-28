import requests
import math
import asyncio
from datetime import datetime, timedelta
import winsdk.windows.devices.geolocation as geolocation

HOME_LAT, HOME_LNG = ????, ???

SEARCH_DAYS = 5

# VERIFIED PROPERTY DATABASE (Bountiful to Orem)
PROPERTY_DB = {
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
    # NEW ENTRIES
    "6250 2200 W": "LDS Church",
    "3930 W 7875 S": "LDS Church",
    "934 W FREMONT AVE": "LDS Church",
    "2840 S 9000 W": "Catholic Church",
    "2064 S 800 W": "LDS Church",
    "3970 S 5200 W": "LDS Church",
    "1621 S 1100 E": "LDS Church",
    "6755 W 3800 S": "LDS Church",
    "3400 S 1100 E": "LDS Church"
}


async def get_gps_location():
    try:
        locator = geolocation.Geolocator()
        access_status = await locator.request_access_async()
        if access_status == geolocation.GeolocationAccessStatus.ALLOWED:
            pos = await locator.get_geoposition_async()
            return pos.coordinate.point.position.latitude, pos.coordinate.point.position.longitude
    except:
        pass
    return HOME_LAT, HOME_LNG


def calculate_distance(lat1, lon1, lat2, lon2):
    radius = 3958.8
    dlat, dlon = math.radians(lat1 - lat2), math.radians(lon1 - lon2)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat2)) * math.cos(math.radians(lat1)) * math.sin(dlon / 2) ** 2
    return radius * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def lookup_building(address):
    # Standardizing address for lookup
    addr = address.upper().replace(",", "").replace(".", "")
    addr = addr.replace("SOUTH", "S").replace("WEST", "W").replace("NORTH", "N").replace("EAST", "E")

    for key, owner in PROPERTY_DB.items():
        key_clean = key.replace(".", "").replace("SOUTH", "S").replace("WEST", "W").replace("NORTH", "N").replace(
            "EAST", "E")
        if key_clean in addr:
            return owner
    return "Private/Other Organization"


async def run_pantry_check():
    today = datetime.now().date()
    end_date = today + timedelta(days=SEARCH_DAYS)
    curr_lat, curr_lng = await get_gps_location()

    print("==================================================")
    print(f"   MOBILE PANTRY FINDER (BOUNTIFUL TO OREM)")
    print(f"   WINDOW: {today.strftime('%m-%d-%Y')} to {end_date.strftime('%m-%d-%Y')}")
    print("==================================================")

    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        url = "https://api.accessfood.org/api/MapInformation/LocationSearch"
        params = {'radius': '60', 'lat': str(curr_lat), 'lng': str(curr_lng), 'foodProgramAv': 'FoodProgramTypeId-4',
                  'regionId': '84', 'isMapV2': 'true'}
        res = requests.get(url, headers=headers, params=params).json()

        locations = res.get('item1', [])
        loc_map = {l['locationId']: l for l in locations}
        ids = ",".join([str(l['locationId']) for l in locations])

        h_url = "https://api.accessfood.org/api/MapInformation/MultipleLocations_LocationServiceSpecialHoursByFirstPage"
        h_params = {'LocationIds': ids, 'TimezoneOffsetMinutes': '420', 'PageSize': '500'}
        h_res = requests.get(h_url, headers=headers, params=h_params).json()
    except:
        print("Error fetching data from the API.")
        return

    events = []
    for entry in h_res:
        loc = loc_map.get(entry.get('id'))
        if not loc: continue
        for service in entry.get('data', []):
            for event in service.get('data', []):
                try:
                    dt = datetime.strptime(event.get('specialDate', '').split('T')[0], '%Y-%m-%d').date()
                    if today <= dt <= end_date:
                        addr = f"{loc.get('address1', '').strip()}, {loc.get('city', '').strip()}"
                        dist = calculate_distance(loc['latitude'], loc['longitude'], curr_lat, curr_lng)
                        events.append({
                            'date': dt.strftime('%m-%d-%Y'),
                            'day': dt.strftime('%A'),
                            'name': loc.get('locationName', 'N/A'),
                            'addr': addr,
                            'time': f"{event.get('startTime', '').strip()} - {event.get('endTime', '').strip()}",
                            'dist': dist,
                            'bld': lookup_building(addr),
                            'sort': dt
                        })
                except:
                    continue

    events.sort(key=lambda x: x['sort'])

    if not events:
        print("No events found for this window.")
    else:
        for e in events:
            print(f"DATE:      {e['date']} ({e['day']})")
            print(f"BUILDING:  {e['bld']}")
            print(f"LOCATION:  {e['name']}")
            print(f"ADDRESS:   {e['addr']}")
            print(f"TIME:      {e['time']}")
            print(f"DISTANCE:  {e['dist']:.2f} miles")
            print("-" * 50)

    print(f"TOTAL EVENTS REPORTED: {len(events)}")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_pantry_check())