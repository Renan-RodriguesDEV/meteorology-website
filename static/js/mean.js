// Carrega somente 'corechart' (ColumnChart, PieChart, ComboChart etc.)
// Removidos 'bar' e 'histogram' para evitar requests 404 desnecessários
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initializeStatsApp);

// Configuração do intervalo de atualização
const UPDATE_INTERVAL = 60000; // 1 minuto

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar dados: " + url);
  return res.json();
}

// Inicialização da aplicação de estatísticas
function initializeStatsApp() {
  // Carregar dados iniciais
  loadAllStats();

  // Configurar eventos
  document
    .getElementById("refreshStatsBtn")
    .addEventListener("click", function () {
      showLoadingState();
      loadAllStats();
    });

  document
    .getElementById("stats-period-select")
    .addEventListener("change", function () {
      loadAllStats();
    });

  // Atualização automática
  setInterval(loadAllStats, UPDATE_INTERVAL);
}

function showLoadingState() {
  const refreshBtn = document.getElementById("refreshStatsBtn");
  const originalContent = refreshBtn.innerHTML;
  refreshBtn.innerHTML = '<div class="loading"></div> Carregando...';
  refreshBtn.disabled = true;

  setTimeout(() => {
    refreshBtn.innerHTML = originalContent;
    refreshBtn.disabled = false;
  }, 2000);
}

async function loadAllStats() {
  const select = document.getElementById("stats-period-select");
  if (!select) return; // página não carregada
  const period = select.value;
  try {
    const [stats, etoData] = await Promise.all([
      fetchJSON(`/api/means/stats/${period}`),
      fetchJSON(`/api/means/evapotranspiration/${period}`),
    ]);

    updateSummaryCards(stats);
    drawTemperatureStats(stats, period);
    drawHumidityStats(stats, period);
    drawPeriodComparison();
    drawEvapotranspirationChart(etoData);
    drawTemperatureDistribution(period);
    drawHumidityDistribution(period);
  } catch (err) {
    console.error("Erro ao carregar estatísticas:", err);
    // fallback visual mínimo
    const containers = [
      "chart_temp_stats",
      "chart_humidity_stats",
      "chart_period_comparison",
      "chart_evapotranspiration",
      "chart_temp_distribution",
      "chart_humidity_distribution",
    ];
    containers.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="no-data">Erro ao carregar</p>';
    });
  }
}

function updateSummaryCards(stats) {
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  if (!stats || stats.error) {
    [
      "temp-15d-avg",
      "temp-15d-min",
      "temp-15d-max",
      "hum-15d-avg",
      "hum-15d-min",
      "hum-15d-max",
      "eto-15d-avg",
    ].forEach((id) =>
      setText(
        id,
        id.includes("eto")
          ? "-- mm/dia"
          : id.includes("hum")
          ? id.includes("min")
            ? "Min: --%"
            : id.includes("max")
            ? "Max: --%"
            : "--%"
          : id.includes("min")
          ? "Min: --°C"
          : id.includes("max")
          ? "Max: --°C"
          : "--°C"
      )
    );
    return;
  }
  const t = stats.temperature;
  const h = stats.humidity;
  const e = stats.evapotranspiration;
  setText("temp-15d-avg", `${Number(t.avg).toFixed(2)}°C`);
  setText("temp-15d-min", `Min: ${Number(t.min).toFixed(2)}°C`);
  setText("temp-15d-max", `Max: ${Number(t.max).toFixed(2)}°C`);
  setText("hum-15d-avg", `${Number(h.avg).toFixed(2)}%`);
  setText("hum-15d-min", `Min: ${Number(h.min).toFixed(2)}%`);
  setText("hum-15d-max", `Max: ${Number(h.max).toFixed(2)}%`);
  setText("eto-15d-avg", `${Number(e.avg).toFixed(3)} mm/dia`);
}

