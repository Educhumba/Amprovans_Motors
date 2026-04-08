// CONTACT FORM HANDLER
const form = document.getElementById("contactForm");
const statusText = document.getElementById("contactStatus");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        name: document.getElementById("contactName").value,
        email: document.getElementById("contactEmail").value,
        phone: document.getElementById("contactPhone").value,
        message: document.getElementById("contactMessage").value,
        timestamp: new Date().toISOString()
    };

    console.log("Sending to backend:", data);

    try {
        // 🔥 READY FOR BACKEND
        const res = await fetch("http://localhost:5000/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            statusText.innerText = "✅ Message sent successfully!";
            form.reset();
        } else {
            throw new Error("Failed");
        }

    } catch (err) {
        statusText.innerText = "❌ Failed to send. Try again.";
    }
});


// FLOATING WHATSAPP VISIBILITY
const whatsappBtn = document.getElementById("floatingWhatsapp");
const contactSection = document.getElementById("contact");

window.addEventListener("scroll", () => {
    const rect = contactSection.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom > 0) {
        whatsappBtn.style.display = "block";
    } else {
        whatsappBtn.style.display = "none";
    }
});