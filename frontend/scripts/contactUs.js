// ================= CONTACT FORM =================

const form = document.getElementById("contactForm");
const statusText = document.getElementById("contactStatus");
const ContactsubmitBtn = form.querySelector(".contact-btn");

const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactPhone = document.getElementById("contactPhone");
const contactMessage = document.getElementById("contactMessage");

// start disabled
ContactsubmitBtn.disabled = true;


/* ================= NAME ================= */
contactName.addEventListener("input", () => {
contactName.value = contactName.value.replace(/[^A-Za-z\s]/g,"");
toggleContactSubmit();
});


/* ================= PHONE ================= */
contactPhone.addEventListener("input", () => {

contactPhone.value = contactPhone.value.replace(/[^0-9+]/g,"");

const digits = contactPhone.value.replace(/\D/g,"").slice(0,12);

if(contactPhone.value.startsWith("+")){
contactPhone.value = "+" + digits;
}else{
contactPhone.value = digits;
}

toggleContactSubmit();

});


/* ================= EMAIL ================= */
contactEmail.addEventListener("input", toggleContactSubmit);


/* ================= MESSAGE ================= */
contactMessage.addEventListener("input", () => {

contactMessage.value =
contactMessage.value.replace(/[<>]/g,"");

toggleContactSubmit();

});


/* ================= VALIDATION ================= */
function toggleContactSubmit(){

const valid =
contactName.value.trim().length >= 3 &&
contactEmail.checkValidity() &&
contactPhone.value.replace(/\D/g,"").length >= 10 &&
contactMessage.value.trim().length >= 5;

ContactsubmitBtn.disabled = !valid;

}


/* ================= SUBMIT ================= */
form.addEventListener("submit", async (e) => {
e.preventDefault();

// final validation
if(
contactName.value.trim().length < 3 ||
!contactEmail.checkValidity() ||
contactPhone.value.replace(/\D/g,"").length < 10 ||
contactMessage.value.trim().length < 5
){
Swal.fire({
  icon: "warning",
  title: "Invalid Input",
  text: "Please fill all fields correctly",
  timer: 2000,
  showConfirmButton: false
});
statusText.style.color = "red";
return;
}

// Collect form data
const data = {
name: contactName.value.trim(),
email: contactEmail.value.trim(),
phone: contactPhone.value.trim(),
message: contactMessage.value.trim(),
timestamp: new Date().toISOString()
};

// UI state
ContactsubmitBtn.disabled = true;
ContactsubmitBtn.innerHTML =
`<i class="fas fa-spinner fa-spin"></i> Sending...`;

statusText.innerText = "";

try {

const res = await fetch(
"http://localhost:5000/api/client-messages",
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(data)
}
);

if (res.ok) {
Swal.fire({
  icon: "success",
  title: "Message Sent!",
  text: "We’ll get back to you shortly.",
  timer: 2500,
  showConfirmButton: false
});
statusText.style.color = "green";
form.reset();
ContactsubmitBtn.disabled = true;
} else {
throw new Error("Failed to send");
}

} catch (err) {

console.error(err);

Swal.fire({
  icon: "error",
  title: "Failed",
  text: "Please try again later",
  timer: 2500,
  showConfirmButton: false
});

statusText.style.color = "red";

ContactsubmitBtn.disabled = false;

} finally {

ContactsubmitBtn.innerHTML =
`<i class="fas fa-paper-plane"></i> Send Message`;

}

});



/* ================= FLOATING WHATSAPP ================= */

const whatsappBtn =
document.getElementById("floatingWhatsapp");

const contactSection =
document.getElementById("contact");

window.addEventListener("scroll", () => {

const rect =
contactSection.getBoundingClientRect();

whatsappBtn.style.display =
(rect.top < window.innerHeight &&
rect.bottom > 0)
? "block"
: "none";

});