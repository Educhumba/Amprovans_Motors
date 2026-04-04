/* ---------------- MOBILE MENU TOGGLE ---------------- */
function toggleMenu() {
    let nav = document.getElementById("nav-links");
    nav.style.display = nav.style.display === "flex" ? "none" : "flex";
}

// ----------------- LANDING PAGE SLIDE IN ANIMATION ----------------------
const homeContent = document.getElementById('homeContent');

document.addEventListener('DOMContentLoaded', () => {
  if (homeContent) {
    setTimeout(() => {
      homeContent.classList.add('slide-in');
    }, 600); // small delay for smooth entry
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

  const searchBtn = document.getElementById("searchBtn");
  const applyBtn = document.getElementById("applyFilter");
  const resetBtn = document.getElementById("resetFilter");

  searchBtn.addEventListener("click", applySearchAndFilter);
  applyBtn.addEventListener("click", applySearchAndFilter);
  resetBtn.addEventListener("click", resetFilters);

});

function applySearchAndFilter() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const make = document.getElementById("filterMake").value;
  const model = document.getElementById("filterModel").value;
  const year = document.getElementById("filterYear").value;
  const minPrice = document.getElementById("minPrice").value;
  const maxPrice = document.getElementById("maxPrice").value;

  let result = [...window.allCars];

  // SEARCH
  if (searchText) {
    result = result.filter(car =>
      `${car.make} ${car.model} ${car.engine} ${car.transmission} ${car.price}`
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