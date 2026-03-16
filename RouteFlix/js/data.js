const destinations = [
    {
        id: 1,
        title: "Santorini, Grecia",
        category: "Destinos Populares",
        image: "https://media.tacdn.com/media/attractions-splice-spp-674x446/0b/f6/2d/d1.jpg",
        link: "https://www.tripadvisor.com.ar/Attractions-g189433-Activities-Santorini_Cyclades_South_Aegean.html",
        rating: 4.9,
        reviews: 1240,
        price: "€120/noche"
    },
    {
        id: 2,
        title: "Bali, Indonesia",
        category: "Destinos Populares",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.8,
        reviews: 3105,
        price: "$45/noche"
    },
    {
        id: 3,
        title: "Roma, Italia",
        category: "Destinos Populares",
        image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80",
        link: "https://www.tripadvisor.com.ar/Attractions-g187791-Activities-Rome_Lazio.html",
        rating: 4.7,
        reviews: 8430,
        price: "€95/noche"
    },
    {
        id: 4,
        title: "Kyoto, Japón",
        category: "Destinos Populares",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80",
        link: "https://www.tripadvisor.com.ar/Attractions-g298564-Activities-Kyoto.html",
        rating: 4.9,
        reviews: 4500,
        price: "¥15000/noche"
    },
    {
        id: 5,
        title: "Machu Picchu",
        category: "Aventuras",
        image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=500&q=80",
        rating: 5.0,
        reviews: 5320,
        price: "$150/tour"
    },
    {
        id: 6,
        title: "Patagonia, Argentina",
        category: "Aventuras",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8XB479ALP1VYrZHKaf64KZVj3seqdLBIaiQ& s",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.9,
        reviews: 2100,
        price: "$80/noche"
    },
    {
        id: 7,
        title: "Alpes Suizos",
        category: "Aventuras",
        image: "https://content-viajes.nationalgeographic.com.es/medio/2025/11/03/shutterstock_879e339d_2393185093_251103163050_1280x720.webp",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.8,
        reviews: 980,
        price: "€200/noche"
    },
    {
        id: 8,
        title: "Gran Cañón, EEUU",
        category: "Aventuras",
        image: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=500&q=80",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.9,
        reviews: 4200,
        price: "$120/tour"
    },
    {
        id: 9,
        title: "París, Francia",
        category: "Escapadas",
        image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.6,
        reviews: 15400,
        price: "€140/noche"
    },
    {
        id: 10,
        title: "Nueva York, EEUU",
        category: "Escapadas",
        image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500&q=80",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.7,
        reviews: 22000,
        price: "$250/noche"
    },
    {
        id: 11,
        title: "Ámsterdam, Países Bajos",
        category: "Escapadas",
        image: "https://images.unsplash.com/photo-1517736996303-4eec4a66bb17?w=500&q=80",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.8,
        reviews: 6700,
        price: "€110/noche"
    },
    {
        id: 12,
        title: "Barcelona, España",
        category: "Escapadas",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Aerial_view_of_Barceloneta_Beach_and_Port_Vell_in_Barcelona%2C_Spain.jpg/330px-Aerial_view_of_Barceloneta_Beach_and_Port_Vell_in_Barcelona%2C_Spain.jpg",
        link: "https://www.tripadvisor.com.ar/Attractions-g294226-Activities-Bali.html",
        rating: 4.7,
        reviews: 9500,
        price: "€90/noche"
    },
    {
        id: 13,
        title: "Tel Aviv, Israel",
        category: "Destinos Populares",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4TF_Kma6X2tNu2qL9uXcSsmdyJanKCD8gBQ&s",
        link: "https://www.tripadvisor.com.ar/Attractions-g293984-Activities-Tel_Aviv_Tel_Aviv_District.html",
        rating: 4.9,
        reviews: 1240,
        price: "€120/noche"
    },
    {
        id: 14,
        title: "Miami, EEUU",
        category: "Destinos Populares",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuF-bmsS21MJ5lsXypHgeDWcthAZwjS4VWBQ&s",
        link: "https://www.tripadvisor.com.ar/Tourism-g34438-Miami_Florida-Vacations.html",
        rating: 4.9,
        reviews: 1240,
        price: "€120/noche"
    }
];
