// Fallback ligero (~2KB) para usar en el cliente cuando la API no responde
// NO reemplaza el dataset completo de destinations.js (que se usa para seed/DB)
export const fallbackDestinations = [
  {
    id: 1,
    title: "Santorini, Grecia",
    category: "Destinos Populares",
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g189433-Santorini_Cyclades_South_Aegean-Vacations.html",
    rating: 4.9,
    reviews: 1240,
    price: "€120/noche"
  },
  {
    id: 2,
    title: "Bali, Indonesia",
    category: "Destinos Populares",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g294226-Bali-Vacations.html",
    rating: 4.8,
    reviews: 3105,
    price: "$45/noche"
  },
  {
    id: 3,
    title: "Roma, Italia",
    category: "Destinos Populares",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g187791-Rome_Lazio-Vacations.html",
    rating: 4.7,
    reviews: 8430,
    price: "€95/noche"
  },
  {
    id: 4,
    title: "Kyoto, Japón",
    category: "Destinos Populares",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g298564-Kyoto_Kyoto_Prefecture_Kinki-Vacations.html",
    rating: 4.9,
    reviews: 4500,
    price: "¥15000/noche"
  },
  {
    id: 5,
    title: "Barcelona, España",
    category: "Destinos Populares",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g187497-Barcelona_Catalonia-Vacations.html",
    rating: 4.7,
    reviews: 9500,
    price: "€90/noche"
  },
  {
    id: 6,
    title: "Machu Picchu, Perú",
    category: "Aventuras",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g304036-Machu_Picchu_Cusco_Region-Vacations.html",
    rating: 5.0,
    reviews: 5320,
    price: "$150/tour"
  },
  {
    id: 7,
    title: "Patagonia, Argentina",
    category: "Aventuras",
    image: "https://images.unsplash.com/photo-1637580980556-085dee659c7e?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g312848-Patagonia-Vacations.html",
    rating: 4.9,
    reviews: 2100,
    price: "$80/noche"
  },
  {
    id: 8,
    title: "Banff, Canadá",
    category: "Aventuras",
    image: "https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g154911-Banff_Banff_National_Park_Alberta-Vacations.html",
    rating: 4.9,
    reviews: 6700,
    price: "$220/noche"
  },
  {
    id: 9,
    title: "Alpes Suizos, Suiza",
    category: "Aventuras",
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g188045-Switzerland-Vacations.html",
    rating: 4.8,
    reviews: 980,
    price: "€200/noche"
  },
  {
    id: 10,
    title: "Queenstown, Nueva Zelanda",
    category: "Aventuras",
    image: "https://images.unsplash.com/photo-1589871973311-9ae1c5a1e4e9?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g255122-Queenstown_Otago_Region_South_Island-Vacations.html",
    rating: 5.0,
    reviews: 3600,
    price: "$190/noche"
  },
  {
    id: 11,
    title: "París, Francia",
    category: "Escapadas",
    image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g187147-Paris_Ile_de_France-Vacations.html",
    rating: 4.6,
    reviews: 15400,
    price: "€140/noche"
  },
  {
    id: 12,
    title: "Ámsterdam, Países Bajos",
    category: "Escapadas",
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g188590-Amsterdam_North_Holland_Province-Vacations.html",
    rating: 4.8,
    reviews: 6700,
    price: "€110/noche"
  },
  {
    id: 13,
    title: "Praga, República Checa",
    category: "Escapadas",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g274707-Prague_Bohemia-Vacations.html",
    rating: 4.8,
    reviews: 12100,
    price: "€75/noche"
  },
  {
    id: 14,
    title: "Lisboa, Portugal",
    category: "Escapadas",
    image: "https://images.unsplash.com/photo-1518002171953-3a8c1ec0e5e9?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g189158-Lisbon_Lisbon_District_Central_Portugal-Vacations.html",
    rating: 4.7,
    reviews: 8900,
    price: "€85/noche"
  },
  {
    id: 15,
    title: "Valencia, España",
    category: "Escapadas",
    image: "https://images.unsplash.com/photo-1589792924867-c50ce7f3fc97?w=400&q=60",
    link: "https://www.tripadvisor.com/Tourism-g187529-Valencia_Province_of_Valencia_Valencian_Community-Vacations.html",
    rating: 4.9,
    reviews: 4800,
    price: "€75/noche"
  }
];
