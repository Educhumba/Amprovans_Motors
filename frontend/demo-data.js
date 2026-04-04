/* ---------- Sample vehicle data (replace later with API data) ---------- */
window.allVehicles = [
  {
    id: 1,
    title: "Corolla Axio - Toyota",
    make: "Toyota",
    model: "Axio",
    year: 2018,
    mileage: "78,000 km",
    engine: "1500",
    transmission: "Automatic",
    fuel: "Petrol",
    color: "Silver",
    condition: "Used",
    body: "Sedan",
    location: "Nairobi",
    price: 1250000,
    status: "available", // available | booked | sold
    images: [
      "images/cars/axio1.jpg",
      "images/cars/axio2.jpg",
      "images/cars/axio3.jpg",
      "images/cars/axio4.jpg",
      "images/cars/axio5.jpg"
    ],
    description: "Well maintained, single owner, clean interior, new tyres."
  },
  {
    id: 2,
    title: "CX-5 - Mazda",
    make: "Mazda",
    model: "CX-5",
    year: 2019,
    mileage: "65,000 km",
    engine: "2000",
    transmission: "Automatic",
    fuel: "Petrol",
    color: "White",
    condition: "Used",
    body: "SUV",
    location: "Mombasa",
    price: 2450000,
    status: "booked",
    images: [
      "images/cars/mazda1.jpg",
      "images/cars/mazda2.jpg",
      "images/cars/mazda3.jpg",
      "images/cars/mazda4.jpg"
    ],
    description: "High spec, loaded with safety features."
  },
  {
  id: 3,
  title: "Subaru Forester XT - Subaru",
  make: "Subaru",
  model: "Forester",
  year: 2017,
  mileage: "102,000 km",
  engine: "2000",
  transmission: "Automatic",
  fuel: "Petrol",
  color: "White",
  condition: "Used",
  body: "SUV",
  location: "Nairobi",
  price: 1850000,
  status: "available",
  images: [
    "images/cars/Subaru1.jpg",
    "images/cars/subaru2.jpg",
    "images/cars/subaru3.jpg"
  ],
  description: "Turbocharged performance, AWD stability, clean interior and well serviced."
},

{
  id: 4,
  title: "Audi A4 - Audi",
  make: "Audi",
  model: "A4",
  year: 2019,
  mileage: "65,000 km",
  engine: "2000",
  transmission: "manual",
  fuel: "Petrol",
  color: "Black",
  condition: "Used",
  body: "Sedan",
  location: "Mombasa",
  price: 2650000,
  status: "booked",
  images: [
    "images/cars/Audi1.jpg",
    "images/cars/audi2.jpg",
    "images/cars/audi3.jpg",
    "images/cars/audi4.jpg",
    "images/cars/audi5.jpg"
  ],
  description: "Luxury interior, smooth drive, powerful engine and excellent handling."
},

{
  id: 5,
  title: "Mercedes-Benz C200 - Mercedes",
  make: "Mercedes",
  model: "C200",
  year: 2016,
  mileage: "89,000 km",
  engine: "1800",
  transmission: "Automatic",
  fuel: "Petrol",
  color: "Blue",
  condition: "Used",
  body: "Sedan",
  location: "Nairobi",
  price: 2950000,
  status: "sold",
  images: [
    "images/cars/benz1.jpg",
    "images/cars/benz2.jpg",
    "images/cars/benz3.jpg",
    "images/cars/benz4.jpg",
    "images/cars/benz5.jpg",
    "images/cars/benz6.jpg"
  ],
  description: "Executive comfort, premium leather interior, low mileage and fully loaded."
},

{
  id: 6,
  title: "Nissan X-Trail NT32 - Nissan",
  make: "Nissan",
  model: "X-Trail",
  year: 2018,
  mileage: "73,000 km",
  engine: "2000",
  transmission: "Automatic",
  fuel: "Petrol",
  color: "Grey",
  condition: "Used",
  body: "SUV",
  location: "Nakuru",
  price: 2100000,
  status: "available",
  images: [
    "images/cars/nissan1.jpg",
    "images/cars/nissan2.jpg",
    "images/cars/nissan3.jpg",
    "images/cars/nissan4.jpg"
  ],
  description: "Family-friendly SUV, 4WD mode, spacious cabin and smooth driving experience."
},

{
  id: 7,
  title: "Peugeot 3008 - Peugeot",
  make: "Peugeot",
  model: "3008",
  year: 2020,
  mileage: "42,000 km",
  engine: "1600",
  transmission: "Automatic",
  fuel: "Petrol",
  color: "Red",
  condition: "Used",
  body: "Crossover",
  location: "Nairobi",
  price: 2850000,
  status: "available",
  images: [
    "images/cars/peugeot1.jpg",
    "images/cars/peugeot2.jpg",
    "images/cars/peugeot3.jpg",
    "images/cars/peugeot4.jpg"
  ],
  description: "Modern design, digital dashboard, excellent fuel efficiency and comfort."
},

{
  id: 8,
  title: "Toyota Probox GL - Toyota",
  make: "Toyota",
  model: "Probox",
  year: 2015,
  mileage: "138,000 km",
  engine: "1300",
  transmission: "Manual",
  fuel: "Petrol",
  color: "Silver",
  condition: "Used",
  body: "Wagon",
  location: "Nairobi",
  price: 750000,
  status: "available",
  images: [
    "images/cars/probox1.jpg",
    "images/cars/probox2.jpg",
    "images/cars/probox3.jpg",
    "images/cars/probox4.jpg",
    "images/cars/probox5.jpg"
  ],
  description: "Reliable workhorse, great fuel economy, very well maintained."
},

{
  id: 9,
  title: "Nissan Note E-Power - Nissan",
  make: "Nissan",
  model: "Note",
  year: 2021,
  mileage: "29,000 km",
  engine: "1200",
  transmission: "manual",
  fuel: "Hybrid",
  color: "White",
  condition: "Used",
  body: "Hatchback",
  location: "Thika",
  price: 1350000,
  status: "booked",
  images: [
    "images/cars/nissan1.jpg",
    "images/cars/nissan2.jpg",
    "images/cars/nissan3.jpg",
    "images/cars/nissan4.jpg"
  ],
  description: "Hybrid efficiency, quiet ride, low mileage and perfect for town usage."
}
];    