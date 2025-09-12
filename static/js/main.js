// Carrega biblioteca de visualização
google.charts.load("current", {
  packages: ["corechart", "gauge", "bar", "scatter", "timeline"],
});
google.charts.setOnLoadCallback(initializeApp);

// Configuração do intervalo de atualização (em milissegundos)
const UPDATE_INTERVAL = 30000; // 30 segundos

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar dados: " + url);
  return res.json();
}

// Inicialização da aplicação
function initializeApp() {
  // Carregar dados iniciais
  drawAll();
  updateCurrentReading();

  // Configurar atualizações automáticas
  setInterval(updateCurrentReading, UPDATE_INTERVAL);

  // Configurar eventos
  document.getElementById("refreshBtn").addEventListener("click", function () {
    showLoadingState();
    drawAll();
    updateCurrentReading();
  });

  // Event listener para seletor de período (futuro)
  document
    .getElementById("period-select")
    .addEventListener("change", function () {
      console.log("Período selecionado:", this.value);
    });
}

function showLoadingState() {
  const refreshBtn = document.getElementById("refreshBtn");
  const originalContent = refreshBtn.innerHTML;
  refreshBtn.innerHTML = '<div class="loading"></div> Carregando...';
  refreshBtn.disabled = true;

  setTimeout(() => {
    refreshBtn.innerHTML = originalContent;
    refreshBtn.disabled = false;
  }, 2000);
}

async function drawAll() {
  try {
    // 24h
    const data24h = await fetchJSON("/api/readings/24h");
    // 15 dias
    const data15d = await fetchJSON("/api/readings/15d");
    // 30 dias (mensal)
    const data30d = await fetchJSON("/api/readings/30d");

    // === 24h - Gráficos de linha ===
    drawAreaChart(
      data24h,
      "timestamp",
      "temperature",
      "Temperatura últimas 24h (°C)",
      "chart_24h_temp",
      "#ff6b6b"
    );
    drawColumnChart(
      data24h,
      "timestamp",
      "humidity",
      "Umidade últimas 24h (%)",
      "chart_24h_hum",
      "#4fc3f7"
    );

    // === 15 dias - Gráficos de linha suavizada ===
    drawSmoothLine(
      data15d,
      "timestamp",
      "temperature",
      "Temperatura últimos 15 dias (°C)",
      "chart_15d_temp",
      "#ff9800"
    );
    drawAreaChart(
      data15d,
      "timestamp",
      "humidity",
      "Umidade últimos 15 dias (%)",
      "chart_15d_hum",
      "#2196f3"
    );

    // === 30 dias - Gráficos scatter e combinado ===
    drawScatterChart(
      data30d,
      "temperature",
      "humidity",
      "Correlação Temperatura vs Umidade - 30 dias",
      "chart_monthly_temp"
    );
    drawComboChart(
      data30d,
      "timestamp",
      ["temperature", "humidity"],
      "Temperatura e Umidade - 30 dias",
      "chart_monthly_hum"
    );
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dados: " + err.message);
  }
}

function drawLine(data, xField, yField, title, elementId) {
  const rows = [["Data", title]];
  data.forEach((r) => rows.push([new Date(r[xField]), Number(r[yField])]));
  drawChart(rows, title, elementId, "LineChart");
}

function drawAreaChart(data, xField, yField, title, elementId, color) {
  const rows = [["Data", title]];
  data.forEach((r) => rows.push([new Date(r[xField]), Number(r[yField])]));

  const dt = google.visualization.arrayToDataTable(rows);
  const options = {
    title: title,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
      format: "dd/MM HH:mm",
    },
    vAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    legend: {
      position: "none",
    },
    areaOpacity: 0.3,
    colors: [color],
    height: 380,
    chartArea: { left: 60, top: 60, width: "85%", height: "75%" },
  };

  const chart = new google.visualization.AreaChart(
    document.getElementById(elementId)
  );
  chart.draw(dt, options);
}

function drawColumnChart(data, xField, yField, title, elementId, color) {
  const rows = [["Hora", title]];
  data.forEach((r) => {
    const date = new Date(r[xField]);
    const timeStr = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    rows.push([timeStr, Number(r[yField])]);
  });

  const dt = google.visualization.arrayToDataTable(rows);
  const options = {
    title: title,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    vAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    legend: { position: "none" },
    colors: [color],
    height: 380,
    chartArea: { left: 60, top: 60, width: "85%", height: "75%" },
  };

  const chart = new google.visualization.ColumnChart(
    document.getElementById(elementId)
  );
  chart.draw(dt, options);
}

function drawSmoothLine(data, xField, yField, title, elementId, color) {
  const rows = [["Data", title]];
  data.forEach((r) => rows.push([new Date(r[xField]), Number(r[yField])]));

  const dt = google.visualization.arrayToDataTable(rows);
  const options = {
    title: title,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
      format: "dd/MM",
    },
    vAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    legend: { position: "none" },
    curveType: "function",
    lineWidth: 3,
    colors: [color],
    height: 380,
    chartArea: { left: 60, top: 60, width: "85%", height: "75%" },
  };

  const chart = new google.visualization.LineChart(
    document.getElementById(elementId)
  );
  chart.draw(dt, options);
}

