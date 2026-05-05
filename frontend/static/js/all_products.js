async function loadAllProducts() {
    const res = await fetch("/product-performance");
    const data = await res.json();

    const container = document.getElementById("tablesContainer");
    container.innerHTML = "";

    // 🔥 GROUP BY MONTH
    const grouped = {};

    data.forEach(row => {
        if (!grouped[row.MONTH]) {
            grouped[row.MONTH] = [];
        }
        grouped[row.MONTH].push(row);
    });

    // 🔥 CREATE CARDS
    Object.keys(grouped).sort().forEach(month => {

        const card = document.createElement("div");
        card.className = "month-card";

        card.innerHTML = `
            <h3>${month}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Target</th>
                        <th>Collection</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    ${grouped[month].map(p => `
                        <tr>
                            <td>${p.PRODUCT}</td>
                            <td>RM ${Number(p.TARGET).toLocaleString()}</td>
                            <td>RM ${Number(p.COLLECTION).toLocaleString()}</td>
                            <td class="amount">${p.ACHIEVEMENT.toFixed(1)}%</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        container.appendChild(card);
    });
}
loadAllProducts();

function goBack() {
    window.history.back();
}