import Chart from 'chart.js/auto';
import { clean } from './dataService';

let chartHoteles: any, chartMuseos: any, chartMixto: any;

export function renderChartHoteles(data: any[]) {
    const container = document.getElementById('admin-charts');
    if (!container) return;

    container.classList.remove('hidden');

    const ctx = document.getElementById('chart-hoteles') as HTMLCanvasElement;
    if (!ctx) return;
    if (chartHoteles) chartHoteles.destroy();
    chartHoteles = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...data].reverse().map(r => new Date(r.fecha_reporte).toLocaleDateString()),
            datasets: [{ label: 'Huéspedes', data: [...data].reverse().map(r => clean(r.total_huespedes)), borderColor: '#3b82f6', tension: 0.4, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }]
        },
        options: { maintainAspectRatio: false, animation: false, responsive: true, devicePixelRatio: 4 }
    });
}

export function renderChartMuseos(data: any[]) {
    
    const container = document.getElementById('admin-charts');
    if (container) container.classList.remove('hidden');

    const ctx = document.getElementById('chart-museos') as HTMLCanvasElement;
    if (!ctx) return;
    if (chartMuseos) chartMuseos.destroy();
    const t = data.reduce((acc, c) => ({ l: acc.l + clean(c.visitantes_locales), n: acc.n + clean(c.visitantes_nacionales), e: acc.e + clean(c.visitantes_internacionales) }), { l: 0, n: 0, e: 0 });
    chartMuseos = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Locales', 'Nacionales', 'Internacionales'], datasets: [{ data: [t.l, t.n, t.e], backgroundColor: ['#f97316', '#fbbf24', '#10b981'] }] },
        options: { maintainAspectRatio: false, animation: false, responsive: true, devicePixelRatio: 4 }
    });
}

export function renderChartIntegrado(hoteles: any[], museos: any[], mes: string = 'all') {
    const ctx = document.getElementById('chart-mixto-turismo') as HTMLCanvasElement;
    if (!ctx) return;
    if (chartMixto) chartMixto.destroy();
    const filtrar = (data: any[]) => mes === 'all' ? data : data.filter(r => new Date(r.fecha_reporte).getMonth().toString() === mes);
    const h = filtrar(hoteles), m = filtrar(museos);
    chartMixto = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hotelería', 'Museos'],
            datasets: [
                { label: 'Nacionales', data: [h.reduce((a, b) => a + clean(b.origen_nacional), 0), m.reduce((a, b) => a + clean(b.visitantes_nacionales), 0)], backgroundColor: '#3b82f6' },
                { label: 'Internacionales', data: [h.reduce((a, b) => a + clean(b.origen_internacional), 0), m.reduce((a, b) => a + clean(b.visitantes_internacionales), 0)], backgroundColor: '#10b981' }
            ]
        },
        options: { maintainAspectRatio: false, scales: { y: { stacked: true }, x: { stacked: true } }, animation: false, responsive: true, devicePixelRatio: 4 }
    });
}