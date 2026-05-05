let allData = [];
let currentPages = {};
const rowsPerPage = 10;

function loadAllPayments(filters = {}) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/all-payments-table?${query}`)
    .then(res => res.json())
    .then(data => {

        console.log("📦 Raw Data:", data);

        // 🔥 GROUP BY MONTH
        const grouped = {};

        data.forEach(row => {
            if (!grouped[row.month]) {
                grouped[row.month] = [];
            }
            grouped[row.month].push(row);
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

    Object.keys(groupedData).sort().forEach(month => {

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

    pageData.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.account_no}</td>
            <td>${row.name}</td>
            <td>RM ${Number(row.rm_paid).toLocaleString()}</td>
        `;

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
// 🔥 load on page start
document.addEventListener("DOMContentLoaded", function () {
    loadAllPayments();
});

function goBack() {
    window.history.back();
}
