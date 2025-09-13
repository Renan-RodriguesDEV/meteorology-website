async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Falha ao buscar " + url);
  return r.json();
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

async function loadSun() {
  try {
    const [today, yesterday] = await Promise.all([
      fetchJSON("/api/sun/today"),
      fetchJSON("/api/sun/yesterday"),
    ]);
    setText("sunrise-today", today.sunrise_hm || "--:--");
    setText("sunset-today", today.sunset_hm || "--:--");
    setText("daylength-today", today.day_length_human || "-- h");
    setText("sunrise-yesterday", yesterday.sunrise_hm || "--:--");
    setText("sunset-yesterday", yesterday.sunset_hm || "--:--");
  } catch (e) {
    console.error(e);
  }
}

async function loadSpecificDate(d) {
  if (!d) return;
  try {
    const data = await fetchJSON(`/api/sun/day?day=${d}`);
    alert(
      `Data: ${data.date}\nNascer: ${data.sunrise_hm} | Pôr: ${data.sunset_hm}\nDuração: ${data.day_length_human}`
    );
  } catch (e) {
    console.error(e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadSun();
  document.getElementById("refreshSunBtn")?.addEventListener("click", loadSun);
  document.getElementById("loadDateBtn")?.addEventListener("click", () => {
    const d = document.getElementById("date-input").value;
    loadSpecificDate(d);
  });
});
