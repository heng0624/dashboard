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