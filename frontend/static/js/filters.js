const productFilter = document.getElementById("productFilter");
const agingWrapper = document.getElementById("agingWrapper");
const hsbcFilters = document.getElementById("hsbcFilters");

productFilter.addEventListener("change", function () {
    const product = this.value;

    // 🔥 HSBC logic
    if (product === "HSBC") {
        agingWrapper.style.display = "none";   // ❌ hide aging
        hsbcFilters.style.display = "block";   // ✅ show HSBC filters
    } else {
        agingWrapper.style.display = "block";  // ✅ show aging
        hsbcFilters.style.display = "none";   // ❌ hide HSBC filters
    }

    reloadDashboard(); // keep your existing logic
});

// // =========================
// // 🔥 RESET FILTERS FUNCTION
// // =========================
function resetFilters() {
    // Reset all filter values to "ALL"
    document.getElementById("productFilter").value = "ALL";
    document.getElementById("dayInput").value = "ALL";
    document.getElementById("race").value = "ALL";
    document.getElementById("pp").value = "ALL";
    document.getElementById("pl").value = "ALL";
    document.getElementById("OSB").value = "ALL";
    document.getElementById("aging").value = "ALL";
    document.getElementById("pwo").value = "ALL";
    document.getElementById("plc").value = "ALL";
    document.getElementById("DPD").value = "ALL";

    // Show aging wrapper and hide HSBC filters when resetting
    agingWrapper.style.display = "block";
    hsbcFilters.style.display = "none";

    // Reload dashboard with reset filters
    reloadDashboard();
}

// Add event listener to reset button
document.getElementById("resetBtn").addEventListener("click", resetFilters);