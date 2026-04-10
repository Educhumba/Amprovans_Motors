document.addEventListener("DOMContentLoaded", () => {

const COMMISSION_RATE = 0.08; // 8% 

const form = document.getElementById("auctionForm");
const status = document.getElementById("auctionStatus");

if (!form) return;

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Submitting...";

    try {
        const formData = new FormData();

        // OWNER DETAILS (client_cars)
        formData.append("ownerName", ownerName.value);
        formData.append("ownerPhone", ownerPhone.value);
        formData.append("ownerEmail", ownerEmail.value);

        // CAR DETAILS (client_cars)
        formData.append("plateNumber", plateNumber.value);
        formData.append("make", carMake.value);
        formData.append("model", carModel.value);
        formData.append("year", carYear.value);
        formData.append("mileage", mileage.value);
        formData.append("engine", engine.value || null);
        formData.append("transmission", transmission.value);
        formData.append("fuelType", fuel.value);
        formData.append("body", body.value);
        formData.append("condition", condition.value);
        formData.append("color", color.value);
        formData.append("location", location.value);
        formData.append("expectedPrice", expectedPrice.value);
        formData.append("description", carDescription.value);

        // IMAGES
        const images = carImages.files;
        for (let i = 0; i < images.length; i++) {
            formData.append("images", images[i]);
        }

        const res = await fetch("http://localhost:5000/api/auctions", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            status.textContent = "✅ Submitted successfully. Await approval.";
            form.reset();
        } else {
            throw new Error(data.message || "Submission failed");
        }

    } catch (err) {
        console.error(err);
        status.textContent = "❌ Submission failed";
    }
});

});