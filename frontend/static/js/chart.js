let chart;

Chart.register(ChartDataLabels);

function formatChartLabel(monthValue, dayFilter) {
    if (!dayFilter || dayFilter === "ALL") {
        return monthValue;
    }

    const [year, month] = String(monthValue).split("-");
    const dayInt = Number(dayFilter);
    const monthIndex = Number(month) - 1;

    if (Number.isNaN(dayInt) || Number.isNaN(monthIndex)) {
        return monthValue;
    }

    const candidateDate = new Date(year, monthIndex, dayInt);
    if (candidateDate.getMonth() !== monthIndex) {
        const lastDay = new Date(year, monthIndex + 1, 0);
        return `${lastDay.getDate()}/${String(monthIndex + 1).padStart(2, "0")}/${year}`;
    }

    return `${candidateDate.getDate()}/${String(monthIndex + 1).padStart(2, "0")}/${year}`;
}

function loadChart(filters) {
    const query = new URLSearchParams(filters).toString();

    fetch(`/monthly-collection?${query}`)
    .then(res => res.json())
    .then(data => {

        console.log("CHART DATA:", data);

        const labels = data.map(d => formatChartLabel(d.MONTH, filters.day));
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