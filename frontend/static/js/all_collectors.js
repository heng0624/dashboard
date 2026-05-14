let selectedProduct = "ALL";

function loadAllCollectors() {
    const query = selectedProduct !== "ALL" ? `?product=${selectedProduct}` : "";
    fetch(`/all-collectors${query}`)
    .then(res => res.json())
    .then(data => {

        const grid = document.getElementById("collectorGrid");
        grid.innerHTML = "";

        // 🔥 GROUP DATA BY MONTH
        const grouped = {};

        data.forEach(row => {
            const month = row.MONTH;

            if (!grouped[month]) {
                grouped[month] = [];
            }

            grouped[month].push(row);
        });

        // 🔥 CREATE TABLE FOR EACH MONTH
        Object.keys(grouped).sort().reverse().forEach(month => {  // reverse to show latest first

            const card = document.createElement("div");
            card.className = "month-card";

            const title = document.createElement("h3");
            title.innerText = month;

            const table = document.createElement("table");

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Collector</th>
                        <th>RM</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector("tbody");

            // Sort by RM PAID descending
            grouped[month].sort((a, b) => b["RM PAID"] - a["RM PAID"]);

            const itemsPerPage = 10;
            const totalPages = Math.ceil(grouped[month].length / itemsPerPage);
            let currentPage = 1;

            function renderPage() {
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageData = grouped[month].slice(start, end);

                tbody.innerHTML = "";

                pageData.forEach((row, index) => {
                    const tr = document.createElement("tr");

                    const rankTd = document.createElement("td");
                    rankTd.textContent = start + index + 1;

                    const collectorTd = document.createElement("td");
                    collectorTd.textContent = row.COLLECTOR;
                    collectorTd.title = row.COLLECTOR;
                    collectorTd.className = "truncate-cell";

                    const paidTd = document.createElement("td");
                    paidTd.textContent = `RM ${Number(row["RM PAID"]).toLocaleString()}`;
                    paidTd.title = `RM ${Number(row["RM PAID"]).toLocaleString()}`;

                    tr.appendChild(rankTd);
                    tr.appendChild(collectorTd);
                    tr.appendChild(paidTd);
                    tbody.appendChild(tr);
                });

                // Update pagination buttons
                const pagination = card.querySelector(".pagination");
                if (pagination) {
                    pagination.querySelectorAll("button").forEach(btn => {
                        if (btn.innerText == currentPage) {
                            btn.className = "active";
                        } else {
                            btn.className = "";
                        }
                    });
                }
            }

            card.appendChild(title);
            card.appendChild(table);

            // Add pagination if needed
            if (totalPages > 1) {
                const pagination = document.createElement("div");
                pagination.className = "pagination";

                const prev = document.createElement("button");
                prev.innerText = "Prev";
                prev.onclick = () => { if (currentPage > 1) { currentPage--; renderPage(); } };
                pagination.appendChild(prev);

                for (let p = 1; p <= totalPages; p++) {
                    const btn = document.createElement("button");
                    btn.innerText = p;
                    btn.onclick = () => { currentPage = p; renderPage(); };
                    if (p === currentPage) btn.className = "active";
                    pagination.appendChild(btn);
                }

                const next = document.createElement("button");
                next.innerText = "Next";
                next.onclick = () => { if (currentPage < totalPages) { currentPage++; renderPage(); } };
                pagination.appendChild(next);

                card.appendChild(pagination);
            }

            renderPage();  // Initial render

            grid.appendChild(card);
        });
    });
}

// PRODUCT FILTER
document.getElementById("productFilter").addEventListener("change", function () {
    selectedProduct = this.value;
    loadAllCollectors();
});

function loadProducts() {
    fetch("/products")
    .then(res => res.json())
    .then(products => {
        const dropdown = document.getElementById("productFilter");
        dropdown.innerHTML = `<option value="ALL">All Products</option>`;
        products.forEach(p => {
            dropdown.innerHTML += `<option value="${p}">${p}</option>`;
        });
    });
}

// LOAD
loadProducts();
loadAllCollectors();

function goBack() {
    window.history.back();
}
