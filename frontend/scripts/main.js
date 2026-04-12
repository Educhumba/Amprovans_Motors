/* ---------------- MOBILE MENU TOGGLE ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav-links");
  const hamburger = document.getElementById("hamburgerBtn");

  hamburger.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
});

// AUTO UPDATE FOOTER YEAR
document.getElementById("year").textContent = new Date().getFullYear();

// ----------------- LANDING PAGE SLIDE IN ANIMATION ----------------------
const homeContent = document.getElementById('homeContent');

document.addEventListener('DOMContentLoaded', () => {
  if (homeContent) {
    setTimeout(() => {
      homeContent.classList.add('slide-in');
    }, 600); 
  }
});
// image sources
const images = [
  'images/Drive-in.png',
  'images/Drive-in1.png',
  'images/Drive-in2.png',
  'images/Drive-in3.png',
  'images/Drive-in4.png',
  'images/Drive-in5.png'
];

const slideImg = document.getElementById('slideCar');

let currentIndex = 0;

function resetAnimation() {
  slideImg.classList.remove('slide-car-in', 'slide-car-out');
  void slideImg.offsetWidth; // force reflow
}

function runSlider() {
  slideImg.src = images[currentIndex];

  // STEP 1: Slide in from RIGHT → CENTER
  resetAnimation();
  slideImg.classList.add('slide-car-in');

  // Wait for slide-in to finish (3s)
  setTimeout(() => {

    // STEP 2: Pause at center (IMPORTANT)
    setTimeout(() => {

      // STEP 3: Slide out to LEFT
      resetAnimation();
      slideImg.classList.add('slide-car-out');

      // Wait for slide-out to finish (2s)
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % images.length;
        runSlider(); // loop
      }, 2000);

    }, 1000); // pause time at center

  }, 3000);
}

/* START */
document.addEventListener('DOMContentLoaded', () => {
  images.forEach(src => { new Image().src = src; }); // preload
  runSlider();
});

document.addEventListener("DOMContentLoaded", () => {

  const searchInput = document.getElementById("searchInput");
  const searchWarning = document.getElementById("searchWarning");
  const searchBtn = document.getElementById("searchBtn");

  const make = document.getElementById("filterMake");
  const model = document.getElementById("filterModel");
  const year = document.getElementById("filterYear");
  const minPrice = document.getElementById("minPrice");
  const maxPrice = document.getElementById("maxPrice");

  const resetBtn = document.getElementById("resetFilter");

  // REAL-TIME SEARCH (typing)
  let timeout;

  searchInput.addEventListener("input", () => {
    let original = searchInput.value;
    // Allow only letters, numbers, space, hyphen
    let cleaned = original.replace(/[^a-zA-Z0-9\s-]/g, "");
    if (original !== cleaned) {
      searchWarning.textContent =
        "⚠ Only letters, numbers, and hyphens (-) allowed";
      searchWarning.classList.add("show");
      // auto hide
      clearTimeout(searchWarning.timeout);
      searchWarning.timeout = setTimeout(() => {
        searchWarning.classList.remove("show");
      }, 2000);
    }
    searchInput.value = cleaned;
    clearTimeout(timeout);
    timeout = setTimeout(applySearchAndFilter, 300);
  });

  searchBtn.addEventListener("click", applySearchAndFilter);

  // REAL-TIME FILTERS
  make.addEventListener("change", applySearchAndFilter);
  model.addEventListener("change", applySearchAndFilter);
  year.addEventListener("change", applySearchAndFilter);

  minPrice.addEventListener("input", applySearchAndFilter);
  maxPrice.addEventListener("input", applySearchAndFilter);

  // RESET
  resetBtn.addEventListener("click", resetFilters);

});

function applySearchAndFilter() {
  let rawInput = document.getElementById("searchInput").value;
  let cleanedInput = rawInput.replace(/[^a-zA-Z0-9\s-]/g, "");
  const searchText = cleanedInput.toLowerCase();
  const make = document.getElementById("filterMake").value;
  const model = document.getElementById("filterModel").value;
  const year = document.getElementById("filterYear").value;
  const minPrice = document.getElementById("minPrice").value;
  const maxPrice = document.getElementById("maxPrice").value;

  let result = [...window.allCars];

  // SEARCH
  if (searchText) {
    result = result.filter(car =>
      `${car.make} ${car.model} ${car.engine} ${car.transmission} ${car.price} ${car.year} ${car.mileage}`
        .toLowerCase()
        .includes(searchText)
    );
  }

  // FILTERS
  if (make) result = result.filter(c => c.make === make);
  if (model) result = result.filter(c => c.model === model);
  if (year) result = result.filter(c => String(c.year) === year);

  if (minPrice) result = result.filter(c => c.price >= Number(minPrice));
  if (maxPrice) result = result.filter(c => c.price <= Number(maxPrice));

  window.filteredCars = result;

  renderCars(result); // reuse renderer
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterMake").value = "";
  document.getElementById("filterModel").innerHTML = `<option value="">Select Model</option>`;
  document.getElementById("filterModel").disabled = true;
  document.getElementById("filterYear").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";

  renderCars(window.allCars);
}

document.addEventListener("DOMContentLoaded", () => {
  const backToTopBtn = document.getElementById("backToTop");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});