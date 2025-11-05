<!-- DataCentreMap.vue -->

<script setup lang="ts">
import { ref, onMounted } from "vue";

// TypeScript interfaces
interface Coordinates {
  lat: number;
  lng: number;
}

interface DataCenter {
  id: number;
  name: string;
  location: string;
  coordinates: Coordinates;
  status: string;
}

interface Props {
  dataCenters?: DataCenter[];
  selectedCenter?: DataCenter | null;
  mapWidth?: string;
  mapHeight?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Sample data center locations - in a real application, this would come from an API or props
const props = withDefaults(defineProps<Props>(), {
  dataCenters: () => [
    {
      id: 1,
      name: "North America - East",
      location: "Virginia, USA",
      coordinates: { lat: 37.7749, lng: -77.6823 },
      status: "active",
    },
    {
      id: 2,
      name: "Europe - Central",
      location: "Frankfurt, Germany",
      coordinates: { lat: 50.1109, lng: 8.6821 },
      status: "active",
    },
    {
      id: 3,
      name: "Asia Pacific - South",
      location: "Mumbai, India",
      coordinates: { lat: 19.076, lng: 72.8777 },
      status: "active",
    },
    {
      id: 4,
      name: "Asia Pacific - East",
      location: "Tokyo, Japan",
      coordinates: { lat: 35.6762, lng: 139.6503 },
      status: "maintenance",
    },
    {
      id: 5,
      name: "South America",
      location: "São Paulo, Brazil",
      coordinates: { lat: -23.5505, lng: -46.6333 },
      status: "active",
    },
    {
      id: 6,
      name: "Australia - East",
      location: "Sydney, Australia",
      coordinates: { lat: -33.8688, lng: 151.2093 },
      status: "active",
    },
  ],
  selectedCenter: null,
  mapWidth: "100%",
  mapHeight: "500px",
  primaryColor: "#3b82f6",
  secondaryColor: "#1e3a8a",
});

// Reactive data
const selectedDataCenter = ref(props.selectedCenter || null);
const mapLoaded = ref(false);

// Status colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "maintenance":
      return "bg-yellow-500";
    case "inactive":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

// Initialize the map
const initMap = (): void => {
  // We're using a simple SVG map implementation here
  // In a production app, you would use a proper mapping library like Leaflet or Google Maps
  mapLoaded.value = true;
};

// Handle marker click
const handleMarkerClick = (dataCenter: DataCenter): void => {
  selectedDataCenter.value = dataCenter;
};

// Get marker position based on coordinates
const getMarkerPosition = (coordinates: Coordinates): { x: number; y: number } => {
  // Convert geographic coordinates to SVG coordinates
  // This is a simplified version that works for our basic world map
  // For a real implementation, you'd need proper map projection logic
  const x = ((coordinates.lng + 180) / 360) * 1000; // 1000 is our SVG width
  const y = ((90 - coordinates.lat) / 180) * 500; // 500 is our SVG height
  return { x, y };
};

// Lifecycle hooks
onMounted(() => {
  initMap();
});
</script>

<template>
  <div class="data-center-map-container">
    <div class="flex flex-col">
      <!-- Map Header -->
      <div class="mb-4">
        <h2 class="text-xl font-bold">Global Data Center Locations</h2>
        <p class="text-sm text-gray-600">Click on a marker to view details</p>
      </div>

