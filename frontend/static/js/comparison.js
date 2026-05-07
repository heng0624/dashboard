function calculateChange(current, last) {
    if (!last || last === 0) {
        return {
            percent: 0,
            status: "remain"
        };
    }

    const percent = ((current - last) / last) * 100;

    if (percent > 0) {
        return { percent, status: "increase" };
    } else if (percent < 0) {
        return { percent: Math.abs(percent), status: "decrease" };
    } else {
        return { percent: 0, status: "remain" };
    }
}
function updateChangeUI(elementId, current, last) {
    const result = calculateChange(current, last);

    const el = document.getElementById(elementId);

    let icon = "";
    let text = "";
    let className = "";

    if (result.status === "increase") {
        icon = "↑";
        text = "Increase";
        className = "up";
    } 
    else if (result.status === "decrease") {
        icon = "↓";
        text = "Decrease";
        className = "down";
    } 
    else {
        icon = "→";
        text = "No change";
        className = "remain";
    }

    el.className = `change ${className}`;
    el.innerText = `${icon} ${result.percent.toFixed(1)}% ${text} vs last month`;
}
