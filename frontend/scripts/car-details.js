// scripts/car-details.js

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    // Fetch all cars from backend
    const res = await fetch("http://localhost:5000/api/cars");
    const cars = await res.json();
    const car = cars.find(c => c.id == id);
    if (!car) return;

    // Populate car details
    document.getElementById("carTitle").textContent = `${car.make} ${car.model}`;
    document.getElementById("carPrice").textContent = "KSh " + Number(car.price).toLocaleString();
    document.getElementById("make").textContent = car.make;
    document.getElementById("model").textContent = car.model;
    document.getElementById("year").textContent = car.year;
    document.getElementById("engine").textContent = car.engine;
    document.getElementById("transmission").textContent = car.transmission;
    document.getElementById("mileage").textContent = car.mileage;
    document.getElementById("location").textContent = car.location;
    document.getElementById("description").textContent = car.description;

    const mainImg = document.getElementById("mainImage");
    mainImg.src = car.images && car.images.length ? `http://localhost:5000${car.images[0].url}` : "images/logo.jpg";

    // CONTACT BUTTONS
    const phone = "+254110146704";

    // WhatsApp
    const whatsappBtn = document.getElementById("whatsappBtn");
    whatsappBtn.href = `https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(
    `Hello, I'm interested in the ${car.make} ${car.model} (${car.year}) listed on your site: ${window.location.href}`
    )}`;

    // Call
    const callBtn = document.getElementById("callBtn");
    callBtn.href = `tel:${phone}`;

    // Share
    const shareBtn = document.getElementById("shareBtn");
    shareBtn.addEventListener("click", async () => {
    const shareData = {
        title: `${car.make} ${car.model}`,
        text: car.description || "Check out this car",
        url: window.location.href
    };

    if (navigator.share) {
        try {
        await navigator.share(shareData);
        } catch (err) {
        console.warn("Share cancelled", err);
        }
    } else {
        // fallback (desktop)
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard");
    }
    });

    // Thumbnails
    const thumbs = document.getElementById("thumbs");
    thumbs.innerHTML = "";
    if(car.images){
      car.images.forEach(img => {
        const t = document.createElement("img");
        t.src = `http://localhost:5000${img.url}`;
        t.style.width = '80px';
        t.style.height = '60px';
        t.style.cursor = 'pointer';
        t.style.borderRadius = '6px';
        t.addEventListener('click', ()=> mainImg.src = t.src);
        thumbs.appendChild(t);
      });
    }

    // Related cars
    const relatedGrid = document.getElementById("relatedGrid");
    const related = cars.filter(x => x.make === car.make && x.id !== car.id).slice(0,8);
    related.forEach(r => {
      const card = document.createElement("article");
      card.className = "vehicle-card";

      const img = document.createElement("img");
      img.src = r.images && r.images.length ? `http://localhost:5000${r.images[0].url}` : "images/logo.jpg";
      img.alt = `${r.make} ${r.model}`;
      card.appendChild(img);

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = `${r.make} ${r.model}`;
      card.appendChild(title);

      const price = document.createElement("div");
      price.className = "price";
      price.textContent = "KSh " + Number(r.price).toLocaleString();
      card.appendChild(price);

      const link = document.createElement("a");
      link.className = "card-link";
      link.href = `car-details.html?id=${r.id}`;
      card.appendChild(link);

      relatedGrid.appendChild(card);
    });

  } catch (err) {
    console.error("Error fetching car details:", err);
  }
});