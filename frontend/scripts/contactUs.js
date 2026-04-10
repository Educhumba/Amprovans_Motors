// CONTACT FORM HANDLER 
const form = document.getElementById("contactForm");
const statusText = document.getElementById("contactStatus");
const submitBtn = form.querySelector(".contact-btn");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect form data
    const data = {
        name: document.getElementById("contactName").value.trim(),
        email: document.getElementById("contactEmail").value.trim(),
        phone: document.getElementById("contactPhone").value.trim(),
        message: document.getElementById("contactMessage").value.trim(),
        timestamp: new Date().toISOString()
    };

    console.log("Sending to backend:", data);

    // Disable button and show sending state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending...`;
    statusText.innerText = "";

    try {
        const res = await fetch("http://localhost:5000/api/client-messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            statusText.innerText = "✅ Message sent successfully!";
            statusText.style.color = "green";
            form.reset();
        } else {
            throw new Error("Failed to send");
        }
    } catch (err) {
        console.error(err);
        statusText.innerText = "❌ Failed to send. Please try again.";
        statusText.style.color = "red";
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Send Message`;
    }
});


// FLOATING WHATSAPP VISIBILITY
const whatsappBtn = document.getElementById("floatingWhatsapp");
const contactSection = document.getElementById("contact");

window.addEventListener("scroll", () => {
    const rect = contactSection.getBoundingClientRect();
    whatsappBtn.style.display = (rect.top < window.innerHeight && rect.bottom > 0) ? "block" : "none";
});