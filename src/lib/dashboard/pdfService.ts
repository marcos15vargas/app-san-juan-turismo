import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { clean } from "./dataService";

export async function exportarPDF(hoteles: any[], museos: any[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const dateStr = new Date().toLocaleDateString();

  // Portada
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("INFORME TURÍSTICO", 14, 25);

  // Gráficos (Captura los Canvas del DOM)
  const canvases = [
    { id: "chart-hoteles", y: 50, h: 60 },
    { id: "chart-mixto-turismo", y: 120, h: 70 },
  ];

  canvases.forEach((c) => {
    const el = document.getElementById(c.id) as HTMLCanvasElement;
    if (el) doc.addImage(el.toDataURL("image/png"), "PNG", 15, c.y, 180, c.h);
  });

  // Tablas
  doc.addPage();
  autoTable(doc, {
    startY: 20,
    head: [["Fecha", "Establecimiento", "Huéspedes"]],
    body: hoteles.map((r) => [
      new Date(r.fecha_reporte).toLocaleDateString(),
      r.entidades.nombre,
      clean(r.total_huespedes),
    ]),
  });

  doc.save(`Informe_${dateStr}.pdf`);
}
