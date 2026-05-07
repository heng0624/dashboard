let chart;

Chart.register(ChartDataLabels);

function loadChart(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/monthly-collection?${query}`)
    .then(res => res.json())
    .then(data => {

        console.log("CHART DATA:", data);

        const labels = data.map(d => d.MONTH);
        const values = data.map(d => d["RM PAID"]);

        if (chart) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = values;
            chart.update();
        } else {
            chart = new Chart(document.getElementById("chart"), {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Monthly Collection (RM)",
                        data: values,
                        backgroundColor: "#4e73df"
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        datalabels: {
                            anchor: "end",
                            align: "top",
                            color: "#000",
                            font: {
                                weight: "bold",
                                size: 11
                            },
                            formatter: (value) => "RM " + Number(value).toLocaleString()
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    })
    .catch(err => console.error("Chart load error:", err));
}