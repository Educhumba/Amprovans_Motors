// ----------------------------
// CAR AUCTIONS SCRIPT
// ----------------------------

const pendingContainer = document.getElementById("pendingAuctions");
const auctionCounter = document.getElementById("auctionCounter");

// Image modal
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const closeModal = modal.querySelector(".close");

closeModal.onclick = function() {
  modal.style.display = "none";
};

window.onclick = function(event) {
  if (event.target === modal) modal.style.display = "none";
};

// Fetch pending auctions
function fetchPendingAuctions() {
  fetch("http://localhost:5000/api/auctions/admin/pending")
    .then(res => res.json())
    .then(data => {
      pendingContainer.innerHTML = "";
      auctionCounter.textContent = data.length;

      if (data.length === 0) {
        pendingContainer.innerHTML = `<tr><td colspan="9" style="text-align:center; color:gray;">No pending auctions</td></tr>`;
        return;
      }

      data.forEach(car => {
        const row = document.createElement("tr");

        const thumbnails = car.images.map(img =>
          `<img src="${img}" class="thumbnail" alt="${car.make}" />`
        ).join("");

        row.innerHTML = `
          <td>${car.make} ${car.model} (${car.year})</td>
          <td>${car.plate_number}</td>
          <td>${car.owner_name}<br>${car.owner_phone}</td>
          <td>${car.owner_email}</td>
          <td>${car.mileage || 'N/A'} km / ${car.transmission} / ${car.fuel_type}</td>
          <td>KSh ${car.expected_price}</td>
          <td>${car.description}</td>
          <td>${thumbnails}</td>
          <td>
            <div class="action-group">
              <input type="number" placeholder="Agreed Price" class="agreedPriceInput"/>
              <button class="auction-action-btn approve-btn">Approve</button>
            </div>
            <div class="action-group" style="margin-top:6px;">
              <input type="text" placeholder="Rejection Reason" class="rejectionReasonInput"/>
              <button class="auction-action-btn reject-btn">Reject</button>
            </div>
          </td>
        `;

        // Thumbnail click → show modal
        row.querySelectorAll(".thumbnail").forEach(img => {
          img.addEventListener("click", () => {
            modal.style.display = "block";
            modalImg.src = img.src;
          });
        });
        // Approve button
        row.querySelector(".approve-btn").addEventListener("click", function() {
          const price = row.querySelector(".agreedPriceInput").value;
          if (!price) return alert("Enter agreed price");

          fetch(`http://localhost:5000/api/auctions/admin/${car.id}/approve`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agreedPrice: Number(price), adminId: 1 })
          })
            .then(res => res.json())
            .then(result => {
              alert(result.message);
              row.remove();
              auctionCounter.textContent = parseInt(auctionCounter.textContent) - 1;
            })
            .catch(err => { console.error(err); alert("Failed to approve"); });
        });

        // Reject button
        row.querySelector(".reject-btn").addEventListener("click", function() {
          const reason = row.querySelector(".rejectionReasonInput").value;
          if (!reason) return alert("Enter rejection reason");

          fetch(`http://localhost:5000/api/auctions/admin/${car.id}/reject`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rejectionReason: reason, adminId: 1 })
          })
            .then(res => res.json())
            .then(result => {
              alert(result.message);
              row.remove();
              auctionCounter.textContent = parseInt(auctionCounter.textContent) - 1;
            })
            .catch(err => { console.error(err); alert("Failed to reject"); });
        });

        pendingContainer.appendChild(row);
      });
    })
    .catch(err => {
      console.error("Error fetching auctions:", err);
    });
}

// Initial fetch and auto-refresh every 30s
fetchPendingAuctions();
setInterval(fetchPendingAuctions, 30000);