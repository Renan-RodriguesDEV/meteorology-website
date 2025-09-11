// Carrega biblioteca de visualização
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(drawAll);

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar dados: " + url);
  return res.json();
}

async function drawAll() {
  try {
    // 24h
    const data24h = await fetchJSON("/api/readings/24h");
    // 15 dias
    const data15d = await fetchJSON("/api/readings/15d");
    // 30 dias (mensal)
    const data30d = await fetchJSON("/api/readings/30d");

    // === 24h ===
    drawLine(
      data24h,
      "timestamp",
      "temperature",
      "Temperatura últimas 24h (°C)",
      "chart_24h_temp"
    );
    drawLine(
      data24h,
      "timestamp",
      "humidity",
      "Umidade últimas 24h (%)",
      "chart_24h_hum"
    );

    // === 15 dias ===
    drawLine(
      data15d,
      "timestamp",
      "temperature",
      "Temperatura últimos 15 dias (°C)",
      "chart_15d_temp"
    );
    drawLine(
      data15d,
      "timestamp",
      "humidity",
      "Umidade últimos 15 dias (%)",
      "chart_15d_hum"
    );

    // === 30 dias ===
    drawLine(
      data30d,
      "timestamp",
      "temperature",
      "Temperatura últimos 30 dias (°C)",
      "chart_monthly_temp"
    );
    drawLine(
      data30d,
      "timestamp",
      "humidity",
      "Umidade últimos 30 dias (%)",
      "chart_monthly_hum"
    );
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dados: " + err.message);
  }
}

function drawLine(data, xField, yField, title, elementId) {
  const rows = [["Data", title]];
  data.forEach((r) => rows.push([r[xField], Number(r[yField])]));
  drawChart(rows, title, elementId);
}

function drawChart(rows, title, elementId) {
  const dt = google.visualization.arrayToDataTable(rows);
  const options = {
    title,
    curveType: "function",
    legend: { position: "bottom" },
    height: 380,
  };
  const chart = new google.visualization.LineChart(
    document.getElementById(elementId)
  );
  chart.draw(dt, options);
}