function drawTemperatureStats(stats, period) {
  if (stats.error) {
    document.getElementById("chart_temp_stats").innerHTML =
      '<p class="no-data">Nenhum dado disponível</p>';
    return;
  }

  const data = google.visualization.arrayToDataTable([
    ["Métrica", "Temperatura (°C)", { role: "style" }],
    ["Mínima", stats.temperature.min, "#4fc3f7"],
    ["Média", stats.temperature.avg, "#ff9800"],
    ["Máxima", stats.temperature.max, "#f44336"],
  ]);

  const options = {
    title: `Estatísticas de Temperatura - ${
      period === "15d" ? "Últimos 15 dias" : "Últimos 30 dias"
    }`,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    vAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
      title: "Temperatura (°C)",
      titleTextStyle: { color: "#e0e6ed" },
    },
    legend: { position: "none" },
    height: 380,
    chartArea: { left: 80, top: 60, width: "80%", height: "75%" },
  };

  const chart = new google.visualization.ColumnChart(
    document.getElementById("chart_temp_stats")
  );
  chart.draw(data, options);
}
function drawHumidityStats(stats, period) {
  if (stats.error) {
    document.getElementById("chart_humidity_stats").innerHTML =
      '<p class="no-data">Nenhum dado disponível</p>';
    return;
  }

  const data = google.visualization.arrayToDataTable([
    ["Métrica", "Umidade (%)", { role: "style" }],
    ["Mínima", stats.humidity.min, "#2196f3"],
    ["Média", stats.humidity.avg, "#64ffda"],
    ["Máxima", stats.humidity.max, "#00e676"],
  ]);

  const options = {
    title: `Estatísticas de Umidade - ${
      period === "15d" ? "Últimos 15 dias" : "Últimos 30 dias"
    }`,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    vAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
      title: "Umidade (%)",
      titleTextStyle: { color: "#e0e6ed" },
    },
    legend: { position: "none" },
    height: 380,
    chartArea: { left: 80, top: 60, width: "80%", height: "75%" },
  };

  const chart = new google.visualization.ColumnChart(
    document.getElementById("chart_humidity_stats")
  );
  chart.draw(data, options);
}

async function drawPeriodComparison() {
  try {
    const stats15d = await fetchJSON("/api/means/stats/15d");
    const stats30d = await fetchJSON("/api/means/stats/30d");

    if (stats15d.error || stats30d.error) {
      document.getElementById("chart_period_comparison").innerHTML =
        '<p class="no-data">Dados insuficientes para comparação</p>';
      return;
    }

    const data = google.visualization.arrayToDataTable([
      ["Período", "Temp. Média (°C)", "Umidade Média (%)"],
      [
        "15 dias",
        Number(stats15d.temperature.avg),
        Number(stats15d.humidity.avg),
      ],
      [
        "30 dias",
        Number(stats30d.temperature.avg),
        Number(stats30d.humidity.avg),
      ],
    ]);

    const options = {
      title: "Comparação entre Períodos",
      backgroundColor: "transparent",
      titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
      hAxis: {
        textStyle: { color: "#8892b0" },
        gridlines: { color: "#2a2a3e" },
      },
      vAxes: {
        0: {
          textStyle: { color: "#8892b0" },
          gridlines: { color: "#2a2a3e" },
          title: "Temperatura (°C)",
          titleTextStyle: { color: "#ff9800" },
        },
        1: {
          textStyle: { color: "#8892b0" },
          title: "Umidade (%)",
          titleTextStyle: { color: "#64ffda" },
        },
      },
      series: {
        0: { type: "bars", targetAxisIndex: 0, color: "#ff9800" },
        1: { type: "bars", targetAxisIndex: 1, color: "#64ffda" },
      },
      legend: {
        position: "top",
        textStyle: { color: "#8892b0" },
      },
      height: 380,
      chartArea: { left: 80, top: 80, width: "80%", height: "70%" },
    };

    const chart = new google.visualization.ComboChart(
      document.getElementById("chart_period_comparison")
    );
    chart.draw(data, options);
  } catch (err) {
    console.error("Erro na comparação de períodos:", err);
    document.getElementById("chart_period_comparison").innerHTML =
      '<p class="no-data">Erro ao carregar comparação</p>';
  }
}