function drawScatterChart(data, xField, yField, title, elementId) {
  const rows = [["Temperatura (°C)", "Umidade (%)"]];
  data.forEach((r) => rows.push([Number(r[xField]), Number(r[yField])]));

  const dt = google.visualization.arrayToDataTable(rows);
  const options = {
    title: title,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      title: "Temperatura (°C)",
      titleTextStyle: { color: "#e0e6ed" },
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    vAxis: {
      title: "Umidade (%)",
      titleTextStyle: { color: "#e0e6ed" },
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    legend: { position: "none" },
    colors: ["#64ffda"],
    pointSize: 5,
    height: 380,
    chartArea: { left: 80, top: 60, width: "80%", height: "75%" },
  };

  const chart = new google.visualization.ScatterChart(
    document.getElementById(elementId)
  );
  chart.draw(dt, options);
}

function drawComboChart(data, xField, yFields, title, elementId) {
  const rows = [["Data", "Temperatura (°C)", "Umidade (%)"]];
  data.forEach((r) =>
    rows.push([
      new Date(r[xField]),
      Number(r[yFields[0]]),
      Number(r[yFields[1]]),
    ])
  );

  const dt = google.visualization.arrayToDataTable(rows);
  const options = {
    title: title,
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
        title: "Temperatura (°C)",
        titleTextStyle: { color: "#ff6b6b" },
      },
      1: {
        textStyle: { color: "#8892b0" },
        title: "Umidade (%)",
        titleTextStyle: { color: "#4fc3f7" },
      },
    },
    series: {
      0: { type: "line", targetAxisIndex: 0, color: "#ff6b6b", lineWidth: 2 },
      1: { type: "bars", targetAxisIndex: 1, color: "#4fc3f7" },
    },
    legend: {
      position: "top",
      textStyle: { color: "#8892b0" },
    },
    height: 380,
    chartArea: { left: 80, top: 80, width: "80%", height: "70%" },
  };

  const chart = new google.visualization.ComboChart(
    document.getElementById(elementId)
  );
  chart.draw(dt, options);
}

function drawChart(rows, title, elementId, chartType = "LineChart") {
  const dt = google.visualization.arrayToDataTable(rows);
  const options = {
    title: title,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    vAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
    },
    legend: {
      position: "bottom",
      textStyle: { color: "#8892b0" },
    },
    curveType: "function",
    colors: ["#64ffda"],
    height: 380,
    chartArea: { left: 60, top: 60, width: "85%", height: "70%" },
  };

  let chart;
  switch (chartType) {
    case "AreaChart":
      chart = new google.visualization.AreaChart(
        document.getElementById(elementId)
      );
      break;
    case "ColumnChart":
      chart = new google.visualization.ColumnChart(
        document.getElementById(elementId)
      );
      break;
    default:
      chart = new google.visualization.LineChart(
        document.getElementById(elementId)
      );
  }

  chart.draw(dt, options);
}

// Função para atualizar a leitura atual
async function updateCurrentReading() {
  try {
    // Busca a última leitura diretamente
    const latest = await fetchJSON("/api/readings/latest");

    console.log("Dados recebidos da API:", latest); // Debug log

    if (latest && latest.temperature !== null && latest.humidity !== null) {
      console.log("Última leitura:", latest); // Debug log

      // Atualiza os valores na interface
      const tempValue = parseFloat(latest.temperature).toFixed(1);
      const humidityValue = parseFloat(latest.humidity).toFixed(1);

      document.getElementById("current-temp").textContent = `${tempValue}°C`;
      document.getElementById(
        "current-humidity"
      ).textContent = `${humidityValue}%`;

      // Formata a data/hora para exibição
      const timestamp = new Date(latest.timestamp);
      const formattedTime = timestamp.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      document.getElementById("last-reading-time").textContent = formattedTime;

      // Atualiza também o timestamp de atualização geral
      document.getElementById(
        "lastUpdate"
      ).textContent = `Última atualização: ${new Date().toLocaleString(
        "pt-BR"
      )}`;
    } else {
      console.log("Nenhum dado encontrado ou dados nulos");
      document.getElementById("current-temp").textContent = "--°C";
      document.getElementById("current-humidity").textContent = "--%";
      document.getElementById("last-reading-time").textContent = "Sem dados";
    }
  } catch (err) {
    console.error("Erro ao atualizar leitura atual:", err);
    document.getElementById("current-temp").textContent = "--°C";
    document.getElementById("current-humidity").textContent = "--%";
    document.getElementById("last-reading-time").textContent =
      "Erro ao carregar";
  }
}
