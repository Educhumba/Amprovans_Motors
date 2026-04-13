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

document.addEventListener("DOMContentLoaded", () => {

  const helpTab = document.getElementById("helpTab");
  const helpPanel = document.getElementById("helpPanel");
  const closeHelp = document.getElementById("closeHelp");

  const contextHelp = document.getElementById("contextHelp");
  const allHelp = document.getElementById("allHelp");

  const contextBtn = document.getElementById("contextHelpBtn");
  const allBtn = document.getElementById("allHelpBtn");

  // OPEN PANEL
  helpTab.addEventListener("click", () => {
    helpPanel.classList.add("open");
    updateContextHelp(); // 🔥 FORCE LOAD CONTENT
  });

  closeHelp.addEventListener("click", () => {
    helpPanel.classList.remove("open");
  });

  // SWITCH
  contextBtn.addEventListener("click", () => {
    contextBtn.classList.add("active");
    allBtn.classList.remove("active");
    contextHelp.classList.remove("hidden");
    allHelp.classList.add("hidden");
    updateContextHelp();
  });

  allBtn.addEventListener("click", () => {
    allBtn.classList.add("active");
    contextBtn.classList.remove("active");
    allHelp.classList.remove("hidden");
    contextHelp.classList.add("hidden");
  });

  // DETECT SECTION (IMPROVED)
  function getCurrentSection() {
    const sections = document.querySelectorAll("section");
    let current = "home";

    let scrollY = window.scrollY;

    sections.forEach(section => {
      const top = section.offsetTop - 200;
      const height = section.offsetHeight;

      if (scrollY >= top && scrollY < top + height) {
        current = section.id;
      }
    });

    return current;
  }

  // UPDATE CONTENT
  function updateContextHelp() {
  const section = getCurrentSection();

  let html = "";

  switch(section) {

    // ================= VEHICLES / BUY =================
    case "vehicles":
      html = `
        <div class="help-card">
          <h4><i class="fas fa-search"></i> Finding a Car</h4>
          <p>Use the search bar to find vehicles by name, engine type, transmission, or price.</p>
          <p>You can also scroll through available listings and click any vehicle card to view full details.</p>
        </div>

        <div class="help-card">
          <h4><i class="fas fa-filter"></i> Using Filters</h4>
          <p>Select <strong>Make → Model → Year</strong> and adjust the price range to narrow down results.</p>
          <p>Filters help you quickly find cars that match your exact preference.</p>
        </div>

        <div class="help-card">
          <h4><i class="fas fa-car"></i> Viewing Car Details</h4>
          <p>Click on any car card to open a detailed view with images, specifications, and contact options.</p>
        </div>
      `;
      break;

    // ================= HIRE =================
    case "hire":
      html = `
        <div class="help-card">
          <h4><i class="fas fa-key"></i> How Car Hire Works</h4>
          <p>Select a vehicle, choose your rental dates, and submit your request.</p>
          <p>Our team will confirm availability and finalize the booking.</p>
        </div>

        <div class="help-card">
          <h4><i class="fas fa-calculator"></i> Pricing Explained</h4>
          <p>The daily hire rate is automatically calculated as <strong>0.7% of the car’s value</strong>.</p>
          <p>Total cost depends on the number of days selected.</p>
        </div>

        <div class="help-card">
          <h4><i class="fas fa-exclamation-triangle"></i> Late Return Policy</h4>
          <p>Late returns attract a <strong>20% penalty of the daily hire rate per extra day</strong>.</p>
        </div>
      `;
      break;

    // ================= SELL =================
    case "sell":
      html = `
        <div class="help-card">
          <h4><i class="fas fa-tag"></i> Expected Price</h4>
          <p>This is your <strong>asking price</strong> — the amount you hope to sell the car for.</p>
          <p>It helps buyers understand your expectations.</p>
        </div>

        <div class="help-card">
          <h4><i class="fas fa-upload"></i> Uploading Images</h4>
          <p>You can upload up to <strong>10 images</strong>, each not exceeding <strong>7MB</strong>.</p>
          <p>Clear photos increase your chances of attracting buyers.</p>
        </div>

        <div class="help-card">
          <h4><i class="fas fa-check-circle"></i> Listing Approval</h4>
          <p>Your car submission will be reviewed before it is published on the platform.</p>
        </div>
      `;
      break;

    // ================= CONTACT =================
    case "contact":
      html = `
        <div class="help-card">
          <h4><i class="fas fa-envelope"></i> Contact Form</h4>
          <p>Fill in your name, email, and message to reach our team directly.</p>
        </div>

        <div class="help-card">
          <h4><i class="fab fa-whatsapp"></i> WhatsApp Support</h4>
          <p>Use the WhatsApp button for faster, real-time communication.</p>
        </div>
      `;
      break;

    // ================= HOME / LANDING =================
    default:
      html = `
        <div class="help-card">
          <h4><i class="fas fa-compass"></i> Navigating the Website</h4>
          <p>The homepage provides quick access to key services:</p>
          <ul>
            <li><strong>Buy a Car</strong> – Takes you to available vehicles for purchase</li>
            <li><strong>Hire a Car</strong> – Opens the car rental section</li>
            <li><strong>Sell Your Car</strong> – Lets you submit your vehicle for listing</li>
          </ul>
        </div>

        <div class="help-card">
          <h4><i class="fas fa-mouse-pointer"></i> Important Tip</h4>
          <p>Items like <strong>"Buy a Car"</strong>, <strong>"Hire a Car"</strong>, and <strong>"Sell Your Car"</strong> are clickable links that take you to their respective sections.</p>
        </div>
      `;
  }

  contextHelp.innerHTML = html || "<p>Help not available</p>";
}

  // AUTO UPDATE ON SCROLL
  window.addEventListener("scroll", () => {
    if (!contextHelp.classList.contains("hidden")) {
      updateContextHelp();
    }
  });

});