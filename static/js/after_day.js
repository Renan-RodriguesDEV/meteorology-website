google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initAfterDay);

async function fetchJSON(u) {
  const r = await fetch(u);
  if (!r.ok) throw new Error("Erro ao buscar " + u);
  return r.json();
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

async function initAfterDay() {
  await Promise.all([loadSummary(), loadSeries()]);
}

async function loadSummary() {
  try {
    const summary = await fetchJSON("/api/after-day/summary");
    if (summary.error) return; // mantém placeholders
    setText("date-yesterday", "Data: " + summary.date);
    setText("temp-avg", `${summary.temperature.avg.toFixed(2)}°C`);
    setText("temp-min", `Min: ${summary.temperature.min.toFixed(2)}°C`);
    setText("temp-max", `Max: ${summary.temperature.max.toFixed(2)}°C`);
    setText("hum-avg", `${summary.humidity.avg.toFixed(2)}%`);
    setText("hum-min", `Min: ${summary.humidity.min.toFixed(2)}%`);
    setText("hum-max", `Max: ${summary.humidity.max.toFixed(2)}%`);
    setText("count-reads", summary.count);
  } catch (e) {
    console.error(e);
  }
}

async function loadSeries() {
  try {
    const series = await fetchJSON("/api/after-day/series");
    if (!series.data || series.data.length === 0) {
      document.getElementById("chart_temp_series").innerHTML =
        '<p class="no-data">Sem dados</p>';
      document.getElementById("chart_hum_series").innerHTML =
        '<p class="no-data">Sem dados</p>';
      return;
    }
    drawTemp(series.data);
    drawHum(series.data);
  } catch (e) {
    console.error(e);
  }
}

function drawTemp(rows) {
  const dataArr = [["Hora", "Temperatura (°C)"]];
  rows.forEach((r) => {
    dataArr.push([new Date(r.timestamp), r.temperature]);
  });
  const data = google.visualization.arrayToDataTable(dataArr);
  const opts = {
    title: "Temperatura (Ontem)",
    backgroundColor: "transparent",
    hAxis: { format: "HH:mm", textStyle: { color: "#8892b0" } },
    vAxis: {
      textStyle: { color: "#8892b0" },
      title: "°C",
      titleTextStyle: { color: "#e0e6ed" },
    },
    legend: { position: "none" },
    height: 380,
    chartArea: { left: 70, top: 60, width: "80%", height: "70%" },
    colors: ["#ff9800"],
    lineWidth: 3,
    curveType: "function",
  };
  new google.visualization.LineChart(
    document.getElementById("chart_temp_series")
  ).draw(data, opts);
}

function drawHum(rows) {
  const dataArr = [["Hora", "Umidade (%)"]];
  rows.forEach((r) => {
    dataArr.push([new Date(r.timestamp), r.humidity]);
  });
  const data = google.visualization.arrayToDataTable(dataArr);
  const opts = {
    title: "Umidade (Ontem)",
    backgroundColor: "transparent",
    hAxis: { format: "HH:mm", textStyle: { color: "#8892b0" } },
    vAxis: {
      textStyle: { color: "#8892b0" },
      title: "%",
      titleTextStyle: { color: "#e0e6ed" },
    },
    legend: { position: "none" },
    height: 380,
    chartArea: { left: 70, top: 60, width: "80%", height: "70%" },
    colors: ["#64ffda"],
    lineWidth: 3,
    curveType: "function",
  };
  new google.visualization.LineChart(
    document.getElementById("chart_hum_series")
  ).draw(data, opts);
}
