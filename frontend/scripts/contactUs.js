// ================= CONTACT FORM =================

const form = document.getElementById("contactForm");
const statusText = document.getElementById("contactStatus");
const submitBtn = form.querySelector(".contact-btn");

const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactPhone = document.getElementById("contactPhone");
const contactMessage = document.getElementById("contactMessage");

// start disabled
submitBtn.disabled = true;


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

submitBtn.disabled = !valid;

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
statusText.innerText = "Please fill all fields correctly";
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
submitBtn.disabled = true;
submitBtn.innerHTML =
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
statusText.innerText = "Message sent successfully!";
statusText.style.color = "green";
form.reset();
submitBtn.disabled = true;
} else {
throw new Error("Failed to send");
}

} catch (err) {

console.error(err);

statusText.innerText =
"Failed to send. Please try again.";

statusText.style.color = "red";

submitBtn.disabled = false;

} finally {

submitBtn.innerHTML =
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