      <!-- Map Area -->
      <div
        class="relative"
        :style="{ width: mapWidth, height: mapHeight }">
        <div
          class="absolute inset-0 border rounded-lg overflow-hidden bg-gray-100">
          <!-- World Map SVG -->
          <svg
            viewBox="0 0 1000 500"
            class="w-full h-full"
            style="background-color: #f8fafc">
            <!-- Simplified world map paths -->
            <!-- This is a very simplified world map. In a real implementation, you would use a proper GeoJSON or SVG world map -->
            <path
              d="M191,106 L203,106 L212,128 L231,121 L249,132 L255,153 L279,162 L285,187 L272,220 L256,236 L219,262 L208,294 L226,304 L226,322 L214,334 L180,345 L179,367 L167,374 L158,393 L160,407 L141,420 L118,417 L117,429 L101,430 L98,442 L80,444 L63,458 L63,471 L32,477 L18,470 L8,443 L11,428 L-5,409 L-4,388 L0,377 L20,369 L24,357 L42,352 L57,339 L84,340 L102,330 L126,330 L129,343 L146,345 L159,329 L183,328 L185,312 L175,292 L186,282 L180,273 L183,253 L174,241 L176,225 L195,219 L201,196 L190,184 L200,161 L193,136 L175,124 L175,106 Z"
              fill="#e5e7eb"
              stroke="#cbd5e1"
              stroke-width="1" />
            <!-- North America -->
            <path
              d="M151,84 L166,84 L182,92 L185,106 L175,124 L193,136 L200,161 L190,184 L201,196 L195,219 L176,225 L174,241 L183,253 L180,273 L186,282 L175,292 L185,312 L183,328 L159,329 L146,345 L129,343 L126,330 L102,330 L84,340 L57,339 L42,352 L24,357 L20,369 L0,377 L-4,388 L-5,409 L11,428 L8,443 L18,470 L32,477 L63,471 L63,458 L80,444 L98,442 L101,430 L117,429 L118,417 L141,420 L160,407 L158,393 L167,374 L179,367 L180,345 L214,334 L226,322 L226,304 L208,294 L219,262 L256,236 L272,220 L285,187 L279,162 L255,153 L249,132 L231,121 L212,128 L203,106 L191,106"
              fill="#e5e7eb"
              stroke="#cbd5e1"
              stroke-width="1" />
            <!-- Europe -->
            <path
              d="M473,101 L486,107 L504,104 L513,113 L530,114 L552,123 L568,121 L583,129 L600,125 L605,131 L620,125 L634,130 L646,124 L665,127 L675,137 L689,136 L701,145 L709,145 L717,155 L714,171 L720,183 L705,194 L690,190 L679,197 L665,194 L647,201 L638,193 L623,196 L614,191 L610,196 L591,196 L581,191 L558,202 L549,200 L546,190 L538,186 L530,188 L525,180 L515,180 L501,171 L488,173 L477,168 L453,171 L444,178 L430,172 L421,177 L414,175 L406,185 L397,179 L387,179 L385,168 L391,156 L397,152 L415,150 L424,144 L428,135 L436,134 L442,124 L450,121 L458,110 L473,101"
              fill="#e5e7eb"
              stroke="#cbd5e1"
              stroke-width="1" />
            <!-- Asia -->
            <path
              d="M714,171 L720,183 L705,194 L690,190 L679,197 L665,194 L647,201 L638,193 L623,196 L614,191 L610,196 L591,196 L581,191 L558,202 L549,200 L546,190 L538,186 L530,188 L525,180 L515,180 L501,171 L488,173 L477,168 L453,171 L444,178 L430,172 L421,177 L414,175 L406,185 L397,179 L387,179 L385,168 L391,156 L397,152 L415,150 L424,144 L428,135 L436,134 L442,124 L450,121 L458,110 L473,101 L486,107 L504,104 L513,113 L530,114 L552,123 L568,121 L583,129 L600,125 L605,131 L620,125 L634,130 L646,124 L665,127 L675,137 L689,136 L701,145 L709,145 L717,155 L714,171 M791,165 L792,186 L800,196 L794,213 L807,215 L815,238 L827,242 L844,265 L850,293 L858,300 L869,319 L859,332 L853,358 L837,373 L828,393 L805,401 L792,395 L776,395 L762,389 L750,390 L745,387 L731,386 L721,385 L704,365 L694,351 L681,342 L677,334 L671,327 L675,316 L663,302 L666,291 L654,285 L651,272 L641,268 L638,254 L625,246 L618,233 L619,226 L632,210 L636,196 L645,187 L663,186 L675,179 L689,177 L701,186 L714,185 L720,173 L733,163 L746,165 L756,157 L766,157 L772,149 L791,165"
              fill="#e5e7eb"
              stroke="#cbd5e1"
              stroke-width="1" />
            <!-- Australia -->
            <path
              d="M834,393 L842,386 L858,387 L873,378 L889,377 L909,383 L921,375 L933,377 L938,385 L951,388 L959,379 L966,380 L967,388 L973,390 L973,400 L966,408 L958,417 L963,427 L956,431 L947,431 L938,423 L925,417 L909,420 L899,415 L883,417 L873,424 L861,418 L851,420 L835,415 L826,416 L822,409 L826,396 L834,393"
              fill="#e5e7eb"
              stroke="#cbd5e1"
              stroke-width="1" />
            <!-- South America -->
            <path
              d="M265,339 L273,343 L279,358 L290,370 L293,382 L291,394 L298,401 L301,410 L299,419 L307,427 L302,441 L309,450 L307,459 L315,468 L319,482 L310,487 L294,481 L284,470 L269,467 L264,450 L251,437 L249,426 L241,419 L237,402 L233,391 L238,378 L248,372 L259,361 L261,350 L265,339"
              fill="#e5e7eb"
              stroke="#cbd5e1"
              stroke-width="1" />
            <!-- Africa -->
            <path
              d="M459,189 L473,192 L487,201 L507,202 L524,212 L535,221 L547,226 L561,241 L574,242 L579,263 L584,273 L576,282 L569,304 L563,316 L558,332 L551,343 L536,351 L533,359 L523,368 L515,382 L507,383 L499,379 L486,381 L465,377 L459,365 L453,361 L446,349 L438,339 L427,333 L419,322 L418,311 L425,303 L421,294 L427,284 L433,253 L433,234 L438,228 L449,228 L456,218 L459,207 L455,195 L459,189"
              fill="#e5e7eb"
              stroke="#cbd5e1"
              stroke-width="1" />

