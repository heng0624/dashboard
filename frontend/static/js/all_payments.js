let allData = [];
let currentPages = {};
const rowsPerPage = 10;
let selectedProduct = "ALL";

function loadAllPayments(filters = {}) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/all-payments-table?${query}`)
    .then(res => res.json())
    .then(data => {
        console.log("📦 Raw Data:", data);

        const grouped = {};

        data.forEach(row => {
            if (!grouped[row.month]) {
                grouped[row.month] = [];
            }
            grouped[row.month].push(row);
        });

        Object.keys(grouped).forEach(month => {
            grouped[month].sort((a, b) => Number(b.rm_paid) - Number(a.rm_paid));
        });

        console.log("📊 Grouped Data:", grouped);

        renderMonthlyTables(grouped);
    });
}


function renderMonthlyTables(groupedData) {
    const container = document.getElementById("tablesContainer");

    if (!container) {
        console.error("❌ tablesContainer not found in HTML");
        return;
    }

    container.innerHTML = "";

    Object.keys(groupedData).sort().reverse().forEach(month => {

        if (!currentPages[month]) {
            currentPages[month] = 1;
        }

        // 🔥 CREATE CARD (IMPORTANT)
        const card = document.createElement("div");
        card.className = "month-card";  // ✅ THIS FIXES YOUR CSS

        card.innerHTML = `
            <h3>${month}</h3>
            <table>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Account</th>
                        <th>Name</th>
                        <th>Total Paid</th>
                    </tr>
                </thead>
                <tbody id="table-${month}"></tbody>
            </table>
            <div class="pagination" id="pagination-${month}"></div>
        `;

        container.appendChild(card);

        renderMonthTable(month, groupedData[month]);
        renderMonthPagination(month, groupedData[month]);
    });
}
function renderMonthTable(month, data) {
    const table = document.getElementById(`table-${month}`);
    table.innerHTML = "";

    const page = currentPages[month];
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    const pageData = data.slice(start, end);

    pageData.forEach((row, index) => {
        const tr = document.createElement("tr");

        const numberTd = document.createElement("td");
        numberTd.textContent = start + index + 1;

        const accountTd = document.createElement("td");
        accountTd.textContent = row.account_no;
        accountTd.title = row.account_no;

        const nameTd = document.createElement("td");
        nameTd.textContent = row.name;
        nameTd.title = row.name;
        nameTd.className = "truncate-cell";

        const paidTd = document.createElement("td");
        paidTd.textContent = `RM ${Number(row.rm_paid).toLocaleString()}`;
        paidTd.title = `RM ${Number(row.rm_paid).toLocaleString()}`;

        tr.appendChild(numberTd);
        tr.appendChild(accountTd);
        tr.appendChild(nameTd);
        tr.appendChild(paidTd);
        table.appendChild(tr);
    });
}
function renderMonthPagination(month, data) {
    const container = document.getElementById(`pagination-${month}`);
    container.innerHTML = "";

    const totalPages = Math.ceil(data.length / rowsPerPage);
    const current = currentPages[month];

    if (totalPages <= 1) return;

    const prev = document.createElement("button");
    prev.innerText = "Prev";
    prev.disabled = current === 1;

    prev.onclick = () => {
        currentPages[month]--;
        renderMonthTable(month, data);
        renderMonthPagination(month, data);
    };

    container.appendChild(prev);

    container.appendChild(document.createTextNode(` Page ${current} / ${totalPages} `));

    const next = document.createElement("button");
    next.innerText = "Next";
    next.disabled = current === totalPages;

    next.onclick = () => {
        currentPages[month]++;
        renderMonthTable(month, data);
        renderMonthPagination(month, data);
    };

    container.appendChild(next);
}
function setupProductFilter() {
    const dropdown = document.getElementById("productFilter");

    if (!dropdown) {
        console.error("❌ productFilter not found");
        return;
    }

    fetch("/products")
    .then(res => res.json())
    .then(products => {
        dropdown.innerHTML = `<option value="ALL">All Products</option>`;
        products.forEach(product => {
            dropdown.innerHTML += `<option value="${product}">${product}</option>`;
        });
    })
    .catch(err => {
        console.error("Unable to load products", err);
    });

    dropdown.addEventListener("change", () => {
        selectedProduct = dropdown.value || "ALL";
        currentPages = {};
        const filters = selectedProduct !== "ALL" ? { product: selectedProduct } : {};
        loadAllPayments(filters);
    });
}

// 🔥 load on page start
document.addEventListener("DOMContentLoaded", function () {
    setupProductFilter();
    loadAllPayments();
});

function goBack() {
    window.history.back();
}
