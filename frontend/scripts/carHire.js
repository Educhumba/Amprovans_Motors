document.addEventListener("DOMContentLoaded", () => {
  waitForCarsAndInit();

  document.getElementById("hireForm")
    .addEventListener("submit", handleHireSubmit);

  document.getElementById("pickupDate")
    .addEventListener("change", handleDateChange);

  document.getElementById("returnDate")
    .addEventListener("change", handleDateChange);

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("pickupDate").min = today;
  document.getElementById("returnDate").min = today;
});

/* ---------------- WAIT UNTIL CARS LOAD ---------------- */
function waitForCarsAndInit() {
  const interval = setInterval(() => {
    if (window.allCars && window.allCars.length > 0) {
      clearInterval(interval);
      populateHireCars();
    }
  }, 300); // check every 300ms
}
/* ---------------- CALCULATE RATE ---------------- */
function calculateDailyRate(price) {
  return Math.round(price * 0.007); // 0.7%
}
//calculate hire days
function calculateDays(pickup, returnDate) {
  const start = new Date(pickup);
  const end = new Date(returnDate);

  const diffTime = end - start;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
}

//Calculate total cost 
function updateTotalCost() {
  const rateText = document.getElementById("dailyRate").value;
  const pickup = document.getElementById("pickupDate").value;
  const returnDate = document.getElementById("returnDate").value;

  if (!rateText) {
    document.getElementById("totalCost").dataset.total = 0;
    document.getElementById("totalCost").value = "Select a car first";
    return;
  }

  if (!pickup || !returnDate) {
    document.getElementById("totalCost").dataset.total = 0;
    document.getElementById("totalCost").value = "";
    return;
  }

  const rate = Number(rateText.replace(/[^0-9]/g, ""));
  const days = calculateDays(pickup, returnDate);

  if (days <= 0) {
    document.getElementById("totalCost").dataset.total = 0;
    document.getElementById("totalCost").value = "Invalid dates";
    return;
  }

  const total = rate * days;

  // Save pure number in data attribute for submission
  document.getElementById("totalCost").dataset.total = total;

  // Display formatted value with days
  document.getElementById("totalCost").value = `KSh ${total.toLocaleString()} (${days} days)`;
}

/* ------------------ POPULATE DROPDOWN ------------------ */
function populateHireCars() {
  const select = document.getElementById("hireCarSelect");

  if (!window.allCars) return; // safety

  const availableCars = window.allCars.filter(c => c.status === "available");

  if (availableCars.length === 0) {
    select.innerHTML = `<option value="">No cars available for hire</option>`;
    return;
  }

  select.innerHTML = `<option value="">Select a car</option>`;

  availableCars.forEach(car => {
    const opt = document.createElement("option");
    opt.value = car.id;
    opt.dataset.price = car.price;
    opt.textContent = `${car.make} ${car.model}`;
    select.appendChild(opt);
  });

  select.addEventListener("change", updateRateDisplay);
}

function updateRateDisplay() {
  const select = document.getElementById("hireCarSelect");
  const selectedOption = select.options[select.selectedIndex];

  const price = selectedOption.dataset.price;

  if (!price) {
    document.getElementById("dailyRate").value = "";
    document.getElementById("totalCost").value = "";
    return;
  }

  const rate = calculateDailyRate(Number(price));

  document.getElementById("dailyRate").value =
    "KSh " + rate.toLocaleString() + " / day";

  updateTotalCost(); // 🔥 always recalc
}

function handleDateChange() {
  const pickup = document.getElementById("pickupDate").value;
  const returnDate = document.getElementById("returnDate").value;

  if (!pickup || !returnDate) return;

  if (returnDate <= pickup) {
    alert("Return date must be after pickup date");

    document.getElementById("totalCost").value = "Invalid dates";
    return;
  }

  updateTotalCost();
}

//Date validation logic 
function validateDates() {
  const pickup = document.getElementById("pickupDate").value;
  const returnDate = document.getElementById("returnDate").value;

  const today = new Date().toISOString().split("T")[0];

  if (pickup < today) {
    alert("Pickup date cannot be in the past");
    return false;
  }

  if (returnDate <= pickup) {
    alert("Return date must be after pickup date");
    return false;
  }

  return true;
}

/* ------------------ HANDLE FORM ------------------ */
function handleHireSubmit(e) {
  e.preventDefault();

  if (!validateDates()) return;

  const submitBtn = document.getElementById("hireSubmitBtn");
  submitBtn.disabled = true;

  const totalCost = Number(document.getElementById("totalCost").dataset.total);

  const data = {
    fullName: document.getElementById("fullName").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    carId: document.getElementById("hireCarSelect").value,
    carName: document.getElementById("hireCarSelect").selectedOptions[0].text,
    pickupDate: document.getElementById("pickupDate").value,
    returnDate: document.getElementById("returnDate").value,
    pickupLocation: document.getElementById("pickupLocation").value,
    notes: document.getElementById("notes").value,
    dailyRate: Number(document.getElementById("dailyRate").value.replace(/[^0-9]/g, "")),
    totalCost: totalCost // 👈 use the clean number
  };

  fetch("http://localhost:5000/api/car-hire", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(response => {
    console.log("Server response:", response);
    alert("Hire request submitted successfully!");
    document.getElementById("hireForm").reset();
    submitBtn.disabled = false;
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Failed to submit hire request");
    submitBtn.disabled = false;
  });

}