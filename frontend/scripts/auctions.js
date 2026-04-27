document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("auctionForm");
const status = document.getElementById("auctionStatus");
const submitBtn = form.querySelector(".auction-btn");

if (!form) return;


/* ================= INPUT REFERENCES ================= */

const ownerName = document.getElementById("ownerName");
const ownerPhone = document.getElementById("ownerPhone");
const ownerEmail = document.getElementById("ownerEmail");

const plateNumber = document.getElementById("plateNumber");
const carMake = document.getElementById("carMake");
const carModel = document.getElementById("carModel");
const carYear = document.getElementById("carYear");
const mileage = document.getElementById("mileage");
const engine = document.getElementById("engine");
const color = document.getElementById("color");
const location = document.getElementById("location");
const expectedPrice = document.getElementById("expectedPrice");
const carImages = document.getElementById("carImages");
const transmission = document.getElementById("transmission");
const fuel = document.getElementById("fuel");
const body = document.getElementById("body");
const condition = document.getElementById("condition");
const carDescription = document.getElementById("carDescription");


/* ================= NAME ================= */
ownerName.addEventListener("input", () => {
ownerName.value = ownerName.value.replace(/[^A-Za-z\s]/g,"");
toggleSubmit();
});


/* ================= PHONE ================= */
ownerPhone.addEventListener("input", () => {

ownerPhone.value = ownerPhone.value.replace(/[^0-9+]/g,"");

const digits = ownerPhone.value.replace(/\D/g,"").slice(0,12);

if(ownerPhone.value.startsWith("+")){
ownerPhone.value = "+" + digits;
}else{
ownerPhone.value = digits;
}

toggleSubmit();
});


/* ================= EMAIL ================= */
ownerEmail.addEventListener("input", toggleSubmit);


/* ================= PLATE NUMBER ================= */
plateNumber.addEventListener("input", () => {
let value = plateNumber.value
.toUpperCase()
.replace(/[^A-Z0-9]/g,"")
.slice(0,7);
if(value.length > 3){
value = value.slice(0,3) + " " + value.slice(3);
}
plateNumber.value = value;
toggleSubmit();
});


/* ================= MAKE ================= */
carMake.addEventListener("input", () => {
carMake.value = carMake.value.replace(/[^A-Za-z0-9\s]/g,"");
toggleSubmit();
});


/* ================= MODEL ================= */
carModel.addEventListener("input", () => {
carModel.value = carModel.value.replace(/[^A-Za-z0-9\s]/g,"");
toggleSubmit();
});


/* ================= YEAR ================= */
const currentYear = new Date().getFullYear();

carYear.min = 1980;
carYear.max = currentYear;

carYear.addEventListener("input", toggleSubmit);


/* ================= MILEAGE ================= */
mileage.addEventListener("input", () => {
mileage.value = mileage.value.replace(/\D/g,"");
toggleSubmit();
});


/* ================= ENGINE ================= */
engine.addEventListener("input", () => {
engine.value = engine.value.replace(/\D/g,"");
toggleSubmit();
});


/* ================= COLOR ================= */
color.addEventListener("input", () => {
color.value = color.value.replace(/[^A-Za-z\s]/g,"");
toggleSubmit();
});


/* ================= LOCATION ================= */
location.addEventListener("input", () => {
location.value = location.value.replace(/[^A-Za-z0-9\s,-]/g,"");
toggleSubmit();
});


/* ================= PRICE ================= */
expectedPrice.addEventListener("input", () => {
  let value = expectedPrice.value.replace(/[^0-9]/g, "");

  if (!value) {
    expectedPrice.value = "";
    toggleSubmit();
    return;
  }

  expectedPrice.dataset.raw = value;

  expectedPrice.value = Number(value).toLocaleString();

  toggleSubmit();
});

/* ================= IMAGES ================= */
carImages.addEventListener("change", toggleSubmit);
const preview = document.getElementById("imagePreview");
carImages.addEventListener("change", () => {
preview.innerHTML = "";
const files = Array.from(carImages.files);
if(files.length > 10){
Swal.fire({
  icon: "warning",
  title: "Too Many Images",
  text: "Maximum 10 images allowed",
  timer: 2500,
  showConfirmButton: false
});
carImages.value="";
return;
}
files.forEach(file => {
if(file.size > 7 * 1024 * 1024){
Swal.fire({
  icon: "warning",
  title: "File Too Large",
  text: file.name + " exceeds 7MB",
  timer: 2500,
  showConfirmButton: false
});
carImages.value="";
preview.innerHTML="";
return;
}
const reader = new FileReader();
reader.onload = e => {
const img = document.createElement("img");
img.src = e.target.result;
preview.appendChild(img);
};
reader.readAsDataURL(file);
});
toggleSubmit();
});


/* ================= TOGGLE SUBMIT ================= */
function toggleSubmit(){

const valid =
ownerName.value.length >=3 &&
ownerPhone.value.length >=10 &&
ownerEmail.checkValidity() &&
plateNumber.value.length >=6 &&
carMake.value &&
carModel.value &&
carYear.value &&
mileage.value &&
color.value &&
location.value &&
expectedPrice.dataset.raw &&
carImages.files.length > 0;

submitBtn.disabled = !valid;

}


/* ================= SUBMIT ================= */

form.addEventListener("submit", async (e) => {
e.preventDefault();

submitBtn.disabled = true;
status.textContent = "Submitting...";

try{

const formData = new FormData();

formData.append("ownerName", ownerName.value);
formData.append("ownerPhone", ownerPhone.value);
formData.append("ownerEmail", ownerEmail.value);

formData.append("plateNumber", plateNumber.value);
formData.append("make", carMake.value);
formData.append("model", carModel.value);
formData.append("year", carYear.value);
formData.append("mileage", mileage.value);
formData.append("engine", engine.value);
formData.append("transmission", transmission.value);
formData.append("fuelType", fuel.value);
formData.append("body", body.value);
formData.append("condition", condition.value);
formData.append("color", color.value);
formData.append("location", location.value);
formData.append("expectedPrice", expectedPrice.dataset.raw);
formData.append("description", carDescription.value);

const images = carImages.files;

for(let i=0;i<images.length;i++){
formData.append("images", images[i]);
}

const res = await fetch("http://localhost:5000/api/auctions",{
method:"POST",
body:formData
});

const data = await res.json();

if(res.ok){
Swal.fire({
  icon: "success",
  title: "Auction Request Submitted!",
  text: "Await admin approval.",
  timer: 2500,
  showConfirmButton: false
});
form.reset();
expectedPrice.dataset.raw = "";
preview.innerHTML = "";
submitBtn.disabled = true;
status.textContent = "";
}else{
throw new Error();
}

}catch(err){
Swal.fire({
  icon: "error",
  title: "Submission Failed",
  text: "Please try again",
  timer: 2500,
  showConfirmButton: false
});
submitBtn.disabled=false;
}

});

});