import * as d3 from "d3";
import { normalizar, clean } from "./dataService";

let svg: any, g: any, zoom: any;

export async function initMap(hoteles: any[], museos: any[]) {
  const container = document.getElementById("map-container");
  if (!container) return;
  d3.select("#map-container svg").remove(); // Limpieza para evitar duplicados

  const width = container.clientWidth,
    height = 400;
  const sanjuan: any = await d3.json("/maps/sanjuan.json");

  const getWeight = (name: string) => {
    const norm = normalizar(name);
    const h = hoteles
      .filter(
        (r) => r.entidades && normalizar(r.entidades.departamento) === norm
      )
      .reduce((acc, r) => acc + clean(r.total_huespedes), 0);
    const m = museos
      .filter(
        (r) => r.entidades && normalizar(r.entidades.departamento) === norm
      )
      .reduce((acc, r) => acc + clean(r.total_visitantes), 0);
    return h + m;
  };

  const maxVal = Math.max(
    ...sanjuan.features.map((f: any) => getWeight(f.properties.departamento)),
    10
  );
  const colorScale = d3
    .scaleSequential(d3.interpolateGreens)
    .domain([0, maxVal]);

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
    .attr(
      "class",
      "stroke-slate-300 cursor-pointer transition-colors hover:fill-slate-100"
    )
    .on("click", (event: any, d: any) => {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(
              Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
            )
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
        );
      actualizarInfoDepto(d.properties.departamento, hoteles, museos);
    });

  zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .on("zoom", (e) => g.attr("transform", e.transform));
  svg.call(zoom);

  document.getElementById("reset-map")?.addEventListener("click", () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    actualizarInfoDepto(null, hoteles, museos);
  });
}

function actualizarInfoDepto(
  nombre: string | null,
  hoteles: any[],
  museos: any[]
) {
  const nameEl = document.getElementById("depto-name");
  if (!nombre) {
    if (nameEl) nameEl.textContent = "Selecciona uno";
    document.getElementById("depto-hoteles")!.textContent = "0";
    document.getElementById("depto-museos")!.textContent = "0";
    return;
  }
  nameEl!.textContent = nombre;
  const norm = normalizar(nombre);
  const h = hoteles
    .filter((r) => normalizar(r.entidades.departamento) === norm)
    .reduce((a, b) => a + clean(b.total_huespedes), 0);
  const m = museos
    .filter((r) => normalizar(r.entidades.departamento) === norm)
    .reduce((a, b) => a + clean(b.total_visitantes), 0);
  document.getElementById("depto-hoteles")!.textContent = h.toLocaleString();
  document.getElementById("depto-museos")!.textContent = m.toLocaleString();
}
