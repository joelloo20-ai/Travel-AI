import type { Activity, ItineraryDay, TripPace, InterestTag } from "../types";

export interface DestinationTemplate {
  id: string;
  destination: string;
  country: string;
  name: string;
  tagline: string;
  coverImage: string;
  days: number;
  pace: TripPace;
  interests: InterestTag[];
  bestSeason: string;
  avgDailyBudget: number; // USD per person
  itinerary: ItineraryDay[];
}

function act(
  id: string,
  time: string,
  title: string,
  description: string,
  category: Activity["category"],
  durationMins: number,
  estCost: number,
  location: string
): Activity {
  return { id, time, title, description, category, durationMins, estCost, location };
}

function day(id: string, dayNumber: number, title: string, activities: Activity[]): ItineraryDay {
  return { id, dayNumber, date: null, title, activities };
}

export const DESTINATION_TEMPLATES: DestinationTemplate[] = [
  {
    id: "dest-taiwan",
    destination: "Taipei",
    country: "Taiwan",
    name: "Taipei in 4 Days",
    tagline: "Night markets, hot springs, and a mountain village straight out of Spirited Away.",
    coverImage: "https://images.unsplash.com/photo-1470004914212-05527e49370b?w=1200&q=80",
    days: 4,
    pace: "balanced",
    interests: ["food", "culture", "nature"],
    bestSeason: "Oct–Dec, Mar–Apr",
    avgDailyBudget: 90,
    itinerary: [
      day("tw-d1", 1, "Arrival & Ximending", [
        act("tw-1-1", "09:30", "Arrival & check-in", "Land in Taipei, settle in, and grab an EasyCard for the MRT.", "logistics", 90, 0, "Taoyuan / Taipei"),
        act("tw-1-2", "13:00", "Din Tai Fung xiaolongbao lunch", "The original Din Tai Fung branch — go early to skip the queue.", "food", 75, 20, "Xinyi"),
        act("tw-1-3", "15:00", "Taipei 101 observation deck", "Views over the city and the building's famous tuned mass damper.", "culture", 90, 20, "Xinyi"),
        act("tw-1-4", "18:30", "Ximending street food crawl", "Taipei's Harajuku-esque youth district — bubble tea, fried chicken, night market stalls.", "food", 120, 20, "Ximending"),
      ]),
      day("tw-d2", 2, "Jiufen & Shifen Day Trip", [
        act("tw-2-1", "09:00", "Bus to Jiufen Old Street", "Lantern-lit mountain village overlooking the sea; the inspiration behind Spirited Away's bathhouse.", "culture", 150, 15, "Jiufen"),
        act("tw-2-2", "13:00", "Taiwanese tea house lunch", "Tea and small plates overlooking the mountains.", "food", 75, 18, "Jiufen"),
        act("tw-2-3", "15:30", "Shifen sky lantern release", "Write a wish on a paper lantern and release it over the old railway tracks.", "adventure", 90, 12, "Shifen"),
        act("tw-2-4", "19:00", "Raohe Night Market", "One of Taipei's oldest night markets — pepper buns and stinky tofu.", "food", 90, 15, "Songshan"),
      ]),
      day("tw-d3", 3, "Museums & Hot Springs", [
        act("tw-3-1", "09:30", "National Palace Museum", "One of the world's largest collections of Chinese art and artifacts.", "culture", 150, 12, "Shilin"),
        act("tw-3-2", "13:30", "Beef noodle soup lunch", "Taiwan's unofficial national dish at a local favorite.", "food", 60, 10, "Shilin"),
        act("tw-3-3", "15:30", "Beitou hot springs", "Natural thermal baths in a valley just outside the city center.", "relaxation", 150, 25, "Beitou"),
        act("tw-3-4", "19:30", "Shilin Night Market", "Taipei's largest and most famous night market.", "food", 120, 20, "Shilin"),
      ]),
      day("tw-d4", 4, "Longshan Temple & Departure", [
        act("tw-4-1", "09:30", "Longshan Temple", "A working Buddhist and Taoist temple dating to 1738, still busy with worshippers.", "culture", 60, 0, "Wanhua"),
        act("tw-4-2", "11:00", "Bopiliao Historic Block", "Restored Qing-dynasty street just next to the temple.", "culture", 60, 0, "Wanhua"),
        act("tw-4-3", "13:00", "Last-day dumplings & souvenirs", "Final meal and a stop at a local market for gifts.", "shopping", 90, 15, "Wanhua"),
        act("tw-4-4", "16:00", "Check-out & departure", "Head to the airport — allow ~1h from central Taipei.", "logistics", 90, 0, "Taipei"),
      ]),
    ],
  },
  {
    id: "dest-japan",
    destination: "Tokyo & Kyoto",
    country: "Japan",
    name: "Tokyo & Kyoto Highlights",
    tagline: "Neon megacity energy, then temples, bamboo groves, and geisha streets.",
    coverImage: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
    days: 6,
    pace: "packed",
    interests: ["culture", "food", "nightlife"],
    bestSeason: "Mar–May, Oct–Nov",
    avgDailyBudget: 130,
    itinerary: [
      day("jp-d1", 1, "Arrival & Shibuya/Shinjuku", [
        act("jp-1-1", "10:00", "Arrival & check-in", "Land in Tokyo, get a Suica/Pasmo card, and settle in.", "logistics", 120, 0, "Narita/Haneda"),
        act("jp-1-2", "14:00", "Shibuya Crossing & Hachiko", "The world's busiest pedestrian crossing, then find the famous loyal dog statue.", "culture", 60, 0, "Shibuya"),
        act("jp-1-3", "16:00", "Shibuya Sky observation deck", "Open-air rooftop views across the city at golden hour.", "culture", 90, 25, "Shibuya"),
        act("jp-1-4", "19:00", "Omoide Yokocho izakaya alley", "Tiny smoke-filled yakitori bars in a postwar alleyway near Shinjuku Station.", "nightlife", 120, 35, "Shinjuku"),
      ]),
      day("jp-d2", 2, "Asakusa, Ueno & teamLab", [
        act("jp-2-1", "09:00", "Senso-ji Temple & Nakamise-dori", "Tokyo's oldest temple, with a market street of traditional snacks and crafts leading to it.", "culture", 120, 10, "Asakusa"),
        act("jp-2-2", "12:30", "Tonkatsu lunch", "Crispy breaded pork cutlet — an Asakusa specialty.", "food", 60, 15, "Asakusa"),
        act("jp-2-3", "15:00", "teamLab Planets digital art museum", "Immersive, barefoot-through-water digital art installations.", "culture", 120, 30, "Toyosu"),
        act("jp-2-4", "19:00", "Ameyoko Market food stalls", "Ueno's bustling market street, great for cheap izakaya-style eats.", "food", 90, 20, "Ueno"),
      ]),
      day("jp-d3", 3, "Harajuku, Meiji Shrine & Akihabara", [
        act("jp-3-1", "09:30", "Meiji Shrine", "Forested shrine dedicated to Emperor Meiji, a calm escape in the middle of the city.", "culture", 90, 0, "Harajuku"),
        act("jp-3-2", "11:30", "Takeshita Street", "Harajuku's famously colorful, quirky fashion and crepe street.", "shopping", 90, 15, "Harajuku"),
        act("jp-3-3", "14:00", "Ramen lunch", "A bowl at a well-reviewed local ramen counter.", "food", 45, 12, "Harajuku"),
        act("jp-3-4", "16:00", "Akihabara electronics & anime district", "Arcades, retro game shops, and anime/manga megastores.", "culture", 150, 20, "Akihabara"),
      ]),
      day("jp-d4", 4, "Bullet Train to Kyoto & Fushimi Inari", [
        act("jp-4-1", "08:30", "Shinkansen to Kyoto", "Bullet train, about 2h15m — book a window seat for Mt. Fuji views.", "logistics", 150, 130, "Tokyo → Kyoto"),
        act("jp-4-2", "12:30", "Kyoto station soba lunch", "Quick bowl before heading out to explore.", "food", 45, 10, "Kyoto"),
        act("jp-4-3", "14:30", "Fushimi Inari Shrine", "Thousands of vermillion torii gates winding up the mountainside.", "culture", 150, 0, "Fushimi"),
        act("jp-4-4", "19:00", "Pontocho Alley dinner", "Narrow lantern-lit dining alley along the Kamo River.", "food", 90, 30, "Pontocho"),
      ]),
      day("jp-d5", 5, "Arashiyama & Gion", [
        act("jp-5-1", "09:00", "Arashiyama Bamboo Grove", "Towering bamboo stalks along a quiet walking path.", "nature", 60, 0, "Arashiyama"),
        act("jp-5-2", "10:30", "Tenryu-ji Temple gardens", "A UNESCO World Heritage Zen garden right by the bamboo grove.", "culture", 60, 6, "Arashiyama"),
        act("jp-5-3", "13:00", "Kaiseki-style lunch", "A refined multi-course Kyoto lunch.", "food", 90, 35, "Arashiyama"),
        act("jp-5-4", "16:00", "Gion geisha district walk", "Preserved wooden machiya townhouses; a chance to spot a geiko at dusk.", "culture", 120, 0, "Gion"),
      ]),
      day("jp-d6", 6, "Kinkaku-ji & Departure", [
        act("jp-6-1", "09:00", "Kinkaku-ji (Golden Pavilion)", "A Zen temple covered in gold leaf, reflected in its pond.", "culture", 75, 5, "Kita-ku"),
        act("jp-6-2", "11:30", "Nishiki Market", "Kyoto's 400-year-old covered food market — great for last-minute snacks and gifts.", "shopping", 75, 20, "Nishiki"),
        act("jp-6-3", "14:00", "Shinkansen back to Tokyo", "Return bullet train timed to connect with your flight.", "logistics", 150, 130, "Kyoto → Tokyo"),
        act("jp-6-4", "18:00", "Check-out & departure", "Head to the airport for your flight home.", "logistics", 90, 0, "Tokyo"),
      ]),
    ],
  },
  {
    id: "dest-thailand",
    destination: "Bangkok",
    country: "Thailand",
    name: "Bangkok in 4 Days",
    tagline: "Golden temples, floating markets, and some of the best street food on earth.",
    coverImage: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80",
    days: 4,
    pace: "balanced",
    interests: ["food", "culture", "nightlife"],
    bestSeason: "Nov–Feb",
    avgDailyBudget: 70,
    itinerary: [
      day("th-d1", 1, "Arrival & Old City Temples", [
        act("th-1-1", "10:00", "Arrival & check-in", "Land in Bangkok and settle into your stay.", "logistics", 90, 0, "Suvarnabhumi/Don Mueang"),
        act("th-1-2", "13:30", "Wat Pho (Temple of the Reclining Buddha)", "Home to a 46-meter gold-plated reclining Buddha statue.", "culture", 90, 8, "Rattanakosin"),
        act("th-1-3", "15:30", "Grand Palace & Wat Phra Kaew", "The former royal residence and Thailand's most sacred temple.", "culture", 120, 15, "Rattanakosin"),
        act("th-1-4", "19:00", "Yaowarat (Chinatown) street food crawl", "Neon-lit street stalls serving some of the city's best seafood and noodles.", "food", 120, 20, "Chinatown"),
      ]),
      day("th-d2", 2, "Markets & Rooftop Bars", [
        act("th-2-1", "09:00", "Chatuchak Weekend Market", "One of the world's largest markets — over 8,000 stalls (weekends only).", "shopping", 150, 25, "Chatuchak"),
        act("th-2-2", "13:00", "Pad thai lunch", "A classic plate from a long-running local stall.", "food", 45, 6, "Chatuchak"),
        act("th-2-3", "15:00", "Jim Thompson House", "A silk entrepreneur's traditional Thai teak house, now a museum.", "culture", 75, 8, "Pathumwan"),
        act("th-2-4", "19:30", "Rooftop bar sunset", "Cocktails high above the city skyline.", "nightlife", 120, 25, "Sathorn"),
      ]),
      day("th-d3", 3, "Damnoen Saduak & Ayutthaya", [
        act("th-3-1", "07:30", "Damnoen Saduak Floating Market", "Boats piled high with fruit and hot food weaving through the canals.", "culture", 180, 25, "Damnoen Saduak"),
        act("th-3-2", "13:00", "Riverside lunch", "Fresh seafood at a canal-side restaurant.", "food", 60, 12, "Damnoen Saduak"),
        act("th-3-3", "16:00", "Wat Arun (Temple of Dawn)", "A riverside temple famous for its porcelain-encrusted spire, best at sunset.", "culture", 90, 5, "Bangkok Yai"),
        act("th-3-4", "20:00", "Khao San Road", "Backpacker central — street food, bars, and night market stalls.", "nightlife", 120, 20, "Khao San"),
      ]),
      day("th-d4", 4, "Massage & Departure", [
        act("th-4-1", "09:30", "Traditional Thai massage", "An authentic Thai massage at a well-reviewed local spa.", "relaxation", 90, 15, "Silom"),
        act("th-4-2", "12:00", "Mango sticky rice & last bites", "One final round of Bangkok's best street snacks.", "food", 60, 8, "Silom"),
        act("th-4-3", "14:00", "MBK Center souvenir shopping", "A multi-floor shopping mall good for gifts and last-minute buys.", "shopping", 90, 20, "Pathumwan"),
        act("th-4-4", "17:00", "Check-out & departure", "Head to the airport — allow extra time for Bangkok traffic.", "logistics", 90, 0, "Bangkok"),
      ]),
    ],
  },
  {
    id: "dest-korea",
    destination: "Seoul",
    country: "South Korea",
    name: "Seoul in 5 Days",
    tagline: "Palaces, K-culture, and a nonstop food and shopping scene.",
    coverImage: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1200&q=80",
    days: 5,
    pace: "packed",
    interests: ["culture", "shopping", "food"],
    bestSeason: "Sep–Nov, Mar–Apr",
    avgDailyBudget: 95,
    itinerary: [
      day("kr-d1", 1, "Arrival & Palace District", [
        act("kr-1-1", "10:00", "Arrival & check-in", "Land in Seoul, grab a T-money card for transit, and settle in.", "logistics", 120, 0, "Incheon"),
        act("kr-1-2", "14:00", "Gyeongbokgung Palace", "Seoul's largest royal palace — try to catch the changing-of-the-guard ceremony.", "culture", 90, 3, "Jongno"),
        act("kr-1-3", "16:00", "Bukchon Hanok Village", "A hillside neighborhood of preserved traditional hanok houses.", "culture", 75, 0, "Bukchon"),
        act("kr-1-4", "19:00", "Insadong dinner street", "Traditional tea houses, galleries, and Korean BBQ.", "food", 90, 20, "Insadong"),
      ]),
      day("kr-d2", 2, "Myeongdong & N Seoul Tower", [
        act("kr-2-1", "10:00", "Myeongdong shopping street", "K-beauty flagship stores and street food stalls, wall to wall.", "shopping", 150, 30, "Myeongdong"),
        act("kr-2-2", "13:30", "Korean fried chicken lunch", "Double-fried, extra crispy — a local institution.", "food", 60, 12, "Myeongdong"),
        act("kr-2-3", "15:30", "N Seoul Tower & cable car", "Ride the cable car up Namsan Mountain for panoramic city views.", "culture", 120, 20, "Namsan"),
        act("kr-2-4", "19:30", "Hongdae nightlife district", "Live buskers, indie bars, and a young, energetic crowd near Hongik University.", "nightlife", 120, 25, "Hongdae"),
      ]),
      day("kr-d3", 3, "DMZ Day Trip", [
        act("kr-3-1", "08:00", "DMZ & JSA guided tour", "A guided half-day tour to the Korean Demilitarized Zone and Joint Security Area.", "culture", 300, 90, "Paju"),
        act("kr-3-2", "14:00", "Korean BBQ late lunch", "Grill-your-own bulgogi and samgyeopsal back in the city.", "food", 75, 20, "Seoul"),
        act("kr-3-3", "16:30", "Han River Park", "Rent a bike or just relax by the river with a convenience-store snack (a local tradition).", "relaxation", 90, 5, "Yeouido"),
        act("kr-3-4", "19:30", "Noraebang (karaoke)", "Private karaoke rooms — a Korean night-out staple.", "nightlife", 90, 15, "Gangnam"),
      ]),
      day("kr-d4", 4, "Gangnam & Dongdaemun", [
        act("kr-4-1", "10:00", "Bongeunsa Temple", "A quiet Buddhist temple tucked between Gangnam's skyscrapers.", "culture", 60, 0, "Gangnam"),
        act("kr-4-2", "12:00", "COEX Mall & Starfield Library", "A striking multi-story public library inside one of Asia's largest underground malls.", "culture", 90, 0, "Gangnam"),
        act("kr-4-3", "15:00", "Dongdaemun Design Plaza", "Zaha Hadid's futuristic building, surrounded by 24-hour fashion markets.", "shopping", 120, 20, "Dongdaemun"),
        act("kr-4-4", "20:00", "Dongdaemun night market food stalls", "Late-night street food right outside the DDP.", "food", 90, 15, "Dongdaemun"),
      ]),
      day("kr-d5", 5, "Last Bites & Departure", [
        act("kr-5-1", "09:30", "Gwangjang Market", "A century-old market famous for bindaetteok (mung bean pancakes) and mayak gimbap.", "food", 90, 12, "Jongno"),
        act("kr-5-2", "12:00", "Last-minute K-beauty & souvenirs", "Final shopping stop before heading to the airport.", "shopping", 90, 25, "Myeongdong"),
        act("kr-5-3", "15:00", "Check-out & departure", "Head to Incheon — allow ~1h from central Seoul.", "logistics", 90, 0, "Seoul"),
      ]),
    ],
  },
];
