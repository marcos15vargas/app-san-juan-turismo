import * as d3 from "d3";
import { normalizar, clean } from "./dataService";

let svg: any, g: any, zoom: any;

// Función auxiliar para animar los números
function animateValue(id: string, start: number, end: number, duration: number) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTime: number | null = null;

  const step = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);
    obj.textContent = current.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

export async function initMap(hoteles: any[], museos: any[]) {
  const container = document.getElementById("map-container");
  if (!container) return;
  d3.select("#map-container svg").remove();

  const width = container.clientWidth,
    height = 400;
  const sanjuan: any = await d3.json("/maps/sanjuan.json");
  
  const tooltip = d3.select("#map-tooltip");

  const getWeight = (name: string) => {
    const norm = normalizar(name);
    const h = hoteles
      .filter((r) => r.entidades && normalizar(r.entidades.departamento) === norm)
      .reduce((acc, r) => acc + clean(r.total_huespedes), 0);
    const m = museos
      .filter((r) => r.entidades && normalizar(r.entidades.departamento) === norm)
      .reduce((acc, r) => acc + clean(r.total_visitantes), 0);
    return h + m;
  };

  const maxVal = Math.max(
    ...sanjuan.features.map((f: any) => getWeight(f.properties.departamento)),
    10
  );
  const colorScale = d3.scaleSequential(d3.interpolateGreens).domain([0, maxVal]);

  svg = d3
    .select("#map-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);
    
  g = svg.append("g");
  const projection = d3.geoMercator().fitSize([width, height], sanjuan);
  const path = d3.geoPath().projection(projection);

  g.selectAll("path")
    .data(sanjuan.features)
    .join("path")
    .attr("d", path)
    .attr("fill", (d: any) => {
      const w = getWeight(d.properties.departamento);
      return w > 0 ? colorScale(w) : "#ffffff";
    })
    .attr("class", "stroke-slate-300 cursor-pointer transition-colors hover:fill-slate-100")
    .on("mouseover", (event: any, d: any) => {
      tooltip.classed("hidden", false).text(d.properties.departamento);
      d3.select(event.currentTarget).attr("stroke-width", "2").attr("stroke", "#475569");
    })
    .on("mousemove", (event: any) => {
      tooltip.style("top", (event.layerY - 35) + "px")
             .style("left", (event.layerX + 10) + "px");
    })
    .on("mouseleave", (event: any) => {
      tooltip.classed("hidden", true);
      d3.select(event.currentTarget).attr("stroke-width", "1").attr("stroke", "#cbd5e1");
    })
    .on("click", (event: any, d: any) => {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
        );
      actualizarInfoDepto(d.properties.departamento, hoteles, museos);
    });

  zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (e) => g.attr("transform", e.transform));
  svg.call(zoom);

  document.getElementById("reset-map")?.addEventListener("click", () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    actualizarInfoDepto(null, hoteles, museos);
  });

  // NUEVO: Al inicializar, cargar los totales provinciales
  actualizarInfoDepto(null, hoteles, museos);
}

function actualizarInfoDepto(nombre: string | null, hoteles: any[], museos: any[]) {
  const nameEl = document.getElementById("depto-name");
  const hEl = document.getElementById("depto-hoteles");
  const mEl = document.getElementById("depto-museos");
  const eEl = document.getElementById("depto-entidades"); // Referencia al contador de entidades

  // Obtenemos valores actuales para que la animación empiece desde donde estaba el número
  const currentH = parseInt(hEl?.textContent?.replace(/\./g, '') || "0");
  const currentM = parseInt(mEl?.textContent?.replace(/\./g, '') || "0");
  const currentE = parseInt(eEl?.textContent?.replace(/\./g, '') || "0");

  let h: number, m: number, e: number;

  if (!nombre) {
    // Escenario: Vista General Provincial
    if (nameEl) nameEl.textContent = "Total Provincial (Últimos 30 días)";
    
    h = hoteles.reduce((acc, r) => acc + clean(r.total_huespedes), 0);
    m = museos.reduce((acc, r) => acc + clean(r.total_visitantes), 0);
    
    // Contar entidades únicas en toda la provincia (últimos 30 días)
    const idsH = hoteles.map(r => r.entidad_id);
    const idsM = museos.map(r => r.entidad_id);
    e = new Set([...idsH, ...idsM]).size;

  } else {
    // Escenario: Departamento Individual seleccionado
    if (nameEl) nameEl.textContent = nombre;
    const norm = normalizar(nombre);
    
    // Filtramos los datos del mes correspondientes a este departamento
    const filtradosH = hoteles.filter((r) => normalizar(r.entidades.departamento) === norm);
    const filtradosM = museos.filter((r) => normalizar(r.entidades.departamento) === norm);
    
    h = filtradosH.reduce((a, b) => a + clean(b.total_huespedes), 0);
    m = filtradosM.reduce((a, b) => a + clean(b.total_visitantes), 0);
    
    // Contar cuántas entidades distintas reportaron en este departamento este mes
    const idsH = filtradosH.map(r => r.entidad_id);
    const idsM = filtradosM.map(r => r.entidad_id);
    e = new Set([...idsH, ...idsM]).size;
  }

  // Ejecutamos las animaciones con los nuevos valores filtrados
  animateValue("depto-hoteles", currentH, h, 600);
  animateValue("depto-museos", currentM, m, 600);
  if (eEl) animateValue("depto-entidades", currentE, e, 600);
}