import type { CategoryId, Project } from "@/types";

/**
 * The 12-project agricultural catalogue (2 per category). Descriptive content only:
 * no yields, prices, acreage, capacity, returns or locations have been supplied, so `analysis`,
 * `funding`, `risks`, `useOfFunds` and `milestones` are intentionally empty until real, verified values exist.
 * Ids p-1…p-6 are kept stable because seeded demo investments reference them.
 */

type Entry = {
  id: string;
  slug: string;
  title: string;
  category: CategoryId;
  crop: string;
  summary: string;
  fullDescription: string;
  activities: string[];
  objectives: string[];
  featured?: boolean;
};

const ENTRIES: Entry[] = [
  {
    id: "p-1", slug: "organic-vegetable-cultivation", title: "Organic Vegetable Cultivation", category: "crop_cultivation", crop: "Vegetables", featured: true,
    summary: "Support sustainable vegetable farming through responsible cultivation, soil management and efficient agricultural operations.",
    fullDescription: "A sustainable farming project focused on cultivating organic vegetables using responsible agricultural practices.",
    activities: ["Seasonal vegetable cultivation", "Soil health management", "Organic farming practices", "Harvesting and distribution"],
    objectives: ["Cultivate vegetables using responsible organic practices", "Maintain and improve soil health over successive seasons", "Harvest and distribute produce efficiently"],
  },
  {
    id: "p-2", slug: "organic-fruit-cultivation", title: "Organic Fruit Cultivation", category: "crop_cultivation", crop: "Fruit",
    summary: "Grow selected fruit varieties using sustainable practices, from orchard development to harvest.",
    fullDescription: "A fruit cultivation project focused on growing selected fruit varieties using sustainable farming practices.",
    activities: ["Fruit orchard development", "Irrigation management", "Soil and crop maintenance", "Harvesting and distribution"],
    objectives: ["Establish and maintain healthy fruit trees", "Manage water use through planned irrigation", "Harvest and distribute fruit responsibly"],
  },
  {
    id: "p-3", slug: "sustainable-dairy-farm", title: "Sustainable Dairy Farm", category: "dairy_farming", crop: "Milk", featured: true,
    summary: "Responsible cattle management, milk production and day-to-day dairy farm operations.",
    fullDescription: "A dairy farming project focused on responsible cattle management, milk production, and farm operations.",
    activities: ["Dairy cattle management", "Feed and nutrition management", "Milk production", "Farm hygiene and maintenance"],
    objectives: ["Keep cattle healthy through sound feeding and care", "Produce milk under hygienic conditions", "Maintain clean, well-run farm facilities"],
  },
  {
    id: "p-4", slug: "integrated-dairy-development", title: "Integrated Dairy Development", category: "dairy_farming", crop: "Milk and fodder",
    summary: "Combine cattle care, fodder cultivation and efficient dairy management in one integrated project.",
    fullDescription: "An integrated dairy project combining cattle care, fodder cultivation, and efficient dairy farm management.",
    activities: ["Fodder cultivation", "Dairy infrastructure development", "Cattle health management", "Milk collection and handling"],
    objectives: ["Grow fodder to support the herd's feeding needs", "Develop dairy infrastructure suited to the operation", "Handle and collect milk with care"],
  },
  {
    id: "p-5", slug: "freshwater-fish-farming", title: "Freshwater Fish Farming", category: "fish_farming", crop: "Freshwater fish",
    summary: "Freshwater aquaculture through managed pond systems, from preparation to harvest.",
    fullDescription: "A freshwater aquaculture project focused on fish cultivation through managed pond systems.",
    activities: ["Pond preparation", "Fish stocking and feeding", "Water quality monitoring", "Harvesting and distribution"],
    objectives: ["Prepare and manage ponds for fish cultivation", "Monitor water quality throughout the cycle", "Harvest and distribute fish responsibly"],
  },
  {
    id: "p-6", slug: "intensive-aquaculture-development", title: "Intensive Aquaculture Development", category: "fish_farming", crop: "Cultured fish",
    summary: "Improve fish farming operations through structured water and feeding management.",
    fullDescription: "An aquaculture development project focused on improving fish farming operations through structured water and feeding management.",
    activities: ["Aquaculture infrastructure", "Water quality management", "Fish feeding and monitoring", "Harvest planning"],
    objectives: ["Develop suitable aquaculture infrastructure", "Manage water quality and feeding in a structured way", "Plan harvests in advance"],
  },
  {
    id: "p-7", slug: "broiler-poultry-farming", title: "Broiler Poultry Farming", category: "poultry_farming", crop: "Broiler chickens",
    summary: "Broiler production with suitable housing, feeding and hygiene management.",
    fullDescription: "A poultry farming project focused on broiler production with appropriate housing, feeding, and hygiene management.",
    activities: ["Poultry housing", "Feed management", "Bird health monitoring", "Farm hygiene"],
    objectives: ["Provide suitable, clean housing for the birds", "Manage feed and monitor bird health", "Maintain strong farm hygiene"],
  },
  {
    id: "p-8", slug: "layer-poultry-farming", title: "Layer Poultry Farming", category: "poultry_farming", crop: "Eggs",
    summary: "Egg production through responsible layer bird management and efficient poultry operations.",
    fullDescription: "An egg production project focused on responsible layer bird management and efficient poultry operations.",
    activities: ["Layer bird management", "Egg collection", "Feeding and nutrition", "Hygiene and quality control"],
    objectives: ["Manage layer birds responsibly", "Collect and handle eggs with care", "Maintain hygiene and quality control"],
  },
  {
    id: "p-9", slug: "agricultural-waste-to-biogas", title: "Agricultural Waste-to-Biogas", category: "biogas_composting", crop: "Biogas",
    summary: "Explore converting suitable agricultural and organic waste into renewable biogas.",
    fullDescription: "A renewable energy project that explores converting suitable agricultural and organic waste into biogas.",
    activities: ["Organic waste collection", "Biogas plant operations", "Renewable energy utilization", "Residue management"],
    objectives: ["Collect suitable organic waste for conversion", "Operate a biogas plant responsibly", "Manage residue after digestion"],
  },
  {
    id: "p-10", slug: "organic-compost-production", title: "Organic Compost Production", category: "biogas_composting", crop: "Compost",
    summary: "Convert suitable organic agricultural waste into compost for soil improvement.",
    fullDescription: "A composting project focused on converting suitable organic agricultural waste into compost for soil improvement.",
    activities: ["Organic waste segregation", "Compost preparation", "Decomposition management", "Compost screening and distribution"],
    objectives: ["Segregate and prepare organic waste for composting", "Manage decomposition carefully", "Screen and distribute finished compost"],
  },
  {
    id: "p-11", slug: "sustainable-timber-plantation", title: "Sustainable Timber Plantation", category: "agri_forestry", crop: "Timber trees",
    summary: "Cultivate suitable tree species for long-term agricultural and forestry management.",
    fullDescription: "A plantation project focused on cultivating suitable tree species for long-term agricultural and forestry management.",
    activities: ["Tree plantation", "Soil and water conservation", "Plantation maintenance", "Long-term growth monitoring"],
    objectives: ["Plant suitable tree species in an orderly layout", "Conserve soil and water", "Monitor growth over the long term"],
  },
  {
    id: "p-12", slug: "integrated-agroforestry", title: "Integrated Agroforestry", category: "agri_forestry", crop: "Trees and crops",
    summary: "Combine suitable tree species with compatible agricultural crops on the same land.",
    fullDescription: "An integrated agroforestry project combining suitable tree species with compatible agricultural crops.",
    activities: ["Tree and crop integration", "Land management", "Soil conservation", "Sustainable plantation maintenance"],
    objectives: ["Integrate trees with compatible crops", "Manage land sustainably", "Conserve soil across the system"],
  },
];

const toProject = (e: Entry): Project => ({
  id: e.id,
  slug: e.slug,
  ownerId: "owner-1",
  title: e.title,
  category: e.category,
  crop: e.crop,
  location: "Location to be confirmed",
  region: "Tamil Nadu",
  district: "",
  summary: e.summary,
  fullDescription: e.fullDescription,
  activities: e.activities,
  objectives: e.objectives,
  objective: e.objectives[0],
  productionMethod: "Details to be confirmed",
  certification: { status: "none", note: "No certification claimed." },
  stage: "preparation",
  status: "active_demo",
  durationMonths: 3,
  season: "To be confirmed",
  featured: e.featured ?? false,
  createdAt: "2026-10-01T10:00:00+05:30",
  updatedAt: "2026-10-28T10:00:00+05:30",
  funding: null,
  demoConfig: { investable: false, notInvestableReason: "Contribution enquiries only: project figures have not been supplied.", minAmount: 100, maxAmount: 25000 },
  analysis: null,
  risks: [],
  useOfFunds: [],
  milestones: [],
  updates: [],
  documentTitles: [],
  reviewComments: [],
});

export const SEED_PROJECTS: Project[] = ENTRIES.map(toProject);
