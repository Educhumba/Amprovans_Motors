document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("vehicleGrid");

  try {
    const res = await fetch("http://localhost:5000/api/cars/public");
    const cars = await res.json();

    // ✅ STORE GLOBALLY
    window.allCars = cars;
    window.filteredCars = [...cars];

    if (!cars || cars.length === 0) {
      grid.innerHTML = "<p>No cars available at the moment.</p>";
      return;
    }

    renderCars(cars); // ✅ use renderer

    initFilters(cars); // ✅ initialize dropdowns

  } catch (err) {
    console.error("Error fetching cars:", err);
    grid.innerHTML = "<p>Failed to load cars. Try again later.</p>";
  }
});

function renderCars(cars) {
  const grid = document.getElementById("vehicleGrid");
  grid.innerHTML = "";

  // 🔥 HANDLE EMPTY STATE PROPERLY
  if (!cars || cars.length === 0) {
    const searchText = document.getElementById("searchInput")?.value || "";

    grid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-car-side"></i>
        <h3>No cars found</h3>
        <p>
          ${
            searchText
              ? `No results for "<strong>${searchText}</strong>"`
              : "Try adjusting your filters"
          }
        </p>
      </div>
    `;
    return;
  }

  // 🔥 NORMAL RENDERING
  cars.forEach(car => {
    const card = document.createElement("article");
    card.className = "vehicle-card";

    const img = document.createElement("img");
    img.className = "card-image";

    if (car.images && car.images.length) {
      const path = car.images[0].image_path;

      img.src = path.startsWith("http")
        ? path
        : `http://localhost:5000${path}`;
    } else {
      img.src = "images/logo.jpg";
    }

    const badge = document.createElement("div");
    badge.className =
      "availability " +
      (car.status === "available"
        ? "avail-available"
        : car.status === "booked"
        ? "avail-booked"
        : "avail-sold");
    badge.textContent = car.status;

    const body = document.createElement("div");
    body.className = "card-body";

    body.innerHTML = `
      <div class="title">${car.make} ${car.model}</div>
      <div class="meta">
        ${car.mileage} km • ${car.engine}cc • ${car.transmission} • ${car.year}
      </div>
      <div class="price">KSh ${Number(car.price).toLocaleString()}</div>
    `;

    const link = document.createElement("a");
    link.className = "card-link";
    link.href = `car-details.html?id=${encodeURIComponent(car.id)}`;

    card.append(img, badge, body, link);
    grid.appendChild(card);
  });
}

function initFilters(cars) {
  const makeSelect = document.getElementById("filterMake");
  const modelSelect = document.getElementById("filterModel");
  const yearSelect = document.getElementById("filterYear");

  // UNIQUE VALUES
  const makes = [...new Set(cars.map(c => c.make))];
  const years = [...new Set(cars.map(c => c.year))].sort((a,b)=>b-a);

  makes.forEach(make => {
    const opt = document.createElement("option");
    opt.value = make;
    opt.textContent = make;
    makeSelect.appendChild(opt);
  });

  years.forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    yearSelect.appendChild(opt);
  });

  // 🔥 MODEL DEPENDS ON MAKE
  makeSelect.addEventListener("change", () => {
    const selectedMake = makeSelect.value;

    modelSelect.innerHTML = `<option value="">Select Model</option>`;

    if (!selectedMake) {
      modelSelect.disabled = true;
      return;
    }

    const models = [
      ...new Set(
        window.allCars
          .filter(c => c.make === selectedMake)
          .map(c => c.model)
      )
    ];

    models.forEach(model => {
      const opt = document.createElement("option");
      opt.value = model;
      opt.textContent = model;
      modelSelect.appendChild(opt);
    });

    modelSelect.disabled = false;
  });
}