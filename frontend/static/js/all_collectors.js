function loadAllCollectors() {

    fetch(`/all-collectors`)
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
        Object.keys(grouped).sort().forEach(month => {

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

            grouped[month]
                .sort((a, b) => b["RM PAID"] - a["RM PAID"])
                .slice(0, 10) // top 10 per month
                .forEach((row, index) => {

                    const tr = document.createElement("tr");

                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${row.COLLECTOR}</td>
                        <td>RM ${Number(row["RM PAID"]).toLocaleString()}</td>
                    `;

                    tbody.appendChild(tr);
                });

            card.appendChild(title);
            card.appendChild(table);
            grid.appendChild(card);
        });
    });
}

// LOAD
loadAllCollectors();

function goBack() {
    window.history.back();
}
