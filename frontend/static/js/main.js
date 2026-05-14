function getFilters() {
    return {
        product: document.getElementById("productFilter")?.value || "ALL",
        day: document.getElementById("dayInput")?.value || "ALL",
        race: document.getElementById("race")?.value || "ALL",
        pp: document.getElementById("pp")?.value || "ALL",
        pl: document.getElementById("pl")?.value || "ALL",
        plc: document.getElementById("plc")?.value || "ALL",
        pwo: document.getElementById("pwo")?.value || "ALL",
        dpd: document.getElementById("DPD")?.value || "ALL",
        os: document.getElementById("OSB")?.value || "ALL",
        aging: document.getElementById("aging")?.value || "ALL"
    };
}
// =========================
// 🔥 PRODUCT FILTER
// =========================
document.getElementById("productFilter").addEventListener("change", function () {
    selectedProduct = this.value;
    reloadDashboard();
});

function loadSummary(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/summary?${query}`)
    .then(res => res.json())
    .then(data => {
        document.getElementById("totalCollection").innerText = data.total_collection;
        document.getElementById("totalFiles").innerText = data.total_files;
    });
}


document.querySelectorAll("select").forEach(el => {
    el.addEventListener("change", reloadDashboard);
});
function loadTotalCollection(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/total-collection?${query}`)
    .then(res => res.json())
    .then(data => {

        document.getElementById("totalCollection").innerText =
            "RM " + data.current.toLocaleString()
        ;
       
        updateChangeUI("collectionChange", data.current, data.last);
    });
}
function loadTarget(filters) {
    console.log(filters);
    const query = new URLSearchParams(filters).toString();

    fetch(`/target?${query}`)
    .then(res => res.json())
    .then(data => {
        document.getElementById("target").innerText ="RM " + data.target.toLocaleString();
    });
}
function loadTotalFiles(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/total-files?${query}`)
    .then(res => res.json())
    .then(data => {
        document.getElementById("totalFiles").innerText =data.total_files.toLocaleString();
        updateChangeUI("filesChange", data.current, data.last);
    });
}

function loadTopPayments(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/top-payments?${query}`)
    .then(res => res.json())
    .then(data => {

        const tbody = document.getElementById("topPayments");
        tbody.innerHTML = "";

        data.forEach((item, index) => {

            const tr = document.createElement("tr");

            const ic = item["ACCOUNT NO"] || "-";
            const name = item["NAME"] || "-";
            const amount = Number(item["RM PAID"] || 0).toLocaleString();

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${ic}</td>
                <td class="amount">RM ${amount}</td>
            `;

            tbody.appendChild(tr);
        });
    });
}

function loadTopCollectors(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/top-collectors?${query}`)
    .then(res => res.json())
    .then(data => {

        const tbody = document.getElementById("topCollectors");
        tbody.innerHTML = "";

        data.forEach((item, index) => {

            const tr = document.createElement("tr");

            const name = item["COLLECTOR"] || "-";
            const amount = Number(item["RM PAID"] || 0).toLocaleString();

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${name}</td>
                <td class="amount">RM ${amount}</td>
            `;

            tbody.appendChild(tr);
        });
    });
}
function loadStatusSummary(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/status-summary?${query}`)
    .then(res => res.json())
    .then(data => {

        ["CTC", "UCT", "WIP", "ABORT"].forEach(status => {

            const title = document.getElementById(status.toLowerCase() + "Title");
            const list = document.getElementById(status.toLowerCase() + "List");

            if (!data[status]) return;

            title.innerText = `${status} (${data[status].total})`;

            list.innerHTML = "";

            const sub = data[status].sub_status;

            Object.keys(sub).forEach(key => {

                const li = document.createElement("li");

                li.innerHTML = `
                    <span>${key}</span>
                    <span>${sub[key]}</span>
                `;

                list.appendChild(li);
            });
        });
    });
}


async function loadTargetVsCollection() {
    const res = await fetch("/product-performance?mode=dashboard");
    const data = await res.json();

    const tbody = document.getElementById("collector");
    tbody.innerHTML = "";

    data.forEach(row => {
        const percent = Number(row.ACHIEVEMENT || 0);

        // 🔥 COLOR LOGIC
        let color = "#28a745"; // green
        if (percent < 85) color = "#ffc107"; // yellow
        if (percent < 70) color = "#dc3545"; // red

        tbody.innerHTML += `
            <tr>
                <td><strong>${row.PRODUCT}</strong></td>
                <td>RM ${(row.TARGET || 0).toLocaleString()}</td>
                <td>RM ${(row.COLLECTION || 0).toLocaleString()}</td>
                <td>
                    <div style="font-weight:600; margin-bottom:4px;">
                        ${percent.toFixed(2)}%
                    </div>

                    <div class="progress-bar">
                        <div class="progress" 
                             style="width:${percent}%; background:${color}">
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function loadCards(filters) {
    const query = new URLSearchParams(filters).toString();

    const colRes = await fetch(`/total-collection?${query}`);
    const colData = await colRes.json();

    const targetRes = await fetch(`/target?${query}`);
    const targetData = await targetRes.json();

    const fileRes = await fetch(`/total-files?${query}`);
    const fileData = await fileRes.json();

    // ✅ TOTAL COLLECTION
    document.getElementById("totalCollection").innerText =
        "RM " + (colData.current || 0).toLocaleString();

    // ✅ 🔥 MOVE IT HERE
    updateChangeUI("collectionChange", colData.current, colData.last);

    // ✅ TARGET
    document.getElementById("target").innerText =
        "RM " + (targetData.target || 0).toLocaleString();

    // ✅ FILES
    document.getElementById("totalFiles").innerText =
        fileData.total_files || 0;

    // ✅ ACHIEVEMENT
    let achievement = 0;
    if (targetData.target > 0) {
        achievement = (colData.current / targetData.target) * 100;
        achievement = Math.min(achievement, 100);
    }

    document.getElementById("achievement").innerText =
        achievement.toFixed(2) + "%";
}

function reloadDashboard() {
    const filters = getFilters();  
    
    loadChart(filters);
    // loadTotalCollection(filters);
    loadTarget(filters);
    loadTotalFiles(filters); 
    loadTopPayments(filters); // 🔥 ADD THIS
    loadTopCollectors(filters);   // 🔥 ADD THIS
    loadStatusSummary(filters); // 🔥 ADD THIS
    loadTargetVsCollection();
    loadCards(filters);





}

function loadProducts(selected = null) {
    fetch("/products")
    .then(res => res.json())
    .then(products => {

        const dropdown = document.getElementById("productFilter");

        dropdown.innerHTML = `<option value="ALL">Products</option>`;

        products.forEach(p => {
            dropdown.innerHTML += `<option value="${p}">${p}</option>`;
        });

        // ✅ restore selected value
        if (selected) {
            dropdown.value = selected;
        }
    });
}
window.onload = function () {
    loadProducts();
    reloadDashboard();
};
// =========================
// 🔥 UPLOAD DATA
// =========================
document.getElementById("uploadBtn").addEventListener("click", function() {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    // Show loading
    document.getElementById("uploadBtn").innerText = "Uploading...";
    document.getElementById("uploadBtn").disabled = true;

    fetch('/upload-data', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert("Data uploaded successfully!");
            reloadDashboard(); // Reload dashboard after upload
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(error => {
        alert("Upload failed: " + error.message);
    })
    .finally(() => {
        // Reset button
        document.getElementById("uploadBtn").innerText = "Upload Data File";
        document.getElementById("uploadBtn").disabled = false;
        // Clear file input
        document.getElementById("fileInput").value = "";
    });
});