function drawEvapotranspirationChart(etoData) {
  if (!etoData || etoData.length === 0) {
    document.getElementById("chart_evapotranspiration").innerHTML =
      '<p class="no-data">Nenhum dado de evapotranspiração disponível</p>';
    return;
  }

  const rows = [["Data", "ETo (mm/dia)", "Temperatura (°C)"]];
  etoData.forEach((item) => {
    const date = new Date(item.date);
    rows.push([date, item.evapotranspiration, item.temperature]);
  });

  const data = google.visualization.arrayToDataTable(rows);

  const options = {
    title: "Evapotranspiração de Referência Diária",
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
      format: "dd/MM",
    },
    vAxes: {
      0: {
        textStyle: { color: "#8892b0" },
        gridlines: { color: "#2a2a3e" },
        title: "ETo (mm/dia)",
        titleTextStyle: { color: "#00e676" },
      },
      1: {
        textStyle: { color: "#8892b0" },
        title: "Temperatura (°C)",
        titleTextStyle: { color: "#ff9800" },
      },
    },
    series: {
      0: { type: "line", targetAxisIndex: 0, color: "#00e676", lineWidth: 3 },
      1: {
        type: "line",
        targetAxisIndex: 1,
        color: "#ff9800",
        lineWidth: 2,
        lineDashStyle: [5, 5],
      },
    },
    legend: {
      position: "top",
      textStyle: { color: "#8892b0" },
    },
    curveType: "function",
    height: 380,
    chartArea: { left: 80, top: 80, width: "80%", height: "70%" },
  };

  const chart = new google.visualization.ComboChart(
    document.getElementById("chart_evapotranspiration")
  );
  chart.draw(data, options);
}
async function drawTemperatureDistribution(period) {
  try {
    const rawData = await fetchJSON(`/api/readings/${period}`);

    if (!rawData || rawData.length === 0) {
      document.getElementById("chart_temp_distribution").innerHTML =
        '<p class="no-data">Nenhum dado disponível</p>';
      return;
    }

    // Criar distribuição de temperatura
    const tempRanges = {};
    rawData.forEach((reading) => {
      const temp = Math.floor(parseFloat(reading.temperature));
      tempRanges[temp] = (tempRanges[temp] || 0) + 1;
    });

    const rows = [["Temperatura (°C)", "Frequência"]];
    Object.keys(tempRanges)
      .sort((a, b) => a - b)
      .forEach((temp) => {
        rows.push([`${temp}°C`, tempRanges[temp]]);
      });

    const data = google.visualization.arrayToDataTable(rows);

    const options = {
      title: "Distribuição de Temperatura",
      backgroundColor: "transparent",
      titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
      hAxis: {
        textStyle: { color: "#8892b0" },
        gridlines: { color: "#2a2a3e" },
      },
      vAxis: {
        textStyle: { color: "#8892b0" },
        gridlines: { color: "#2a2a3e" },
        title: "Frequência",
        titleTextStyle: { color: "#e0e6ed" },
      },
      legend: { position: "none" },
      colors: ["#ff6b6b"],
      height: 380,
      chartArea: { left: 80, top: 60, width: "80%", height: "75%" },
    };

    const chart = new google.visualization.ColumnChart(
      document.getElementById("chart_temp_distribution")
    );
    chart.draw(data, options);
  } catch (err) {
    console.error("Erro na distribuição de temperatura:", err);
    document.getElementById("chart_temp_distribution").innerHTML =
      '<p class="no-data">Erro ao carregar distribuição</p>';
  }
}

async function drawHumidityDistribution(period) {
  try {
    const rawData = await fetchJSON(`/api/readings/${period}`);

    if (!rawData || rawData.length === 0) {
      document.getElementById("chart_humidity_distribution").innerHTML =
        '<p class="no-data">Nenhum dado disponível</p>';
      return;
    }

    // Criar faixas de umidade
    const humidityRanges = {
      "Muito Baixa (0-30%)": 0,
      "Baixa (30-50%)": 0,
      "Ideal (50-70%)": 0,
      "Alta (70-85%)": 0,
      "Muito Alta (85-100%)": 0,
    };

    rawData.forEach((reading) => {
      const humidity = parseFloat(reading.humidity);
      if (humidity < 30) humidityRanges["Muito Baixa (0-30%)"]++;
      else if (humidity < 50) humidityRanges["Baixa (30-50%)"]++;
      else if (humidity < 70) humidityRanges["Ideal (50-70%)"]++;
      else if (humidity < 85) humidityRanges["Alta (70-85%)"]++;
      else humidityRanges["Muito Alta (85-100%)"]++;
    });

    const rows = [["Faixa de Umidade", "Frequência"]];
    Object.entries(humidityRanges).forEach(([range, count]) => {
      if (count > 0) rows.push([range, count]);
    });

    const data = google.visualization.arrayToDataTable(rows);

    const options = {
      title: "Distribuição de Umidade Relativa",
      backgroundColor: "transparent",
      titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
      pieSliceText: "percentage",
      pieSliceTextStyle: { color: "#ffffff", fontSize: 12 },
      legend: {
        position: "right",
        textStyle: { color: "#8892b0", fontSize: 11 },
      },
      colors: ["#f44336", "#ff9800", "#4caf50", "#2196f3", "#9c27b0"],
      height: 380,
      chartArea: { left: 50, top: 60, width: "70%", height: "75%" },
    };

    const chart = new google.visualization.PieChart(
      document.getElementById("chart_humidity_distribution")
    );
    chart.draw(data, options);
  } catch (err) {
    console.error("Erro na distribuição de umidade:", err);
    document.getElementById("chart_humidity_distribution").innerHTML =
      '<p class="no-data">Erro ao carregar distribuição</p>';
  }
}