            <!-- Data Center Markers -->
            <g
              v-for="dataCenter in dataCenters"
              :key="dataCenter.id">
              <circle
                :cx="getMarkerPosition(dataCenter.coordinates).x"
                :cy="getMarkerPosition(dataCenter.coordinates).y"
                r="10"
                :fill="primaryColor"
                stroke="#ffffff"
                stroke-width="2"
                class="cursor-pointer transform transition-transform hover:scale-125"
                @click="handleMarkerClick(dataCenter)" />
              <circle
                :cx="getMarkerPosition(dataCenter.coordinates).x"
                :cy="getMarkerPosition(dataCenter.coordinates).y"
                r="4"
                :class="getStatusColor(dataCenter.status)"
                stroke="#ffffff"
                stroke-width="1" />
            </g>
          </svg>
        </div>
      </div>

      <!-- Data Center Information -->
      <div
        class="mt-4 p-4 border rounded-lg bg-white shadow-sm"
        v-if="selectedDataCenter">
        <h3 class="text-lg font-semibold">{{ selectedDataCenter.name }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <p class="text-sm text-gray-600">
              Location:
              <span class="font-medium text-gray-800">{{
                selectedDataCenter.location
              }}</span>
            </p>
            <p class="text-sm text-gray-600">
              Coordinates:
              <span class="font-medium text-gray-800">
                {{ selectedDataCenter.coordinates.lat.toFixed(4) }},
                {{ selectedDataCenter.coordinates.lng.toFixed(4) }}
              </span>
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">
              Status:
              <span class="inline-flex items-center">
                <span
                  class="w-2 h-2 rounded-full mr-1.5"
                  :class="getStatusColor(selectedDataCenter.status)"></span>
                <span class="font-medium text-gray-800">{{
                  selectedDataCenter.status.charAt(0).toUpperCase() +
                  selectedDataCenter.status.slice(1)
                }}</span>
              </span>
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="mt-4 p-4 border rounded-lg bg-white shadow-sm text-gray-500 italic">
        Click on a data center marker to view details
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-center-map-container {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>
