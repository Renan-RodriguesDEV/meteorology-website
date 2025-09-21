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
  // Detecta se esta página tem os elementos do dashboard
  const hasCharts =
    document.getElementById("chart_24h_temp") ||
    document.getElementById("chart_24h_hum") ||
    document.getElementById("chart_15d_temp") ||
    document.getElementById("chart_15d_hum") ||
    document.getElementById("chart_monthly_temp") ||
    document.getElementById("chart_monthly_hum");

  const hasCurrentCards =
    document.getElementById("current-temp") &&
    document.getElementById("current-humidity") &&
    document.getElementById("last-reading-time") &&
    document.getElementById("lastUpdate");

  // Carregar dados iniciais apenas se houver área de gráficos
  if (hasCharts) {
    drawAll();
  }
  if (hasCurrentCards) {
    updateCurrentReading();
  }

  // Configurar atualizações automáticas
  if (hasCurrentCards) {
    setInterval(updateCurrentReading, UPDATE_INTERVAL);
  }

  // Configurar eventos
  const refreshBtnEl = document.getElementById("refreshBtn");
  if (refreshBtnEl) {
    refreshBtnEl.addEventListener("click", function () {
      showLoadingState();
      if (hasCharts) drawAll();
      if (hasCurrentCards) updateCurrentReading();
    });
  }

  // Event listener para seletor de período
  const periodSelectEl = document.getElementById("period-select");
  if (periodSelectEl) {
    periodSelectEl.addEventListener("change", function () {
      console.log("Período selecionado:", this.value);
    });
  }

  // Funcionalidade para o toggle da sidebar
  const menuToggleEl = document.getElementById("menu-toggle");
  if (menuToggleEl) {
    menuToggleEl.addEventListener("click", function () {
      const sidebar = document.querySelector(".sidebar");
      if (!sidebar) return;
      // Em mobile, a classe .active faz a sidebar deslizar; em desktop mantemos fixo
      sidebar.classList.toggle("active");
    });
  }

  // Funcionalidade para modal de download
  const downloadBtn = document.getElementById("downloadBtn");
  const downloadModal = document.getElementById("downloadModal");
  const closeModal = document.querySelector(".close-modal");
  const modalDownloadBtn = document.getElementById("download-btn");

  // Define data inicial padrão (uma semana atrás)
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Formata a data para o input datetime-local (formato: YYYY-MM-DDTHH:MM)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const downloadDateEl = document.getElementById("download-date");
  if (downloadDateEl) {
    downloadDateEl.value = formatDate(oneWeekAgo);
  }

  // Abre modal ao clicar no botão download
  if (downloadBtn && downloadModal) {
    downloadBtn.addEventListener("click", function (e) {
      e.preventDefault(); // Previne a navegação para #
      downloadModal.style.display = "block";
    });
  }

  // Fecha modal
  if (closeModal && downloadModal) {
    closeModal.addEventListener("click", function () {
      downloadModal.style.display = "none";
    });
  }

  // Fecha modal ao clicar fora dele
  if (downloadModal) {
    window.addEventListener("click", function (event) {
      if (event.target == downloadModal) {
        downloadModal.style.display = "none";
      }
    });
  }

  // Inicia o download ao clicar no botão dentro do modal
  if (modalDownloadBtn && downloadModal) {
    modalDownloadBtn.addEventListener("click", function () {
      const selectedDateInput = document.getElementById("download-date");
      const selectedDate = selectedDateInput ? selectedDateInput.value : "";
      if (!selectedDate) {
        alert("Por favor, selecione uma data!");
        return;
      }

      const downloadUrl = `/api/readings/file?timestamp=${encodeURIComponent(
        selectedDate
      )}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `readings_${selectedDate.replace(/[:\-T]/g, "_")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      downloadModal.style.display = "none";
    });
  }

  // Ajusta layout ao redimensionar a janela
  window.addEventListener("resize", function () {
    const container = document.querySelector(".container");
    if (container) {
      // Remove qualquer margem inline; layout controlado só por CSS
      container.style.marginLeft = "";
    }
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
  const rows = [];
  data.forEach((r) => {
    let date = typeof r[xField] === "string" ? new Date(r[xField]) : r[xField];
    if (isNaN(date?.getTime?.())) return;
    rows.push([date, Number(r[yField])]);
  });

  const dt = new google.visualization.DataTable();
  dt.addColumn("datetime", "Data");
  dt.addColumn("number", title);
  dt.addRows(rows);

  const options = {
    title: title,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
      format: "dd/MM HH:mm",
    },
    vAxis: { textStyle: { color: "#8892b0" }, gridlines: { color: "#2a2a3e" } },
    legend: { position: "none" },
    curveType: "function",
    colors: ["#64ffda"],
    height: 380,
    chartArea: { left: 60, top: 60, width: "85%", height: "70%" },
  };

  const chart = new google.visualization.LineChart(
    document.getElementById(elementId)
  );
  chart.draw(dt, options);
}

function drawAreaChart(data, xField, yField, title, elementId, color) {
  const rows = [];
  data.forEach((r) => {
    let date = typeof r[xField] === "string" ? new Date(r[xField]) : r[xField];
    if (isNaN(date?.getTime?.())) return;
    rows.push([date, Number(r[yField])]);
  });

  const dt = new google.visualization.DataTable();
  dt.addColumn("datetime", "Data");
  dt.addColumn("number", title);
  dt.addRows(rows);
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
  const rows = [];
  data.forEach((r) => {
    let date = typeof r[xField] === "string" ? new Date(r[xField]) : r[xField];
    if (isNaN(date?.getTime?.())) return;
    rows.push([date, Number(r[yField])]);
  });

  const dt = new google.visualization.DataTable();
  dt.addColumn("datetime", "Hora");
  dt.addColumn("number", title);
  dt.addRows(rows);
  const options = {
    title: title,
    backgroundColor: "transparent",
    titleTextStyle: { color: "#e0e6ed", fontSize: 16 },
    hAxis: {
      textStyle: { color: "#8892b0" },
      gridlines: { color: "#2a2a3e" },
      format: "HH:mm",
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
  const rows = [];
  data.forEach((r) => {
    let date = typeof r[xField] === "string" ? new Date(r[xField]) : r[xField];
    if (isNaN(date?.getTime?.())) return;
    rows.push([date, Number(r[yField])]);
  });

  const dt = new google.visualization.DataTable();
  dt.addColumn("datetime", "Data");
  dt.addColumn("number", title);
  dt.addRows(rows);
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
