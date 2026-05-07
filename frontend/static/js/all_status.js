// 🔥 get status from URL
const urlParams = new URLSearchParams(window.location.search);
const selectedStatus = urlParams.get("status");

// title
document.getElementById("title").innerText =
    selectedStatus ? `${selectedStatus} Status` : "All Status";

function loadStatus() {

    const query = selectedStatus ? `?status=${selectedStatus}` : "";

    fetch(`/all-status${query}`)
    .then(res => res.json())
    .then(data => {
        console.log("DATA:", data);
        const container = document.getElementById("tablesContainer");
        container.innerHTML = "";

        // 🔥 GROUP BY MONTH
        const grouped = {};

        data.forEach(row => {
            const month = row.MONTH || "Unknown";

            if (!grouped[month]) {
                grouped[month] = [];
            }

            grouped[month].push(row);
        });

        // 🔥 CREATE TABLE FOR EACH MONTH
        Object.keys(grouped).sort().forEach(month => {

            const section = document.createElement("div");
            section.className = "month-section";

            section.innerHTML = `
                <h3>${month}</h3>
                <table class="status-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Sub Status</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grouped[month].map(row => `
                            <tr>
                                <td>${row["REPORT STATUS"]}</td>
                                <td>${row["SUB-STATUS"]}</td>
                                <td>${row.TOTAL}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;

            container.appendChild(section);
        });

    });
}

loadStatus();

function goBack() {
    window.history.back();
}
