import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, FileText, BarChart2, MessageSquare, Download, 
  Settings, Database, Play, CheckCircle, AlertTriangle, 
  BrainCircuit, Table2, TrendingUp, PieChart, Info, Map, MapPin,
  FileSpreadsheet, Sparkles, ChevronLeft, ChevronRight, Map as MapIcon,
  Layers, MapPin as MapPinIcon, LayoutDashboard, Plus, Trash2,
  Activity, ShieldAlert, Users, Calendar, Maximize, Printer, Image as ImageIcon, Palette,
  PanelRightClose, PanelRightOpen, ChevronDown, ChevronUp, Calculator, Microscope,
  Filter, RefreshCw, ClipboardCheck
} from 'lucide-react';

// --- TIỆN ÍCH THỐNG KÊ (NATIVE JS) ---
const calculateMean = (arr) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
const calculateMedian = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const calculateVariance = (arr, mean) => {
  if (arr.length === 0) return 0;
  return arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
};
const calculateStdDev = (arr, mean) => Math.sqrt(calculateVariance(arr, mean));
const calculateCI95 = (mean, stdDev, n) => {
  if (n === 0) return [0, 0];
  const margin = 1.96 * (stdDev / Math.sqrt(n));
  return [mean - margin, mean + margin];
};
const calculateCorrelation = (x, y) => {
  if (x.length !== y.length || x.length === 0) return 0;
  const meanX = calculateMean(x), meanY = calculateMean(y);
  let num = 0, den1 = 0, den2 = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX, dy = y[i] - meanY;
    num += dx * dy; den1 += dx * dx; den2 += dy * dy;
  }
  return den1 === 0 || den2 === 0 ? 0 : num / Math.sqrt(den1 * den2);
};
const calculateQuartiles = (arr) => {
  if(arr.length === 0) return {min:0, q1:0, median:0, q3:0, max:0};
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = calculateMedian(sorted);
  const lowerHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const upperHalf = sorted.slice(Math.ceil(sorted.length / 2));
  const q1 = calculateMedian(lowerHalf);
  const q3 = calculateMedian(upperHalf);
  return { min, q1, median, q3, max };
};

const getCorrelationColor = (val) => {
  if (val === null || isNaN(val)) return '#f8fafc';
  const intensity = Math.min(Math.abs(val), 1);
  if (val > 0) return `rgba(16, 185, 129, ${intensity * 0.8})`; 
  if (val < 0) return `rgba(225, 29, 72, ${intensity * 0.8})`;  
  return '#f8fafc';
};

const parseExcelDate = (excelDate) => {
    if (!excelDate) return null;
    if (typeof excelDate === 'number') return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    if (typeof excelDate === 'string') {
        const parts = String(excelDate).split(/[-/]/);
        if (parts.length === 3) {
            const d1 = new Date(excelDate);
            if (!isNaN(d1) && String(excelDate).includes('-')) return d1; 
            if (parts[2].length === 4) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); 
        }
        const d = new Date(excelDate);
        if (!isNaN(d)) return d;
    }
    return null;
};

const getISOWeek = (date) => {
     const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
     const dayNum = d.getUTCDay() || 7;
     d.setUTCDate(d.getUTCDate() + 4 - dayNum);
     const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
     return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

const formatTimeGroup = (dateObj, groupType) => {
    if (!dateObj || isNaN(dateObj)) return { sortKey: 'N/A', display: 'N/A' };
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');

    switch(groupType) {
        case 'day': return { sortKey: `${y}-${m}-${d}`, display: `${d}/${m}/${y}` };
        case 'week':
            const w = String(getISOWeek(dateObj)).padStart(2, '0');
            return { sortKey: `${y}-W${w}`, display: `Tuần ${w}, ${y}` };
        case 'month': return { sortKey: `${y}-${m}`, display: `Tháng ${m}/${y}` };
        case 'quarter':
            const q = Math.ceil((dateObj.getMonth() + 1) / 3);
            return { sortKey: `${y}-Q${q}`, display: `Quý ${q}/${y}` };
        case 'year': return { sortKey: `${y}`, display: `Năm ${y}` };
        default: return { sortKey: `${y}-${m}-${d}`, display: `${d}/${m}/${y}` };
    }
};

const MiniScatterChart = ({ dataPoints, trendline, xLabel, yLabel }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new window.Chart(canvasRef.current, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Dữ liệu quan sát',
            data: dataPoints,
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
            borderColor: 'rgb(79, 70, 229)',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            type: 'line',
            label: 'Đường xu hướng (Hồi quy)',
            data: trendline,
            borderColor: 'rgb(225, 29, 72)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { type: 'linear', position: 'bottom', title: { display: true, text: xLabel, font: { weight: 'bold' } } },
          y: { title: { display: true, text: yLabel, font: { weight: 'bold' } } }
        }
      }
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); }
  }, [dataPoints, trendline, xLabel, yLabel]);

  return <div className="w-full h-[350px] mt-4"><canvas ref={canvasRef}></canvas></div>;
};

const normalizeString = (str) => {
  if (!str) return '';
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/tinh|thanh pho|tp\.|tp |phuong|xa|quan|huyen|thi tran/g, '')
            .trim();
};

const generateLocationKey = (str) => {
  if (!str) return '';
  let s = String(str).toLowerCase().trim();
  const prefixes = [
    'thành phố ', 'thanh pho ', 'tp. ', 'tp ',
    'tỉnh ', 'tinh ',
    'quận ', 'quan ', 'q. ', 'q ',
    'huyện ', 'huyen ', 'h. ', 'h ',
    'thị xã ', 'thi xa ', 'tx. ', 'tx ',
    'thị trấn ', 'thi tran ', 'tt. ', 'tt ',
    'phường ', 'phuong ', 'p. ', 'p ',
    'xã ', 'xa ', 'x. ', 'x '
  ];
  for (let p of prefixes) {
    if (s.startsWith(p)) {
      s = s.substring(p.length).trim();
      break; 
    }
  }
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
};

const KNOWN_LOCATIONS = {
  "ha noi": { lat: 21.0285, lng: 105.8542 }, 
  "ho chi minh": { lat: 10.8231, lng: 106.6297 }, 
  "hai phong": { lat: 20.8449, lng: 106.6881 }, 
  "da nang": { lat: 16.0678, lng: 108.2208 }, 
  "can tho": { lat: 10.0452, lng: 105.7469 },
  "hue": { lat: 16.4667, lng: 107.5833 },
  "thua thien hue": { lat: 16.4667, lng: 107.5833 },
  "hai van": { lat: 16.1400, lng: 108.1250 }, 
  "hoa hiep bac": { lat: 16.1158, lng: 108.1341 },
  "hoa hiep nam": { lat: 16.0842, lng: 108.1385 },
  "lang co": { lat: 16.2428, lng: 108.0617 }, 
  "hoa bac": { lat: 16.1436, lng: 107.9628 }, 
  "hoa lien": { lat: 16.0969, lng: 108.0933 }, 
  "an khe": { lat: 16.0594, lng: 108.1830 }, 
  "an hai": { lat: 16.0680, lng: 108.2320 },
  "thanh khe": { lat: 16.0650, lng: 108.1850 }
};

const DashboardWidget = ({ widget, dataset, onRemove }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  const { labels, datasetsData } = React.useMemo(() => {
    const xCols = widget.xAxes && widget.xAxes.length > 0 ? widget.xAxes : (widget.xAxis ? [widget.xAxis] : []);
    if (!dataset || dataset.rows.length === 0 || xCols.length === 0) return { labels: [], datasetsData: [] };

    let l = []; let dData = [];
    const isStacked = widget.type === 'stackedBar' || widget.type === 'stackedBar100';
    const is100 = widget.type === 'stackedBar100';
    const hasTimeGroup = widget.timeGroup && widget.timeGroup !== 'none';

    if (widget.aggMethod === 'count') {
       if (isStacked && xCols.length >= 2) {
           const mainX = xCols[0];
           const stackCategory = xCols[1];
           const table = {};
           const stackVals = new Set();
           const displayMap = {};
           
           dataset.rows.forEach(r => {
               let xSortKey = 'N/A', xDisplay = 'N/A';
               if (hasTimeGroup) {
                   const dObj = parseExcelDate(r[mainX]);
                   if(dObj) {
                       const formatted = formatTimeGroup(dObj, widget.timeGroup);
                       xSortKey = formatted.sortKey; xDisplay = formatted.display;
                   } else { xSortKey = 'Khác'; xDisplay = 'Khác'; }
               } else {
                   xSortKey = r[mainX] !== undefined && r[mainX] !== '' ? String(r[mainX]) : 'N/A';
                   xDisplay = xSortKey;
               }

               const catVal = r[stackCategory] !== undefined && r[stackCategory] !== '' ? String(r[stackCategory]) : 'N/A';
               displayMap[xSortKey] = xDisplay;
               if (!table[xSortKey]) table[xSortKey] = {};
               table[xSortKey][catVal] = (table[xSortKey][catVal] || 0) + 1;
               stackVals.add(catVal);
           });

           let sortedKeys = Object.keys(table);
           if (hasTimeGroup) {
               sortedKeys.sort(); 
           } else {
               const xTotals = {};
               sortedKeys.forEach(x => { xTotals[x] = Object.values(table[x]).reduce((a,b)=>a+b,0); });
               sortedKeys.sort((a,b) => xTotals[b] - xTotals[a]); 
           }
           
           l = sortedKeys.map(k => displayMap[k]);
           const categories = Array.from(stackVals).sort();
           
           categories.forEach(cat => {
               dData.push({ label: cat, yVar: cat, data: sortedKeys.map(x => table[x][cat] || 0) });
           });

           if (is100) {
               l.forEach((x, i) => {
                   let total = 0;
                   dData.forEach(ds => total += ds.data[i]);
                   if (total > 0) dData.forEach(ds => ds.data[i] = (ds.data[i] / total) * 100);
               });
           }
       } else {
           const counts = {};
           const displayMap = {};
           dataset.rows.forEach(r => {
             let xSortKey = 'N/A', xDisplay = 'N/A';
             if (hasTimeGroup) {
                  const dObj = parseExcelDate(r[xCols[0]]);
                  if(dObj) {
                      const formatted = formatTimeGroup(dObj, widget.timeGroup);
                      xSortKey = formatted.sortKey; xDisplay = formatted.display;
                  } else { xSortKey = 'Khác'; xDisplay = 'Khác'; }
             } else {
                  xSortKey = xCols.map(c => r[c] || 'N/A').join(' - ');
                  xDisplay = xSortKey;
             }
             if (xSortKey !== undefined && xSortKey !== '') {
                 counts[xSortKey] = (counts[xSortKey] || 0) + 1;
                 displayMap[xSortKey] = xDisplay;
             }
           });

           let sortedKeys = Object.keys(counts);
           if (hasTimeGroup) sortedKeys.sort();
           else sortedKeys.sort((a,b) => counts[b] - counts[a]);

           l = sortedKeys.map(k => displayMap[k]);
           dData = [{ label: `Số lượng theo ${xCols.join(', ')}`, yVar: 'Số lượng', data: sortedKeys.map(k => counts[k]) }];
       }
    } else {
       const groups = {};
       const displayMap = {};
       dataset.rows.forEach(r => {
         let xSortKey = 'N/A', xDisplay = 'N/A';
         if (hasTimeGroup) {
             const dObj = parseExcelDate(r[xCols[0]]);
             if(dObj) {
                 const formatted = formatTimeGroup(dObj, widget.timeGroup);
                 xSortKey = formatted.sortKey; xDisplay = formatted.display;
             } else { xSortKey = 'Khác'; xDisplay = 'Khác'; }
         } else {
             xSortKey = xCols.map(c => r[c] || 'N/A').join(' - ');
             xDisplay = xSortKey;
         }

         if (xSortKey !== undefined && xSortKey !== '') {
            displayMap[xSortKey] = xDisplay;
            if (!groups[xSortKey]) groups[xSortKey] = {};
            (widget.yAxes || []).forEach(y => {
                if (!groups[xSortKey][y]) groups[xSortKey][y] = [];
                const yVal = Number(r[y]);
                if (!isNaN(yVal)) groups[xSortKey][y].push(yVal);
            });
         }
       });

       let unsortedKeys = Object.keys(groups);
       const tempDatasets = (widget.yAxes || []).map(yVar => {
          return unsortedKeys.map(key => {
              const arr = groups[key][yVar] || [];
              if (arr.length === 0) return 0;
              if (widget.aggMethod === 'sum') return arr.reduce((a,b)=>a+b,0);
              if (widget.aggMethod === 'mean') return arr.reduce((a,b)=>a+b,0)/arr.length;
              return 0;
          });
       });

       let sortedKeys = [...unsortedKeys];
       if (hasTimeGroup) {
           sortedKeys.sort();
       } else {
           if(tempDatasets.length > 0) {
               const valMap = {};
               unsortedKeys.forEach((k, i) => valMap[k] = tempDatasets[0][i]);
               sortedKeys.sort((a,b) => valMap[b] - valMap[a]);
           }
       }

       l = sortedKeys.map(k => displayMap[k]);

       dData = (widget.yAxes || []).map((yVar, dsIdx) => {
          const aggName = widget.aggMethod === 'sum' ? 'Tổng' : 'Trung bình';
          const dsData = sortedKeys.map(key => {
              const arr = groups[key][yVar] || [];
              if (arr.length === 0) return 0;
              if (widget.aggMethod === 'sum') return arr.reduce((a,b)=>a+b,0);
              if (widget.aggMethod === 'mean') return arr.reduce((a,b)=>a+b,0)/arr.length;
              return 0;
          });
          return { label: `${aggName} ${yVar}`, yVar: yVar, data: dsData };
       });

       if (is100 && dData.length > 0) {
           l.forEach((x, i) => {
               let total = 0;
               dData.forEach(ds => total += ds.data[i]);
               if (total > 0) dData.forEach(ds => ds.data[i] = (ds.data[i] / total) * 100);
           });
       }
    }

    if (widget.type === 'pareto' && dData.length > 0) {
        const sortedIndices = dData[0].data.map((v, i) => ({v, i})).sort((a, b) => b.v - a.v);
        l = sortedIndices.map(item => l[item.i]);
        dData = dData.map(ds => ({
            ...ds,
            data: sortedIndices.map(item => ds.data[item.i])
        }));

        let total = dData[0].data.reduce((a,b) => a+b, 0);
        let cumSum = 0;
        let cumData = dData[0].data.map(val => {
            cumSum += val;
            return (cumSum / total) * 100;
        });
        dData.push({
            label: 'Tích lũy (%)',
            yVar: 'Tích lũy (%)',
            data: cumData,
            type: 'line',
            yAxisID: 'y1'
        });
    }

    return { labels: l, datasetsData: dData };
  }, [widget, dataset]);

  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'];
  const bgColorsAlpha = colors.map(c => c + '99');

  useEffect(() => {
    if (widget.type === 'table' || widget.type === 'funnel') return;

    const renderChart = () => {
        if (!window.Chart || !canvasRef.current || labels.length === 0) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const isPieOrDoughnut = widget.type === 'pie' || widget.type === 'doughnut';
        const isStackedChart = widget.type === 'stackedBar' || widget.type === 'stackedBar100';

        const chartDatasets = datasetsData.map((ds, idx) => {
            let isSecondAxis = (widget.dualAxis && idx === 1) || (widget.type === 'pareto' && ds.type === 'line'); 
            let bgColor = isPieOrDoughnut ? labels.map((_, i) => colors[i % colors.length]) : 
                          (widget.type === 'area' ? colors[idx % colors.length] + '33' : bgColorsAlpha[idx % colors.length]);
            let borderColor = isPieOrDoughnut ? '#ffffff' : colors[idx % colors.length];

            let dsType = widget.type;
            if (widget.type === 'area') dsType = 'line';
            if (isStackedChart || widget.type === 'pareto') dsType = 'bar';
            if (ds.type) dsType = ds.type;
            if (isSecondAxis && widget.type === 'bar') dsType = 'line'; 

            return {
                label: ds.label,
                data: ds.data,
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: isPieOrDoughnut ? 2 : 2.5,
                fill: widget.type === 'area',
                tension: 0.4,
                yAxisID: isSecondAxis ? 'y1' : 'y',
                type: dsType,
                pointRadius: (isPieOrDoughnut || dsType === 'bar') ? 0 : 3,
                pointHoverRadius: 6
            };
        });

        const scales = {};
        if (!isPieOrDoughnut) {
            scales.y = { 
                type: 'linear', display: true, position: 'left',
                grid: { color: '#f1f5f9' }, border: { dash: [4, 4] },
                stacked: isStackedChart,
                max: widget.type === 'stackedBar100' ? 100 : undefined,
                ticks: { callback: function(val) { return widget.type === 'stackedBar100' ? val + '%' : val; } }
            };
            if (widget.dualAxis || widget.type === 'pareto') {
                scales.y1 = { 
                    type: 'linear', display: true, position: 'right', 
                    grid: { drawOnChartArea: false },
                    max: widget.type === 'pareto' ? 100 : undefined,
                    ticks: { callback: function(val) { return widget.type === 'pareto' ? val + '%' : val; } }
                };
            }
            scales.x = { grid: { display: false }, stacked: isStackedChart };
        }

        const dataLabelsPlugin = {
            id: 'customDataLabels',
            afterDatasetsDraw(chart) {
                if (!widget.showDataLabels) return;
                const { ctx, data } = chart;
                ctx.save();
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';

                data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    if (!meta.hidden) {
                        meta.data.forEach((element, index) => {
                            const val = dataset.data[index];
                            if (val > 0) { 
                                let displayVal = val.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
                                if (widget.type === 'stackedBar100' || (widget.type === 'pareto' && dataset.type === 'line')) displayVal += '%';
                                
                                const position = element.tooltipPosition();
                                ctx.fillStyle = isPieOrDoughnut || isStackedChart ? '#ffffff' : '#475569';
                                let yOffset = isStackedChart ? position.y + (element.height / 2) + 4 : position.y - 4;
                                if (isPieOrDoughnut) yOffset = position.y;
                                
                                ctx.fillText(displayVal, position.x, yOffset);
                            }
                        });
                    }
                });
                ctx.restore();
            }
        };

        chartInstance.current = new window.Chart(canvasRef.current, {
          type: widget.type === 'area' ? 'line' : (isStackedChart || widget.type === 'pareto' ? 'bar' : widget.type),
          data: { labels: labels, datasets: chartDatasets },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: scales,
            plugins: {
               legend: { 
                   display: isPieOrDoughnut || datasetsData.length > 1, 
                   position: isPieOrDoughnut ? 'right' : 'top',
                   labels: { usePointStyle: true, boxWidth: 8, font: { family: "'Inter', sans-serif", size: 12 } }
               },
               tooltip: { 
                   mode: 'index', intersect: false, 
                   backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                   titleFont: { size: 13, family: "'Inter', sans-serif" },
                   bodyFont: { size: 13, family: "'Inter', sans-serif" },
                   padding: 10, cornerRadius: 8,
                   callbacks: {
                       label: function(context) {
                           let label = context.dataset.label || '';
                           if (label) { label += ': '; }
                           if (context.parsed.y !== null) {
                               label += context.parsed.y.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
                               if (widget.type === 'stackedBar100' || (context.dataset.yAxisID === 'y1' && widget.type === 'pareto')) {
                                   label += '%';
                               }
                           }
                           return label;
                       }
                   }
               }
            }
          },
          plugins: [dataLabelsPlugin]
        });
    };

    if (window.Chart) renderChart();
    else {
        const checkInterval = setInterval(() => {
            if (window.Chart) { clearInterval(checkInterval); renderChart(); }
        }, 500);
        return () => clearInterval(checkInterval);
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); }
  }, [widget, labels, datasetsData]);

  const renderFunnel = () => {
    if (datasetsData.length === 0) return null;
    const funnelData = datasetsData[0].data;
    const maxVal = Math.max(...funnelData);
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-2.5 overflow-y-auto px-4 py-2">
        {funnelData.map((val, idx) => {
          const widthPct = maxVal === 0 ? 0 : Math.max(15, (val / maxVal) * 100);
          return (
            <div key={idx} className="w-full flex flex-col items-center group">
              <div 
                className="relative flex items-center justify-center text-white font-bold text-[13px] rounded shadow-sm transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-md" 
                style={{ width: `${widthPct}%`, height: '38px', backgroundColor: colors[idx % colors.length] }}
                title={`${labels[idx]}: ${val.toLocaleString('vi-VN')}`}
              >
                <span className="truncate px-2 drop-shadow-sm">{val.toLocaleString('vi-VN')}</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1.5 font-medium truncate max-w-full px-2">{labels[idx]}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = () => {
    const xLabelHeader = widget.xAxes && widget.xAxes.length > 0 ? widget.xAxes.join(' / ') : widget.xAxis;
    return (
      <div className="w-full h-full overflow-auto rounded-xl border border-slate-200 custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold text-slate-700 whitespace-nowrap">{xLabelHeader}</th>
              {datasetsData.map((ds, i) => (
                <th key={i} className="p-3.5 font-semibold text-slate-700 text-right whitespace-nowrap">
                   {ds.yVar} <span className="text-[10px] text-slate-400 block font-normal uppercase mt-0.5">{widget.aggMethod}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {labels.map((lbl, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-3.5 text-slate-600 font-medium truncate max-w-[200px]" title={lbl}>{lbl}</td>
                  {datasetsData.map((ds, dsIdx) => (
                     <td key={dsIdx} className="p-3.5 text-slate-800 text-right font-mono font-medium">
                         {ds.data[idx].toLocaleString('vi-VN')}
                     </td>
                  ))}
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col h-[400px] relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
      <div className="flex justify-between items-start mb-5 shrink-0 border-b border-slate-100 pb-3">
        <div>
           <h3 className="font-bold text-slate-800 text-[16px] pr-8 leading-tight">{widget.title || 'Biểu đồ Phân tích'}</h3>
           <div className="flex items-center gap-2 mt-1.5">
               <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">{widget.type}</span>
               {widget.dualAxis && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider">2 Trục</span>}
               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">{widget.aggMethod}</span>
           </div>
        </div>
        <button onClick={() => onRemove(widget.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white shadow-sm border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-full p-2 z-10">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex-1 relative w-full overflow-hidden">
        {widget.type === 'table' ? renderTable() : 
         widget.type === 'funnel' ? renderFunnel() : 
         <canvas ref={canvasRef}></canvas>}
      </div>
    </div>
  );
}

const apiKey = ""; 

const callGeminiAPI = async (prompt, systemInstruction) => {
  try {
    let retries = 5; let delay = 1000;
    while (retries > 0) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction || "Bạn là một Chuyên gia Thống kê và Khoa học Dữ liệu Y Tế. Trả lời bằng tiếng Việt chuyên nghiệp, rõ ràng." }] }
          })
        });
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI.";
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [dataset, setDataset] = useState({ headers: [], rows: [] });
  const [dataStats, setDataStats] = useState({});
  const [selectedVariables, setSelectedVariables] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', text: 'Chào mừng bạn đến với hệ thống phân tích. Dữ liệu đã sẵn sàng, tôi có thể giúp gì cho bạn?' }]);
  const [chatInput, setChatInput] = useState('');

  const [schemaExplanation, setSchemaExplanation] = useState('');
  const [anomaliesInsight, setAnomaliesInsight] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [customLogo, setCustomLogo] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setCustomLogo(event.target.result);
      reader.readAsDataURL(file);
    }
  };
  
  const [advancedTest, setAdvancedTest] = useState('');
  const [testVar1, setTestVar1] = useState('');
  const [testVar2, setTestVar2] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [multiTestVars, setMultiTestVars] = useState([]); 

  const [dashboardWidgets, setDashboardWidgets] = useState([]);
  const [newWidgetConfig, setNewWidgetConfig] = useState({ 
      type: 'bar', xAxes: [], yAxes: [], aggMethod: 'count', title: '', dualAxis: false, timeGroup: 'none', showDataLabels: false 
  });
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [aiChartInput, setAiChartInput] = useState('');
  const [isAiGeneratingChart, setIsAiGeneratingChart] = useState(false);

  const [mapConfig, setMapConfig] = useState({ 
    locationCol: '', analyzeVar: '', aggMethod: 'count', mapContext: '', mapStyle: 'polygon',
    colorMode: 'auto', 
    filterCol: '', filterVal: '', 
    customRanges: [
      {min: 0, max: 100, color: '#fef0d9'}, 
      {min: 101, max: 200, color: '#fc8d59'}, 
      {min: 201, max: 999999, color: '#b30000'}
    ]
  });
  const [mapPoints, setMapPoints] = useState([]);
  const [mapGeoJsonFeatures, setMapGeoJsonFeatures] = useState([]); 
  const [isMapAnalyzing, setIsMapAnalyzing] = useState(false);
  const [mapProgressText, setMapProgressText] = useState(''); 
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapAiInsight, setMapAiInsight] = useState('');
  const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(true);
  const [isAiInsightExpanded, setIsAiInsightExpanded] = useState(true);
  
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerLayerRef = useRef(null);

  const [isUiLoaded, setIsUiLoaded] = useState(false);

  useEffect(() => {
    if (!document.getElementById('jstat-cdn')) {
      const script = document.createElement('script');
      script.id = 'jstat-cdn';
      script.src = "https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js";
      script.async = true;
      document.body.appendChild(script);
    }

    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = "https://cdn.tailwindcss.com";
      script.onload = () => setIsUiLoaded(true); 
      script.onerror = () => {
        alert("Cảnh báo: Tường lửa mạng của bạn đang chặn tải giao diện (Tailwind CDN). Phần mềm sẽ hiển thị dạng thô.");
        setIsUiLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setIsUiLoaded(true);
    }

    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.async = true; document.body.appendChild(script);
    }
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.async = true; document.body.appendChild(script);
    }
    if (!window.domtoimage) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js";
      script.async = true; document.body.appendChild(script);
    }
    if (!window.L && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true; script.onload = () => setIsMapLoaded(true);
      document.body.appendChild(script);
    } else if (window.L) { setIsMapLoaded(true); }
  }, []);

  useEffect(() => {
    if (dataset.headers.length > 0) {
      const numCols = dataset.headers.filter(h => dataStats[h]?.type === 'numeric');
      const catCols = dataset.headers.filter(h => dataStats[h]?.type === 'categorical');
      const locCol = catCols.find(h => /xã|phường|tỉnh|thành|khu vực|quận|huyện|địa/i.test(h)) || catCols[0] || '';
      
      const countOrSumCol = numCols.find(h => /số|ca|nhiễm|lượng|tong|sum|count/i.test(h));
      
      setMapConfig(prev => ({ 
         ...prev, 
         locationCol: locCol, 
         analyzeVar: countOrSumCol || '',
         aggMethod: countOrSumCol ? 'sum' : 'count' 
      }));
    }
  }, [dataset, dataStats]);

  useEffect(() => {
    let resizeObserver;
    if (activeTab === 'map' && isMapLoaded && mapRef.current) {
      const mapInstance = window.L.map(mapRef.current).setView([16.0678, 108.2208], 11); 
      leafletMapRef.current = mapInstance;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        detectRetina: true 
      }).addTo(mapInstance);

      resizeObserver = new ResizeObserver(() => {
        if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
      });
      resizeObserver.observe(mapRef.current);
      setTimeout(() => { if (leafletMapRef.current) leafletMapRef.current.invalidateSize(); }, 200);

      return () => {
        if (resizeObserver) resizeObserver.disconnect();
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
          markerLayerRef.current = null;
        }
      };
    }
  }, [activeTab, isMapLoaded]);

  const getColorForValue = (val, min, max) => {
    if (mapConfig.colorMode === 'custom') {
      const range = mapConfig.customRanges.find(r => val >= r.min && val <= r.max);
      return range ? range.color : '#cbd5e1'; 
    }
    
    const palettes = {
      '3': ['#ffeda0', '#fc4e2a', '#800026'],
      '5': ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'],
      '7': ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026']
    };

    if (['3', '5', '7'].includes(mapConfig.colorMode)) {
      const numClasses = parseInt(mapConfig.colorMode);
      const colors = palettes[mapConfig.colorMode];
      if (max === min) return colors[colors.length - 1];
      const step = (max - min) / numClasses;
      let idx = Math.floor((val - min) / step);
      if (idx >= numClasses) idx = numClasses - 1;
      return colors[idx];
    }
    return `rgba(225, 29, 72, ${((val - min) / (max - min)) * 0.8 + 0.2})`; 
  };

  useEffect(() => {
    if (activeTab === 'map' && leafletMapRef.current && (mapPoints.length > 0 || mapGeoJsonFeatures.length > 0)) {
      if (markerLayerRef.current) leafletMapRef.current.removeLayer(markerLayerRef.current);
      markerLayerRef.current = window.L.featureGroup().addTo(leafletMapRef.current);

      const values = mapPoints.map(p => p.value);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);

      if (mapConfig.mapStyle === 'polygon' && mapGeoJsonFeatures.length > 0) {
        const geoJsonData = { type: "FeatureCollection", features: mapGeoJsonFeatures };
        const geoJsonLayer = window.L.geoJSON(geoJsonData, {
          style: (feature) => {
            const locKey = feature.properties.targetName;
            const matchedPoint = mapPoints.find(p => p.id === locKey);
            let fillColor = '#f8fafc'; let fillOpacity = 0.15; let weight = 1; let color = '#94a3b8'; 
            if (matchedPoint) {
              fillColor = getColorForValue(matchedPoint.value, minVal, maxVal);
              fillOpacity = 0.85; weight = 2; color = '#ffffff'; 
            }
            return { fillColor, weight, opacity: 1, color, fillOpacity };
          },
          onEachFeature: (feature, layer) => {
            const locKey = feature.properties.targetName;
            const matchedPoint = mapPoints.find(p => p.id === locKey);
            if (matchedPoint) {
              const methodText = mapConfig.aggMethod === 'count' ? 'Tổng số ca (dòng)' : (mapConfig.aggMethod === 'sum' ? 'Tổng' : 'Trung bình');
              const varText = mapConfig.aggMethod === 'count' ? '' : ` ${mapConfig.analyzeVar}`;
              let popupHtml = `<div style="font-family: 'Inter', sans-serif; min-width: 180px; padding: 4px;">
                 <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:14px; font-weight:600; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">📍 ${matchedPoint.name}</h4>
                 <div style="font-size: 13px; color: #475569; line-height: 1.5;">
                    <span style="display:block; margin-bottom: 4px">${methodText}${varText}:</span>
                    <span style="font-size:18px; font-weight:700; color:#e11d48;">${matchedPoint.value.toLocaleString('vi-VN')}</span>
                 </div></div>`;
              layer.bindPopup(popupHtml, { className: 'custom-popup' });
              
              layer.bindTooltip(`<div class="map-label-content">${matchedPoint.name}</div>`, {
                 permanent: true, direction: 'center', className: 'custom-map-label-bg-transparent'
              });

              layer.on({
                mouseover: (e) => { const l = e.target; l.setStyle({ weight: 3, color: '#1e293b', fillOpacity: 0.9 }); l.bringToFront(); },
                mouseout: (e) => { geoJsonLayer.resetStyle(e.target); }
              });
            }
          }
        });
        geoJsonLayer.addTo(markerLayerRef.current);
        leafletMapRef.current.fitBounds(geoJsonLayer.getBounds(), { padding: [30, 30] });
      } 
      else {
        const markers = [];
        mapPoints.forEach(point => {
          let radius = 8; let fillColor = "#e11d48"; let fillOpacity = 0.7; let color = "#be123c";
          if (maxVal > minVal) {
            if (mapConfig.mapStyle === 'bubble') radius = 12 + ((point.value - minVal) / (maxVal - minVal)) * 30; 
            else if (mapConfig.mapStyle === 'heat') { radius = 18; fillColor = getColorForValue(point.value, minVal, maxVal); fillOpacity = 0.9; color = "#ffffff"; }
          } else if (mapConfig.mapStyle === 'heat') { radius = 18; fillColor = "#e31a1c"; fillOpacity = 0.9; color = "#ffffff"; }

          const methodText = mapConfig.aggMethod === 'count' ? 'Tổng số ca (dòng)' : (mapConfig.aggMethod === 'sum' ? 'Tổng' : 'Trung bình');
          const varText = mapConfig.aggMethod === 'count' ? '' : ` ${mapConfig.analyzeVar}`;
          let popupHtml = `<div style="font-family: 'Inter', sans-serif; min-width: 180px; padding: 4px;">
             <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:14px; font-weight:600; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">📍 ${point.name}</h4>
             <div style="font-size: 13px; color: #475569; line-height: 1.5;">
                 <span style="display:block; margin-bottom: 4px">${methodText}${varText}:</span>
                <span style="font-size:18px; font-weight:700; color:#e11d48;">${point.value.toLocaleString('vi-VN')}</span>
             </div></div>`;

          const marker = window.L.circleMarker([point.lat, point.lng], { radius, fillColor, color, weight: 1.5, opacity: 1, fillOpacity }).bindPopup(popupHtml);
          
          marker.bindTooltip(`<div class="map-label-content">${point.name}</div>`, {
             permanent: true, direction: 'right', offset: [radius, 0], className: 'custom-map-label-bg-transparent'
          });

          marker.addTo(markerLayerRef.current);
          markers.push([point.lat, point.lng]);
        });
        if (markers.length > 0) leafletMapRef.current.fitBounds(markers, { padding: [40, 40] });
      }
      setTimeout(() => { if(leafletMapRef.current) leafletMapRef.current.invalidateSize(); }, 300);
    }
  }, [mapPoints, mapGeoJsonFeatures, activeTab, mapConfig.mapStyle, mapConfig.aggMethod, mapConfig.analyzeVar, mapConfig.colorMode, mapConfig.customRanges]);

  const handleResetMapZoom = () => {
    if (leafletMapRef.current && markerLayerRef.current) {
      const bounds = markerLayerRef.current.getBounds();
      if (Object.keys(bounds).length > 0) {
        leafletMapRef.current.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  };

  const handleExportMap = async () => {
    if (!mapRef.current || !window.domtoimage) return alert('Hệ thống đang tải thư viện xuất ảnh. Vui lòng thử lại sau vài giây.');
    setIsLoading(true);
    try {
      const dataUrl = await window.domtoimage.toPng(mapRef.current, {
        quality: 1, bgcolor: '#ffffff',
        style: { transform: 'none' } 
      });
      const link = document.createElement('a');
      link.download = `Ban_Do_Dich_Te_${new Date().toISOString().slice(0,10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi khi xuất ảnh bản đồ. Hãy thử lại.');
    }
    setIsLoading(false);
  };

  const delay = ms => new Promise(res => setTimeout(res, ms));

  const handleAnalyzeMapWithAI = async () => {
    if (!mapConfig.locationCol) return alert("Vui lòng chọn Cột Tên Địa Phương");
    setIsMapAnalyzing(true); setMapAiInsight(''); setMapGeoJsonFeatures([]); setMapProgressText('Đang phân tích dữ liệu...');

    const aggregatedData = {};
    
    dataset.rows.forEach(row => {
      if (mapConfig.filterCol && mapConfig.filterVal) {
         const rowVal = String(row[mapConfig.filterCol] || '').trim();
         if (rowVal !== mapConfig.filterVal) return; 
      }

      const locRaw = row[mapConfig.locationCol];
      if (!locRaw) return;
      const originalLocStr = String(locRaw).trim();
      const locKey = generateLocationKey(originalLocStr);
      if (!locKey) return;

      if (!aggregatedData[locKey]) {
         aggregatedData[locKey] = { originalName: originalLocStr, values: [], count: 0 };
      } else {
         const currentName = aggregatedData[locKey].originalName;
         const newName = originalLocStr;
         
         const scoreName = (name) => {
            let score = 0;
            if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(name)) score += 5; 
            if (/^(phường|xã|thị trấn|thị xã|quận|huyện|thành phố|tỉnh)\s/i.test(name)) score += 10; 
            else if (/^(p\.|x\.|tt\.|tx\.|q\.|h\.|tp\.)/i.test(name)) score += 3; 
            if (/^[A-ZĐ]/.test(name)) score += 2;
            return score;
         };

         if (scoreName(newName) > scoreName(currentName)) {
             aggregatedData[locKey].originalName = newName;
         }
      }
      aggregatedData[locKey].count += 1; 
      
      if (mapConfig.analyzeVar && mapConfig.aggMethod !== 'count') {
        let rawVal = row[mapConfig.analyzeVar];
        if (typeof rawVal === 'string') rawVal = rawVal.replace(/,/g, '');
        const val = Number(rawVal);
        if (!isNaN(val)) aggregatedData[locKey].values.push(val);
      }
    });

    const uniqueLocations = Object.keys(aggregatedData);
    const knownCoords = {}; const newMapPoints = []; let contextForInsight = [];

    if (mapConfig.mapStyle === 'polygon') {
      const fetchedFeatures = [];
      for (let i = 0; i < uniqueLocations.length; i++) {
        const locKey = uniqueLocations[i];
        const originalName = aggregatedData[locKey].originalName;
        setMapProgressText(`Đang tải ranh giới địa lý (${i + 1}/${uniqueLocations.length}): ${originalName}...`);
        try {
          let autoContext = (mapConfig.filterCol && mapConfig.filterVal) ? `${mapConfig.filterVal}, ` : '';
          const queryContext = mapConfig.mapContext ? `, ${mapConfig.mapContext}, Vietnam` : `, ${autoContext}Vietnam`;
          
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(originalName + queryContext)}&format=geojson&polygon_geojson=1&limit=1`);
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const feature = data.features[0];
            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              feature.properties.targetName = locKey; 
              fetchedFeatures.push(feature);
            }
          }
        } catch (error) { console.error(`Lỗi lấy ranh giới ${originalName}`, error); }
        await delay(1200); 
      }
      setMapGeoJsonFeatures(fetchedFeatures);

      uniqueLocations.forEach(locKey => {
        const group = aggregatedData[locKey];
        let statValue = 0;
        
        if (mapConfig.aggMethod === 'count') {
           statValue = group.count;
        } else {
           if (group.values.length > 0) {
              const sum = group.values.reduce((a, b) => a + b, 0);
              statValue = mapConfig.aggMethod === 'mean' ? sum / group.values.length : sum;
           } else {
              statValue = 0; 
           }
        }
        
        newMapPoints.push({ id: locKey, name: group.originalName, lat: 0, lng: 0, value: statValue });
        contextForInsight.push(`${group.originalName}: ${statValue}`);
      });
      setMapPoints(newMapPoints);

    } else {
      setMapProgressText('Đang dò tọa độ điểm bằng AI...');
      const unknownLocs = [];
      uniqueLocations.forEach(locKey => {
        const originalName = aggregatedData[locKey].originalName;
        const norm = normalizeString(originalName);
        let coords = KNOWN_LOCATIONS[norm] || KNOWN_LOCATIONS[Object.keys(KNOWN_LOCATIONS).find(k => norm.includes(k) || k.includes(norm))];
        if (coords) knownCoords[locKey] = coords; else unknownLocs.push({ key: locKey, name: originalName });
      });

      if (unknownLocs.length > 0) {
        const batchNames = unknownLocs.slice(0, 50).map(u => u.name);
        const prompt = `Geocoder API. Tọa độ (Vĩ độ - lat, Kinh độ - lng) chính xác cấp Xã/Phường/Quận/Huyện. Ngữ cảnh: ${mapConfig.mapContext || 'Việt Nam'}. QUAN TRỌNG: Tọa độ PHẢI trên đất liền. Trả về mảng JSON: [{"loc": "Tên", "lat": 16.1, "lng": 108.4}]. Danh sách: ${batchNames.join(' | ')}`;
        const aiRes = await callGeminiAPI(prompt, "Chỉ trả về JSON thuần túy.");
        if (aiRes) {
          try {
            const jsonMatch = aiRes.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              JSON.parse(jsonMatch[0]).forEach(item => {
                if (item.loc && item.lat && item.lng) {
                  const matchedUserLoc = unknownLocs.find(u => u.name.toLowerCase() === item.loc.toLowerCase()) || unknownLocs.find(u => item.loc.toLowerCase().includes(u.name.toLowerCase()));
                  if(matchedUserLoc) knownCoords[matchedUserLoc.key] = { lat: parseFloat(item.lat), lng: parseFloat(item.lng) };
                }
              });
            }
          } catch (e) { console.error("Lỗi parse AI Geocoder"); }
        }
      }

      uniqueLocations.forEach(locKey => {
        const group = aggregatedData[locKey];
        let statValue = 0;
        
        if (mapConfig.aggMethod === 'count') {
           statValue = group.count;
        } else {
           if (group.values.length > 0) {
              const sum = group.values.reduce((a, b) => a + b, 0);
              statValue = mapConfig.aggMethod === 'mean' ? sum / group.values.length : sum;
           } else {
              statValue = 0;
           }
        }
        
        const coords = knownCoords[locKey];
        if (coords) {
          newMapPoints.push({ id: locKey, name: group.originalName, lat: coords.lat, lng: coords.lng, value: statValue });
          contextForInsight.push(`${group.originalName}: ${statValue}`);
        }
      });
      setMapPoints(newMapPoints);
    }

    setMapProgressText('Đang tạo báo cáo Insight...');
    if (newMapPoints.length > 0) {
      const insight = await callGeminiAPI(`Thống kê địa lý (${mapConfig.aggMethod} của ${mapConfig.analyzeVar}):\n${contextForInsight.join(', ')}.\nViết 2 dòng nhận xét ngắn gọn về điểm nóng và xu hướng.`);
      setMapAiInsight(insight);
    } else setMapAiInsight("Hệ thống không thể định vị địa danh. Vui lòng thêm 'Ngữ cảnh địa lý'.");
    setIsMapAnalyzing(false); setMapProgressText('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsLoading(true); const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => { parseCSV(event.target.result); setIsLoading(false); };
      reader.readAsText(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      if (!window.XLSX) { alert("Đang tải thư viện Excel. Vui lòng thử lại."); setIsLoading(false); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });
          parseExcelJSON(window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }));
        } catch (error) { alert("Lỗi đọc file Excel."); }
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else { alert("Chỉ hỗ trợ CSV hoặc Excel."); setIsLoading(false); }
  };

  const sanitizeValue = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    let strVal = String(val).trim();
    let numVal = Number(strVal.replace(/,/g, ''));
    if (!isNaN(numVal) && strVal !== '') return numVal;
    return strVal;
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim()); if (lines.length < 2) return;
    const splitCSV = (str) => {
      const result = []; let cur = ''; let inQuote = false;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '"') inQuote = !inQuote;
        else if (str[i] === ',' && !inQuote) { result.push(cur); cur = ''; }
        else cur += str[i];
      }
      result.push(cur); return result;
    };
    const headers = splitCSV(lines[0]).map(h => String(h).trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = splitCSV(line); let obj = {};
      headers.forEach((h, i) => obj[h] = sanitizeValue(values[i]?.replace(/^"|"$/g, ''))); return obj;
    });
    finalizeDataLoad(headers, rows);
  };

  const parseExcelJSON = (data) => {
    if (data.length < 2) return;
    const headers = data[0].map(h => String(h).trim()); const rows = [];
    for (let i = 1; i < data.length; i++) {
      const rowArr = data[i]; if (!rowArr || rowArr.length === 0) continue;
      let obj = {}; let hasData = false;
      headers.forEach((h, idx) => { let val = sanitizeValue(rowArr[idx]); obj[h] = val; if (val !== '') hasData = true; });
      if (hasData) rows.push(obj);
    }
    finalizeDataLoad(headers, rows);
  };

  const finalizeDataLoad = (headers, rows) => {
    setDataset({ headers, rows }); setSelectedVariables(headers); generateBasicStats(headers, rows);
    setSchemaExplanation(''); 
    setAnomaliesInsight(''); 
    setAiReport('');
    setMapPoints([]); 
    setMapGeoJsonFeatures([]); 
    setMapAiInsight('');
    setAdvancedTest('');
    setTestVar1('');
    setTestVar2('');
    setTestResult(null);
    setMultiTestVars([]);
    setDashboardWidgets([]); 
    setChatHistory([{ role: 'ai', text: 'Dữ liệu mới đã được cập nhật thành công. Bạn muốn phân tích điều gì?' }]);
    setCurrentPage(1); setActiveTab('data');
  };

  const loadSampleData = () => {
    const sampleCSV = `TenXa 02 CẤP,NgayXn HIV,KetQua
Hải Vân,2023-01-10,DuongTinh
Hòa Bắc,2023-01-12,DuongTinh
Hòa Bắc,2023-01-14,DuongTinh
Hòa Liên,2023-01-15,DuongTinh
Hòa Liên,2023-01-16,DuongTinh
Lăng Cô,2023-02-01,DuongTinh
Lăng Cô,2023-02-02,DuongTinh
Lăng Cô,2023-02-03,DuongTinh
Lăng Cô,2023-02-04,DuongTinh
Hòa Hiệp Bắc,2023-02-05,DuongTinh
Hòa Hiệp Bắc,2023-02-06,DuongTinh
Hòa Hiệp Nam,2023-02-07,DuongTinh
An Khê,2023-02-08,DuongTinh
An Hải Tây,2023-02-09,DuongTinh`;
    parseCSV(sampleCSV);
  };

  const generateBasicStats = (headers, rows) => {
    let stats = {};
    headers.forEach(header => {
      const colData = rows.map(r => r[header]).filter(v => typeof v === 'number');
      if (colData.length > 0) {
        const n = colData.length; const mean = calculateMean(colData); const stdDev = calculateStdDev(colData, mean);
        stats[header] = { type: 'numeric', count: n, mean: mean.toFixed(2), median: calculateMedian(colData).toFixed(2), min: Math.min(...colData), max: Math.max(...colData), variance: calculateVariance(colData, mean).toFixed(2), stdDev: stdDev.toFixed(2), ci95: `[${calculateCI95(mean, stdDev, n)[0].toFixed(2)}, ${calculateCI95(mean, stdDev, n)[1].toFixed(2)}]` };
      } else {
        const validStrs = rows.map(r => r[header]).filter(v => v !== undefined && v !== '');
        const counts = {}; validStrs.forEach(v => counts[v] = (counts[v] || 0) + 1);
        stats[header] = { type: 'categorical', count: validStrs.length, unique: Object.keys(counts).length, frequencies: Object.entries(counts).map(([k, v]) => ({ label: k, count: v, percent: ((v / validStrs.length) * 100).toFixed(1) })).sort((a, b) => b.count - a.count) };
      }
    });
    setDataStats(stats);
  };

  const toggleVariable = (header) => setSelectedVariables(prev => prev.includes(header) ? prev.filter(v => v !== header) : [...prev, header]);

  const generateSchemaExplanation = async () => {
    setIsLoading(true);
    const response = await callGeminiAPI(`Dữ liệu gồm: ${dataset.headers.join(', ')}\nData mẫu: ${JSON.stringify(dataset.rows.slice(0, 3))}\n1. Suy đoán chủ đề.\n2. Giải thích ý nghĩa.\n3. Gợi ý câu hỏi giám sát dịch tễ.\nTrình bày Markdown.`);
    setSchemaExplanation(response); setIsLoading(false);
  };

  const generateAnomaliesInsight = async () => {
    setIsLoading(true);
    const filteredStats = {}; selectedVariables.forEach(v => { if (dataStats[v]) filteredStats[v] = dataStats[v]; });
    const response = await callGeminiAPI(`Chỉ số thống kê: ${JSON.stringify(filteredStats)}\nHãy tìm điểm bất thường và gợi ý hành động y tế bằng Markdown.`);
    setAnomaliesInsight(response); setIsLoading(false);
  };

  const generateFullAiReport = async () => {
    if (dataset.rows.length === 0) return;
    setIsGeneratingReport(true);
    const statsSummary = JSON.stringify(dataStats);
    const prompt = `Bạn là một Chuyên gia Dịch tễ học và Phân tích dữ liệu Y tế cấp cao. 
    Dưới đây là tóm tắt thống kê toàn diện của bộ dữ liệu giám sát:
    - Tổng số bản ghi: ${dataset.rows.length}
    - Các cột dữ liệu: ${dataset.headers.join(', ')}
    - Thống kê chi tiết: ${statsSummary}

    HÃY THỰC HIỆN PHÂN TÍCH SÂU VÀ VIẾT BÁO CÁO TỔNG THỂ BAO GỒM:
    1. Tóm lược bối cảnh và quy mô của bộ dữ liệu.
    2. Phân tích các xu hướng nổi bật (đặc biệt là các biến số định lượng quan trọng).
    3. Đánh giá cơ cấu và phân bố (dựa trên các biến phân loại).
    4. Nhận diện các điểm nóng (Hotspots), rủi ro hoặc điểm bất thường cần lưu ý ngay lập tức.
    5. Đề xuất các chiến lược giám sát hoặc can thiệp y tế cụ thể cho đơn vị CDC.

    Yêu cầu trình bày chuyên nghiệp bằng tiếng Việt, định dạng Markdown rõ ràng, có tiêu đề và các phần phân tách khoa học.`;

    const report = await callGeminiAPI(prompt);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  const handleResetAllData = () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu, biểu đồ, bản đồ và kết quả phân tích hiện tại để bắt đầu lại từ đầu?")) return;
    setDataset({ headers: [], rows: [] });
    setDataStats({});
    setSelectedVariables([]);
    setSchemaExplanation('');
    setAnomaliesInsight('');
    setAiReport('');
    setAdvancedTest('');
    setTestVar1('');
    setTestVar2('');
    setTestResult(null);
    setMultiTestVars([]);
    setDashboardWidgets([]);
    setMapConfig({ 
      locationCol: '', analyzeVar: '', aggMethod: 'count', mapContext: '', mapStyle: 'polygon',
      colorMode: 'auto', filterCol: '', filterVal: '',
      customRanges: [
        {min: 0, max: 100, color: '#fef0d9'}, 
        {min: 101, max: 200, color: '#fc8d59'}, 
        {min: 201, max: 999999, color: '#b30000'}
      ]
    });
    setMapPoints([]);
    setMapGeoJsonFeatures([]);
    setMapAiInsight('');
    setChatHistory([{ role: 'ai', text: 'Chào mừng bạn đến với hệ thống phân tích. Dữ liệu đã sẵn sàng, tôi có thể giúp gì cho bạn?' }]);
    setActiveTab('upload');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault(); if (!chatInput.trim() || dataset.rows.length === 0) return;
    const userMsg = chatInput; setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]); setChatInput(''); setIsLoading(true);
    const filteredStats = {}; selectedVariables.forEach(v => { if (dataStats[v]) filteredStats[v] = dataStats[v]; });
    const response = await callGeminiAPI(`Data: ${dataset.rows.length} dòng. Thống kê: ${JSON.stringify(filteredStats)}\nCâu hỏi: ${userMsg}\nTrả lời tiếng Việt chuyên nghiệp.`);
    setChatHistory(prev => [...prev, { role: 'ai', text: response }]); setIsLoading(false);
  };

  const renderMiniMarkdown = (text) => text?.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-slate-800 mt-4 mb-2 text-lg">{line.replace('### ', '')}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-slate-900 mt-5 mb-3 text-xl">{line.replace('## ', '')}</h3>;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return <p key={i} className="text-slate-600 text-[15px] my-1.5 leading-relaxed">{parts.map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="text-slate-800">{part.replace(/\*\*/g, '')}</strong> : part)}</p>;
  });

  const renderDashboardView = () => {
    const handleAddWidget = () => {
      if (!newWidgetConfig.xAxes || newWidgetConfig.xAxes.length === 0) return alert("Vui lòng chọn ít nhất 1 biến cho Trục X");
      if (newWidgetConfig.aggMethod !== 'count' && newWidgetConfig.yAxes.length === 0) return alert("Vui lòng chọn ít nhất 1 biến cho Trục Y");
      setDashboardWidgets([...dashboardWidgets, { ...newWidgetConfig, title: newWidgetConfig.title || 'Biểu đồ mới', id: Date.now() }]);
      setIsAddingWidget(false);
    };

    const handleAIGenerateChart = async () => {
      if (!aiChartInput.trim()) return alert("Vui lòng nhập yêu cầu biểu đồ!");
      setIsAiGeneratingChart(true);
      const numericCols = dataset.headers.filter(h => dataStats[h]?.type === 'numeric').join(', ');
      const catCols = dataset.headers.filter(h => dataStats[h]?.type === 'categorical').join(', ');
      const prompt = `Chuyên gia BI. Cột X: ${catCols}. Cột Y: ${numericCols}. Yêu cầu: "${aiChartInput}".
Trả về JSON: {"type": "bar/line/area/pie/doughnut/funnel/table", "xAxes": ["ColX"], "yAxes": ["ColY1"], "aggMethod": "count/sum/mean", "dualAxis": false, "title": "Tiêu đề"}`;
      const res = await callGeminiAPI(prompt, "Chỉ trả về JSON thuần túy.");
      if (res) {
        try {
           const aiConfig = JSON.parse(res.replace(/```json/gi, '').replace(/```/gi, '').trim());
           if ((aiConfig.xAxes || aiConfig.xAxis) && aiConfig.type) {
              setDashboardWidgets(prev => [...prev, { ...aiConfig, id: Date.now() }]); setAiChartInput('');
           } else alert("AI không tìm thấy cấu trúc phù hợp.");
        } catch (e) { alert("Lỗi phân tích cú pháp AI. Thử câu khác."); }
      }
      setIsAiGeneratingChart(false);
    };

    const toggleXAxis = (col) => setNewWidgetConfig(prev => {
        const current = prev.xAxes || [];
        if (current.includes(col)) return { ...prev, xAxes: current.filter(c => c !== col) };
        if (current.length >= 3) { alert("Tối đa 3 biến X."); return prev; }
        return { ...prev, xAxes: [...current, col] };
    });

    const toggleYAxis = (col) => setNewWidgetConfig(prev => {
        const current = prev.yAxes || [];
        if (current.includes(col)) return { ...prev, yAxes: current.filter(c => c !== col) };
        if (current.length >= 4) { alert("Tối đa 4 biến Y."); return prev; }
        return { ...prev, yAxes: [...current, col] };
    });

    return (
      <div className="p-8 h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-[26px] font-extrabold text-slate-800 flex items-center gap-2.5">
              <LayoutDashboard className="text-sky-600" size={28} /> Dashboard Giám Sát
            </h2>
            <p className="text-slate-500 text-[15px] mt-1.5">Tùy biến biểu đồ đa chiều hỗ trợ công tác phân tích dịch tễ.</p>
          </div>
          <button onClick={() => setIsAddingWidget(!isAddingWidget)} className="px-5 py-2.5 bg-sky-600 text-white font-medium rounded-xl flex items-center gap-2 hover:bg-sky-700 shadow-sm transition-colors">
            <Plus size={20} /> {isAddingWidget ? 'Đóng Menu' : 'Thêm Biểu Đồ'}
          </button>
        </div>

        <div className="mb-6 bg-white p-5 rounded-2xl border border-sky-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center shrink-0">
             <Sparkles className="text-sky-500" size={24} />
          </div>
          <input 
            type="text" value={aiChartInput} onChange={(e) => setAiChartInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAIGenerateChart()}
            placeholder="AI Prompt: Ví dụ 'Vẽ biểu đồ hình phễu cơ cấu số ca nhiễm theo khu vực'" 
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all text-[15px]" disabled={isAiGeneratingChart}
          />
          <button onClick={handleAIGenerateChart} disabled={isAiGeneratingChart || !aiChartInput} className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {isAiGeneratingChart ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Tạo bằng AI'}
          </button>
        </div>

        {isAddingWidget && (
          <div className="mb-8 bg-white p-6 rounded-2xl border border-sky-100 shadow-md flex flex-wrap gap-5 items-start animate-in fade-in slide-in-from-top-4">
            <div className="flex-1 min-w-[220px] space-y-4">
              <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase mb-2">Loại biểu đồ</label>
                  <select value={newWidgetConfig.type} onChange={e => setNewWidgetConfig({...newWidgetConfig, type: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-slate-50 font-medium">
                    <optgroup label="Biểu đồ cơ bản">
                        <option value="bar">Biểu đồ Cột (Bar)</option>
                        <option value="line">Biểu đồ Đường (Line)</option>
                        <option value="area">Biểu đồ Hình Dây (Area)</option>
                        <option value="pie">Biểu đồ Tròn (Pie)</option>
                        <option value="doughnut">Biểu đồ Khuyên (Doughnut)</option>
                        <option value="funnel">Biểu đồ Phễu (Funnel)</option>
                        <option value="table">Bảng Đa Biến (Table)</option>
                    </optgroup>
                    <optgroup label="Biểu đồ chuyên môn">
                        <option value="stackedBar">Cột chồng (Stacked Bar)</option>
                        <option value="stackedBar100">Cột chồng 100% (100% Stacked)</option>
                        <option value="pareto">Biểu đồ Pareto (80/20)</option>
                    </optgroup>
                  </select>
              </div>
              <div className="flex gap-3">
                 <div className="w-[40%]">
                    <label className="block text-[13px] font-bold text-slate-500 uppercase mb-2">Hàm tính</label>
                    <select value={newWidgetConfig.aggMethod} onChange={e => setNewWidgetConfig({...newWidgetConfig, aggMethod: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-slate-50 font-medium">
                      <option value="count">Đếm</option><option value="sum">Tổng</option><option value="mean">T.Bình</option>
                    </select>
                 </div>
                 <div className="flex-1">
                    <label className="block text-[13px] font-bold text-slate-500 uppercase mb-2">Tiêu đề</label>
                    <input type="text" value={newWidgetConfig.title} onChange={e => setNewWidgetConfig({...newWidgetConfig, title: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-slate-50 font-medium" placeholder="VD: Báo cáo..." />
                 </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                 <label className="block text-[13px] font-bold text-slate-500 uppercase mb-2">Chuỗi thời gian (Cho Trục X)</label>
                 <select value={newWidgetConfig.timeGroup || 'none'} onChange={e => setNewWidgetConfig({...newWidgetConfig, timeGroup: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-sky-500 bg-sky-50/50 font-medium text-sky-800">
                   <option value="none">Không gom nhóm (Mặc định)</option>
                   <option value="day">Gom nhóm theo Ngày (DD/MM/YYYY)</option>
                   <option value="week">Gom nhóm theo Tuần (Tuần dịch tễ)</option>
                   <option value="month">Gom nhóm theo Tháng</option>
                   <option value="quarter">Gom nhóm theo Quý</option>
                   <option value="year">Gom nhóm theo Năm</option>
                 </select>
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[13px] font-bold text-teal-600 uppercase mb-2">Trục Y (Nhiều Chỉ Số)</label>
              <div className={`border border-teal-100 rounded-xl p-2.5 bg-teal-50/30 h-[126px] overflow-y-auto grid grid-cols-1 gap-1.5 custom-scrollbar ${newWidgetConfig.aggMethod === 'count' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                 {newWidgetConfig.aggMethod === 'count' ? (
                     <div className="text-xs text-slate-500 italic p-2 text-center mt-6">Phép đếm không cần Trục Y</div>
                 ) : (
                     dataset.headers.filter(h => dataStats[h]?.type === 'numeric').map(h => (
                        <label key={h} className="flex items-center gap-3 text-sm p-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-teal-100">
                            <input type="checkbox" className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300" checked={newWidgetConfig.yAxes?.includes(h)} onChange={() => toggleYAxis(h)} />
                            <span className="truncate font-medium text-slate-700">{h}</span>
                        </label>
                    ))
                 )}
              </div>
            </div>
            <div className="flex flex-col justify-end min-w-[150px] gap-3 mt-7">
              <label className="flex items-center gap-2.5 text-[13px] font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                <input type="checkbox" className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500" checked={newWidgetConfig.showDataLabels || false} onChange={e => setNewWidgetConfig({...newWidgetConfig, showDataLabels: e.target.checked})} />
                Hiển thị số liệu trực tiếp
              </label>

              {newWidgetConfig.yAxes?.length === 2 && newWidgetConfig.aggMethod !== 'count' && (
                <label className="flex items-center gap-2.5 text-[13px] font-bold text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500" checked={newWidgetConfig.dualAxis} onChange={e => setNewWidgetConfig({...newWidgetConfig, dualAxis: e.target.checked})} />
                  2 Trục Tung
                </label>
              )}
              <button onClick={handleAddWidget} className="w-full h-[48px] bg-slate-800 text-white font-bold rounded-xl shadow-md hover:bg-slate-900 transition-colors mt-auto">
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        )}

        {dashboardWidgets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/40 m-4 py-24">
            <div className="bg-sky-50 p-6 rounded-full mb-5 shadow-inner">
              <Layers size={56} className="text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có biểu đồ nào</h3>
            <p className="text-[15px] text-slate-500">Hãy thử nhập "Vẽ biểu đồ cột so sánh theo khu vực" và nhấn Tạo bằng AI!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
            {dashboardWidgets.map(w => (
              <DashboardWidget key={w.id} widget={w} dataset={dataset} onRemove={(id) => setDashboardWidgets(dashboardWidgets.filter(x => x.id !== id))} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDataView = () => {
    const totalPages = Math.ceil(dataset.rows.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentRows = dataset.rows.slice(startIndex, startIndex + rowsPerPage);

    return (
      <div className="p-8 h-full flex flex-col bg-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[26px] font-extrabold text-slate-800 flex items-center gap-2.5">
            <Database className="text-sky-600" size={28}/> Bảng Dữ Liệu Gốc
          </h2>
          <div className="flex items-center gap-4">
            {!schemaExplanation && dataset.rows.length > 0 && (
              <button onClick={generateSchemaExplanation} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 font-medium shadow-sm hover:bg-indigo-700 transition-all">
                <Sparkles size={18} /> Giải thích dữ liệu
              </button>
            )}
            <div className="text-[15px] font-semibold text-sky-800 bg-sky-100/50 border border-sky-200 px-5 py-2.5 rounded-xl">
              {dataset.rows.length.toLocaleString()} Dòng • {dataset.headers.length} Cột
            </div>
          </div>
        </div>

        {schemaExplanation && (
          <div className="mb-6 bg-white border border-indigo-100 p-6 rounded-2xl shadow-sm relative shrink-0">
            <button onClick={() => setSchemaExplanation('')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full p-1">✕</button>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-indigo-600 w-6 h-6" />
              <h3 className="font-bold text-indigo-900 text-lg">AI Phân Tích Cấu Trúc</h3>
            </div>
            <div className="max-h-48 overflow-y-auto pr-4 custom-scrollbar">
              {renderMiniMarkdown(schemaExplanation)}
            </div>
          </div>
        )}

        <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-slate-500 text-sm whitespace-nowrap w-16 text-center">STT</th>
                  {dataset.headers.map((header, idx) => (
                    <th key={idx} className="p-4 font-bold text-slate-700 text-[15px] whitespace-nowrap">
                      {header}
                      <div className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                        {dataStats[header]?.type === 'numeric' ? '# Số' : 'Aa Chữ'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-sky-50/40 transition-colors">
                    <td className="p-4 text-sm text-slate-400 text-center border-r border-slate-100 bg-slate-50/20 font-mono font-medium">
                      {startIndex + rIdx + 1}
                    </td>
                    {dataset.headers.map((header, cIdx) => (
                      <td key={cIdx} className="p-4 text-[15px] text-slate-600 whitespace-nowrap">
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-sm text-slate-500 font-medium">
                Đang xem <span className="font-bold text-slate-800">{startIndex + 1} - {Math.min(startIndex + rowsPerPage, dataset.rows.length)}</span> / <span className="font-bold text-slate-800">{dataset.rows.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 transition-colors">
                  <ChevronLeft size={20} className="text-slate-600" />
                </button>
                <span className="px-4 py-2 text-[15px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">Trang {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 transition-colors">
                  <ChevronRight size={20} className="text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    const numericVars = selectedVariables.filter(h => dataStats[h]?.type === 'numeric');
    const categoricalVars = selectedVariables.filter(h => dataStats[h]?.type === 'categorical');
    
    const runStatisticalTest = () => {
      if (!window.jStat) {
        alert("Đang tải thư viện thống kê (jStat). Vui lòng thử lại sau vài giây.");
        return;
      }
      
      const parseStrictNumber = (val) => {
          if (val === undefined || val === null || String(val).trim() === '') return NaN;
          return Number(val);
      };

      if (advancedTest === 'chisquare') {
         let table = {}; let rowTotals = {}; let colTotals = {}; let total = 0;
         dataset.rows.forEach(r => {
             let v1 = r[testVar1]; let v2 = r[testVar2];
             if (v1 !== undefined && v1 !== null && v1 !== '' && v2 !== undefined && v2 !== null && v2 !== '') {
                 v1 = String(v1).trim(); v2 = String(v2).trim();
                 if (!table[v1]) table[v1] = {};
                 table[v1][v2] = (table[v1][v2] || 0) + 1;
                 rowTotals[v1] = (rowTotals[v1] || 0) + 1;
                 colTotals[v2] = (colTotals[v2] || 0) + 1;
                 total++;
             }
         });
         
         let chiSquare = 0; let lowExpCount = 0;
         let rows = Object.keys(rowTotals); let cols = Object.keys(colTotals);
         let expectedMatrix = {};

         rows.forEach(r => {
            expectedMatrix[r] = {};
            cols.forEach(c => {
               let obs = (table[r] && table[r][c]) ? table[r][c] : 0;
               let exp = (rowTotals[r] * colTotals[c]) / total;
               expectedMatrix[r][c] = exp;
               if(exp < 5) lowExpCount++;
               if(exp > 0) chiSquare += Math.pow(obs - exp, 2) / exp;
            });
         });
         
         let totalCells = rows.length * cols.length;
         let expectedWarning = (lowExpCount / totalCells) > 0.2;
         
         let df = (rows.length - 1) * (cols.length - 1);
         let pValue = df > 0 ? (1 - window.jStat.chisquare.cdf(chiSquare, df)) : 1;
         
         let or_res = null, rr_res = null;
         if (rows.length === 2 && cols.length === 2) {
            let a = table[rows[0]][cols[0]] || 0; let b = table[rows[0]][cols[1]] || 0;
            let c = table[rows[1]][cols[0]] || 0; let d = table[rows[1]][cols[1]] || 0;
            if (a===0 || b===0 || c===0 || d===0) { a+=0.5; b+=0.5; c+=0.5; d+=0.5; }
            let or_val = (a * d) / (b * c);
            let se_ln_or = Math.sqrt(1/a + 1/b + 1/c + 1/d);
            let or_ci_low = Math.exp(Math.log(or_val) - 1.96*se_ln_or);
            let or_ci_high = Math.exp(Math.log(or_val) + 1.96*se_ln_or);
            or_res = { val: or_val, low: or_ci_low, high: or_ci_high };
            let risk_exp = a / (a+b);
            let risk_unexp = c / (c+d);
            let rr_val = risk_unexp !== 0 ? risk_exp / risk_unexp : Infinity;
            let se_ln_rr = Math.sqrt(b/(a*(a+b)) + d/(c*(c+d)));
            let rr_ci_low = Math.exp(Math.log(rr_val) - 1.96*se_ln_rr);
            let rr_ci_high = Math.exp(Math.log(rr_val) + 1.96*se_ln_rr);
            rr_res = { val: rr_val, low: rr_ci_low, high: rr_ci_high };
         }
         setTestResult({ type: 'chisquare', chiSquare, df, pValue, table, rowTotals, colTotals, total, rows, cols, expectedWarning, expectedMatrix, or_res, rr_res });

      } else if (advancedTest === 'ttest_ind') {
         let groups = {};
         dataset.rows.forEach(r => {
             let num = parseStrictNumber(r[testVar1]);
             let cat = r[testVar2];
             if (!isNaN(num) && cat !== undefined && cat !== null && cat !== '') {
                cat = String(cat).trim();
                if(!groups[cat]) groups[cat] = [];
                groups[cat].push(num);
             }
         });
         let cats = Object.keys(groups);
         if (cats.length !== 2) {
             alert(`T-test độc lập yêu cầu biến phân nhóm phải có CHÍNH XÁC 2 nhóm.`);
             return;
         }
         let arr1 = groups[cats[0]]; let arr2 = groups[cats[1]];
         let n1 = arr1.length; let n2 = arr2.length;
         if(n1 < 2 || n2 < 2) return alert("Mỗi nhóm phải có ít nhất 2 quan sát.");
         let mean1 = calculateMean(arr1); let mean2 = calculateMean(arr2);
         let ss1 = arr1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0);
         let ss2 = arr2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0);
         let sp2 = (ss1 + ss2) / (n1 + n2 - 2); 
         let denom = Math.sqrt(sp2 * (1/n1 + 1/n2));
         let tStat = denom === 0 ? 0 : (mean1 - mean2) / denom;
         let df = n1 + n2 - 2;
         let pValue = 2 * (1 - window.jStat.studentt.cdf(Math.abs(tStat), df));
         setTestResult({ type: 'ttest_ind', tStat, df, pValue, mean1, mean2, n1, n2, std1: Math.sqrt(ss1/(n1-1)), std2: Math.sqrt(ss2/(n2-1)), group1: cats[0], group2: cats[1] });

      } else if (advancedTest === 'ttest_paired') {
         let diffs = [];
         dataset.rows.forEach(r => {
             let val1 = parseStrictNumber(r[testVar1]); let val2 = parseStrictNumber(r[testVar2]);
             if (!isNaN(val1) && !isNaN(val2)) diffs.push(val1 - val2);
         });
         let n = diffs.length;
         if (n < 2) return alert("Cần ít nhất 2 cặp dữ liệu hợp lệ.");
         let meanDiff = calculateMean(diffs);
         let ssDiff = diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0);
         let stdDiff = Math.sqrt(ssDiff / (n - 1)); 
         let tStat = stdDiff === 0 ? (meanDiff === 0 ? 0 : Infinity) : meanDiff / (stdDiff / Math.sqrt(n));
         let df = n - 1;
         let pValue = !isFinite(tStat) ? 0 : 2 * (1 - window.jStat.studentt.cdf(Math.abs(tStat), df));
         setTestResult({ type: 'ttest_paired', tStat, df, pValue, meanDiff, stdDiff, n });

      } else if (advancedTest === 'anova') {
         let groups = {}; let globalTotal = 0; let nTotal = 0;
         dataset.rows.forEach(r => {
             let num = parseStrictNumber(r[testVar1]);
             let cat = r[testVar2];
             if (!isNaN(num) && cat !== undefined && cat !== null && cat !== '') {
                cat = String(cat).trim();
                if(!groups[cat]) groups[cat] = [];
                groups[cat].push(num);
                globalTotal += num;
                nTotal++;
             }
         });
         let k = Object.keys(groups).length;
         if (k < 2) { alert("Cần ít nhất 2 nhóm hợp lệ."); return; }
         let globalMean = globalTotal / nTotal;
         let ssb = 0; let ssw = 0; let groupStats = [];
         Object.keys(groups).forEach(cat => {
             let arr = groups[cat]; let n = arr.length;
             let mean = arr.reduce((a,b)=>a+b,0) / n;
             ssb += n * Math.pow(mean - globalMean, 2);
             arr.forEach(val => { ssw += Math.pow(val - mean, 2); });
             groupStats.push({ name: cat, count: n, mean: mean, std: Math.sqrt(calculateVariance(arr, mean)) });
         });
         let dfb = k - 1; let dfw = nTotal - k;
         let msb = ssb / dfb; let msw = dfw > 0 ? ssw / dfw : 0;
         let fStat = msw > 0 ? msb / msw : 0;
         let pValue = (dfb > 0 && dfw > 0) ? (1 - window.jStat.centralF.cdf(fStat, dfb, dfw)) : 1;
         setTestResult({ type: 'anova', ssb, ssw, msb, msw, fStat, dfb, dfw, pValue, groupStats, globalMean, nTotal });
      } else if (advancedTest === 'correlation') {
         if (numericVars.length < 2) return alert("Cần ít nhất 2 biến định lượng.");
         let matrix = [];
         for(let i=0; i<numericVars.length; i++) {
             let row = [];
             for(let j=0; j<numericVars.length; j++) {
                 if(i===j) { row.push(1); continue; }
                 let x = [], y = [];
                 dataset.rows.forEach(r => {
                     let vx = Number(r[numericVars[i]]);
                     let vy = Number(r[numericVars[j]]);
                     if(!isNaN(vx) && !isNaN(vy)) { x.push(vx); y.push(vy); }
                 });
                 row.push(calculateCorrelation(x, y));
             }
             matrix.push({ varName: numericVars[i], correlations: row });
         }
         setTestResult({ type: 'correlation', variables: numericVars, matrix });

      } else if (advancedTest === 'regression_scatter') {
         let xVals = [], yVals = [], dataPoints = [];
         dataset.rows.forEach(r => {
             let x = Number(r[testVar2]); 
             let y = Number(r[testVar1]); 
             if (!isNaN(x) && !isNaN(y)) {
                 xVals.push(x); yVals.push(y);
                 dataPoints.push({ x, y });
             }
         });
         let n = xVals.length;
         if (n < 3) return alert("Cần ít nhất 3 cặp dữ liệu hợp lệ.");
         let meanX = calculateMean(xVals); let meanY = calculateMean(yVals);
         let ssXY = 0; let ssXX = 0; let ssYY = 0;
         for (let i = 0; i < n; i++) {
             let dx = xVals[i] - meanX; let dy = yVals[i] - meanY;
             ssXY += dx * dy; ssXX += dx * dx; ssYY += dy * dy;
         }
         let slope = ssXX !== 0 ? ssXY / ssXX : 0;
         let intercept = meanY - slope * meanX;
         let rSquared = (ssXX !== 0 && ssYY !== 0) ? Math.pow(ssXY, 2) / (ssXX * ssYY) : 0;
         let residualSumOfSquares = ssYY - slope * ssXY;
         let standardErrorOfEstimate = Math.sqrt(residualSumOfSquares / (n - 2));
         let standardErrorOfSlope = standardErrorOfEstimate / Math.sqrt(ssXX);
         let tStat = standardErrorOfSlope !== 0 ? slope / standardErrorOfSlope : 0;
         let df = n - 2;
         let pValue = df > 0 ? 2 * (1 - window.jStat.studentt.cdf(Math.abs(tStat), df)) : 1;
         let minX = Math.min(...xVals); let maxX = Math.max(...xVals);
         let trendline = [{ x: minX, y: slope * minX + intercept }, { x: maxX, y: slope * maxX + intercept }];
         setTestResult({ type: 'regression_scatter', slope, intercept, rSquared, pValue, tStat, df, n, dataPoints, trendline, xVar: testVar2, yVar: testVar1 });

      } else if (advancedTest === 'boxplot') {
         let groups = {}; let globalMin = Infinity; let globalMax = -Infinity;
         dataset.rows.forEach(r => {
             let num = Number(r[testVar1]);
             let cat = r[testVar2];
             if (!isNaN(num) && cat !== undefined && cat !== null && cat !== '') {
                cat = String(cat).trim();
                if(!groups[cat]) groups[cat] = [];
                groups[cat].push(num);
                if (num < globalMin) globalMin = num;
                if (num > globalMax) globalMax = num;
             }
         });
         let boxData = [];
         Object.keys(groups).forEach(cat => {
             let arr = groups[cat];
             let stats = calculateQuartiles(arr);
             boxData.push({ name: cat, count: arr.length, ...stats });
         });
         boxData.sort((a, b) => b.median - a.median);
         setTestResult({ type: 'boxplot', boxData, globalMin, globalMax, yVar: testVar1, xVar: testVar2 });
         
      } else if (advancedTest === 'logistic') {
         let yUnique = new Set();
         dataset.rows.forEach(r => {
             let yRaw = r[testVar1];
             if (yRaw !== undefined && yRaw !== null && yRaw !== '') yUnique.add(String(yRaw).trim());
         });
         let yClasses = Array.from(yUnique).sort(); 
         if (yClasses.length !== 2) { return alert(`Biến phụ thuộc Y phải là phân loại nhị phân.`); }
         let baselineClass = yClasses[0]; let eventClass = yClasses[1];
         let X = []; let Y = [];
         dataset.rows.forEach(r => {
             let yRaw = r[testVar1];
             if (yRaw === undefined || yRaw === null || yRaw === '') return;
             let rowX = [1]; let isValid = true;
             for(let v of multiTestVars) {
                 let num = parseStrictNumber(r[v]);
                 if (isNaN(num)) { isValid = false; break; }
                 rowX.push(num);
             }
             if (isValid) {
                 Y.push(String(yRaw).trim() === eventClass ? 1 : 0);
                 X.push(rowX);
             }
         });
         let n = Y.length; let k = multiTestVars.length;
         if (n < k + 2) return alert("Không đủ dữ liệu hợp lệ.");
         let beta = Array(k+1).fill(0).map(()=>[0]);
         let XTWX_inv; let converged = false; let ll_model = 0;
         for (let iter = 0; iter < 15; iter++) {
             let XTWX = Array(k+1).fill(0).map(()=>Array(k+1).fill(0));
             let XTWz = Array(k+1).fill(0).map(()=>[0]);
             ll_model = 0;
             for(let i=0; i<n; i++) {
                 let z = 0;
                 for(let j=0; j<=k; j++) z += X[i][j] * beta[j][0];
                 let pi = 1 / (1 + Math.exp(-z));
                 if (pi < 1e-15) pi = 1e-15; if (pi > 1 - 1e-15) pi = 1 - 1e-15;
                 ll_model += Y[i] * Math.log(pi) + (1-Y[i]) * Math.log(1-pi);
                 let wi = pi * (1 - pi);
                 if (wi < 1e-10) wi = 1e-10; 
                 let working_z = z + (Y[i] - pi) / wi;
                 for(let r=0; r<=k; r++) {
                     XTWz[r][0] += wi * X[i][r] * working_z;
                     for(let c=0; c<=k; c++) XTWX[r][c] += wi * X[i][r] * X[i][c];
                 }
             }
             try { XTWX_inv = window.jStat.inv(XTWX); } 
             catch(e) { return alert("Lỗi toán học: Ma trận dị thường."); }
             let new_beta = window.jStat.multiply(XTWX_inv, XTWz);
             let diff = 0;
             for(let i=0; i<=k; i++) diff += Math.abs(new_beta[i][0] - beta[i][0]);
             beta = new_beta;
             if (diff < 1e-6) { converged = true; break; }
         }
         let p_null = Y.reduce((a,b)=>a+b,0) / n;
         let ll_null = 0;
         Y.forEach(y => { ll_null += y * Math.log(p_null) + (1-y) * Math.log(1-p_null); });
         let pseudoR2 = 1 - (ll_model / ll_null);
         let modelResults = [];
         for(let i=0; i<=k; i++) {
             let coef = beta[i][0]; let se = Math.sqrt(XTWX_inv[i][i]);
             let zStat = se !== 0 ? coef / se : 0;
             let pValue = 2 * (1 - window.jStat.normal.cdf(Math.abs(zStat), 0, 1));
             let or = coef > 50 ? Infinity : Math.exp(coef);
             let ci_low = coef > 50 ? Infinity : Math.exp(coef - 1.96 * se);
             let ci_high = coef > 50 ? Infinity : Math.exp(coef + 1.96 * se);
             modelResults.push({ name: i === 0 ? 'Intercept' : multiTestVars[i-1], coef, se, zStat, pValue, or, ci_low, ci_high });
         }
         setTestResult({ type: 'logistic', modelResults, n, pseudoR2, yVar: testVar1, eventClass, baselineClass, converged });
      }
    };

    const renderTestResult = () => {
      if (!testResult) return null;
      const safeRenderVal = (val, fractionDigits = 3) => {
         if (!isFinite(val)) return '∞';
         return val.toFixed(fractionDigits);
      };

      if (testResult.type === 'chisquare') {
         const { chiSquare, df, pValue, table, rowTotals, colTotals, total, rows, cols, expectedWarning, or_res, rr_res } = testResult;
         const isSig = pValue < 0.05;
         return (
            <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
               <h4 className="font-bold text-indigo-900 text-lg mb-3">Kết quả Bảng chéo & Kiểm định $X^2$</h4>
               <div className="flex flex-col xl:flex-row gap-6 mb-5">
                  <div className="flex-1 overflow-hidden">
                     <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-sm">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                 <th className="p-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">{testVar1} \ {testVar2}</th>
                                 {cols.map(c => <th key={c} className="p-3 font-semibold text-slate-700 text-center whitespace-nowrap">{c}</th>)}
                                 <th className="p-3 font-bold text-slate-800 text-center bg-slate-100 whitespace-nowrap">Tổng</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {rows.map(r => (
                                 <tr key={r} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-medium text-slate-700 border-r border-slate-200 bg-slate-50/30 whitespace-nowrap">{r}</td>
                                    {cols.map(c => <td key={c} className="p-3 text-center text-slate-600 font-mono">{table[r][c] || 0}</td>)}
                                    <td className="p-3 text-center font-bold text-slate-700 bg-slate-50/50 font-mono">{rowTotals[r]}</td>
                                 </tr>
                              ))}
                           </tbody>
                           <tfoot className="bg-slate-100 border-t border-slate-200 font-bold text-slate-800">
                              <tr>
                                 <td className="p-3 border-r border-slate-200 whitespace-nowrap">Tổng</td>
                                 {cols.map(c => <td key={c} className="p-3 text-center font-mono">{colTotals[c]}</td>)}
                                 <td className="p-3 text-center font-mono text-indigo-700">{total}</td>
                              </tr>
                           </tfoot>
                        </table>
                     </div>
                     {or_res && rr_res && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="bg-white p-4 border border-indigo-200 rounded-lg shadow-sm">
                              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1">Odds Ratio (OR)</div>
                              <div className="text-2xl font-black text-indigo-700">{safeRenderVal(or_res.val)}</div>
                              <div className="text-sm text-slate-500 mt-1">95% CI: [{safeRenderVal(or_res.low)} - {safeRenderVal(or_res.high)}]</div>
                           </div>
                           <div className="bg-white p-4 border border-indigo-200 rounded-lg shadow-sm">
                              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1">Relative Risk (RR)</div>
                              <div className="text-2xl font-black text-indigo-700">{safeRenderVal(rr_res.val)}</div>
                              <div className="text-sm text-slate-500 mt-1">95% CI: [{safeRenderVal(rr_res.low)} - {safeRenderVal(rr_res.high)}]</div>
                           </div>
                        </div>
                     )}
                  </div>
                  <div className="w-full xl:w-72 shrink-0 flex flex-col gap-3">
                     <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Giá trị ($X^2$)</div>
                        <div className="text-xl font-mono font-bold text-indigo-600">{chiSquare.toFixed(3)}</div>
                     </div>
                     <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">P-value</div>
                        <div className={`text-xl font-mono font-bold ${isSig ? 'text-emerald-600' : 'text-rose-500'}`}>{pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}</div>
                     </div>
                  </div>
               </div>
               {expectedWarning && <div className="mt-3 text-[13px] font-medium text-amber-700 flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200"><AlertTriangle size={18} className="shrink-0 mt-0.5"/> <span>Cảnh báo: Tần số lý thuyết thấp.</span></div>}
            </div>
         );
      } else if (testResult.type === 'ttest_ind') {
         const { tStat, df, pValue, mean1, mean2, n1, n2, std1, std2, group1, group2 } = testResult;
         const isSig = pValue < 0.05;
         return (
            <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
               <h4 className="font-bold text-indigo-900 text-lg mb-3">Kết quả T-test Độc lập</h4>
               <div className="flex flex-col xl:flex-row gap-6 mb-5">
                  <div className="flex-1 overflow-hidden">
                     <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-sm">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 border-b border-slate-200">
                              <tr><th className="p-3 font-semibold text-slate-700">Nhóm</th><th className="p-3 font-semibold text-slate-700 text-right">N</th><th className="p-3 font-semibold text-slate-700 text-right">Mean</th><th className="p-3 font-semibold text-slate-700 text-right">SD</th></tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 font-mono">
                              <tr><td className="p-3 font-sans">{group1}</td><td className="p-3 text-right">{n1}</td><td className="p-3 text-right font-bold text-indigo-600">{mean1.toFixed(3)}</td><td className="p-3 text-right">{std1.toFixed(3)}</td></tr>
                              <tr><td className="p-3 font-sans">{group2}</td><td className="p-3 text-right">{n2}</td><td className="p-3 text-right font-bold text-indigo-600">{mean2.toFixed(3)}</td><td className="p-3 text-right">{std2.toFixed(3)}</td></tr>
                           </tbody>
                        </table>
                     </div>
                  </div>
                  <div className="w-full xl:w-72 shrink-0 flex flex-col gap-3">
                     <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center"><div className="text-xs text-slate-500 uppercase">T-Statistic</div><div className="text-xl font-bold text-indigo-600">{tStat.toFixed(3)}</div></div>
                     <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center"><div className="text-xs text-slate-500 uppercase">P-value</div><div className={`text-xl font-bold ${isSig ? 'text-emerald-600' : 'text-rose-500'}`}>{pValue.toFixed(4)}</div></div>
                  </div>
               </div>
            </div>
         );
      } else if (testResult.type === 'anova') {
         const { ssb, ssw, msb, msw, fStat, dfb, dfw, pValue, groupStats } = testResult;
         const isSig = pValue < 0.05;
         return (
            <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
               <h4 className="font-bold text-indigo-900 text-lg mb-3">Kết quả One-way ANOVA</h4>
               <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-sm mb-5">
                  <table className="w-full text-sm text-left font-mono">
                     <thead className="bg-slate-50 border-b border-slate-200">
                        <tr><th className="p-3 font-semibold text-slate-700 font-sans">Nguồn</th><th className="p-3 text-right font-semibold text-slate-700 font-sans">SS</th><th className="p-3 text-right font-semibold text-slate-700 font-sans">df</th><th className="p-3 text-right font-semibold text-slate-700 font-sans">MS</th><th className="p-3 text-right font-semibold text-slate-700 font-sans">F</th><th className="p-3 text-right font-semibold text-slate-700 font-sans">P</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        <tr><td className="p-3 font-sans">Between</td><td className="p-3 text-right">{ssb.toFixed(2)}</td><td className="p-3 text-right">{dfb}</td><td className="p-3 text-right">{msb.toFixed(2)}</td><td className="p-3 text-right font-bold text-indigo-600">{fStat.toFixed(3)}</td><td className={`p-3 text-right font-bold ${isSig ? 'text-emerald-600' : 'text-rose-500'}`}>{pValue.toFixed(4)}</td></tr>
                        <tr><td className="p-3 font-sans">Within</td><td className="p-3 text-right">{ssw.toFixed(2)}</td><td className="p-3 text-right">{dfw}</td><td className="p-3 text-right">{msw.toFixed(2)}</td><td className="p-3 text-right">-</td><td className="p-3 text-right">-</td></tr>
                     </tbody>
                  </table>
               </div>
            </div>
         );
      } else if (testResult.type === 'correlation') {
         const { variables, matrix } = testResult;
         return (
            <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
               <h4 className="font-bold text-indigo-900 text-lg mb-3">Ma trận tương quan Pearson</h4>
               <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
                  <table className="w-full text-sm text-center border-collapse">
                     <thead><tr><th className="p-3 bg-slate-100 font-semibold border-b border-r">Biến số</th>{variables.map(v => <th key={v} className="p-3 border-b">{v}</th>)}</tr></thead>
                     <tbody className="divide-y divide-slate-100 font-mono">
                        {matrix.map((row, i) => (
                           <tr key={i}>
                              <td className="p-3 border-r bg-slate-50 text-left font-sans font-medium">{row.varName}</td>
                              {row.correlations.map((val, j) => (
                                 <td key={j} className="p-3 font-bold" style={{ backgroundColor: getCorrelationColor(val), color: Math.abs(val) > 0.5 ? '#fff' : '#334' }}>{val.toFixed(2)}</td>
                              ))}
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         );
      } else if (testResult.type === 'boxplot') {
         const { boxData, globalMin, globalMax, yVar, xVar } = testResult;
         const range = globalMax - globalMin;
         const getPct = (val) => range === 0 ? 50 : ((val - globalMin) / range) * 100;
         return (
            <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl">
               <h4 className="font-bold text-indigo-900 text-lg mb-1">Biểu đồ Hộp (Box-plot)</h4>
               <div className="bg-white p-6 rounded-lg border border-slate-200 mt-4 overflow-x-auto">
                  <div className="min-w-[600px]">
                     {boxData.map((d, i) => (
                        <div key={i} className="flex items-center mb-6 relative group">
                           <div className="w-[150px] pr-4 text-right"><div className="font-bold text-slate-700 text-sm truncate">{d.name}</div></div>
                           <div className="flex-1 relative h-10 bg-slate-50 rounded">
                              <div className="absolute top-1/2 h-0.5 bg-slate-300" style={{ left: `${getPct(d.min)}%`, width: `${getPct(d.max) - getPct(d.min)}%`, transform: 'translateY(-50%)' }}></div>
                              <div className="absolute top-1/4 h-1/2 bg-sky-200 border border-sky-600" style={{ left: `${getPct(d.q1)}%`, width: `${getPct(d.q3) - getPct(d.q1)}%` }}>
                                 <div className="absolute top-0 bottom-0 w-1 bg-rose-500" style={{ left: `${(getPct(d.median) - getPct(d.q1)) / (getPct(d.q3) - getPct(d.q1)) * 100}%` }}></div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         );
      } else if (testResult.type === 'logistic') {
         const { modelResults, n, pseudoR2, yVar, eventClass, baselineClass } = testResult;
         return (
            <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl">
               <h4 className="font-bold text-indigo-900 text-lg mb-3">Hồi quy Logistic</h4>
               <div className="bg-white rounded-lg border overflow-x-auto shadow-sm">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50"><tr><th className="p-3">Biến Độc Lập</th><th className="p-3 text-right">β</th><th className="p-3 text-right">P-value</th><th className="p-3 text-right font-bold text-indigo-800 bg-indigo-50">OR</th><th className="p-3 text-center bg-indigo-50">95% CI</th></tr></thead>
                     <tbody className="divide-y font-mono">
                        {modelResults.map((res, i) => (
                           <tr key={i}>
                              <td className="p-3 font-sans">{res.name}</td><td className="p-3 text-right">{res.coef.toFixed(4)}</td><td className={`p-3 text-right ${res.pValue < 0.05 ? 'text-emerald-600 font-bold' : ''}`}>{res.pValue.toFixed(4)}</td><td className="p-3 text-right font-bold">{safeRenderVal(res.or)}</td><td className="p-3 text-center text-xs">[{safeRenderVal(res.ci_low)} - {safeRenderVal(res.ci_high)}]</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         );
      }
      return null;
    };
    
    return (
      <div className="p-8 h-full overflow-y-auto bg-slate-50 custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <div>
              <h2 className="text-[26px] font-extrabold text-slate-800 flex items-center gap-2.5">
                  <TrendingUp className="text-sky-600" size={28}/> Báo Cáo Thống Kê
              </h2>
          </div>
          <div className="flex gap-3">
            <button onClick={generateFullAiReport} disabled={isGeneratingReport || dataset.rows.length === 0} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 shadow-sm transition-colors">
              {isGeneratingReport ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ClipboardCheck size={20} />} Báo Cáo Tổng Thể (AI)
            </button>
            <button onClick={generateAnomaliesInsight} disabled={selectedVariables.length === 0} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl flex items-center gap-2 font-bold hover:bg-amber-600 shadow-sm transition-colors">
              <ShieldAlert size={20} /> Tìm Bất Thường
            </button>
          </div>
        </div>

        {aiReport && (
          <div className="mb-8 bg-white border-2 border-indigo-100 p-8 rounded-3xl shadow-xl relative animate-in zoom-in-95 duration-500">
             <button onClick={() => setAiReport('')} className="absolute top-6 right-6 text-slate-400 bg-slate-50 p-1.5 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors">✕</button>
             <div className="flex items-center gap-3 mb-6 border-b border-indigo-50 pb-5">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                   <ClipboardCheck size={24} />
                </div>
                <div>
                   <h3 className="font-extrabold text-slate-800 text-xl">Báo Cáo Phân Tích Tổng Thể</h3>
                   <p className="text-sm text-indigo-500 font-medium italic">Tự động khởi tạo bởi trí tuệ nhân tạo Gemini</p>
                </div>
             </div>
             <div className="prose prose-slate max-w-none">
                {renderMiniMarkdown(aiReport)}
             </div>
             <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                   <Printer size={18} /> In báo cáo này
                </button>
             </div>
          </div>
        )}

        {anomaliesInsight && (
          <div className="mb-8 bg-white border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm relative">
            <button onClick={() => setAnomaliesInsight('')} className="absolute top-4 right-4 text-slate-400 bg-slate-50 p-1 rounded-full hover:bg-slate-100">✕</button>
            <div className="flex items-center gap-2 mb-3"><ShieldAlert className="text-amber-500 w-6 h-6" /><h3 className="font-bold text-slate-800 text-lg">Cảnh Báo Dịch Tễ (AI)</h3></div>
            <div className="pr-4">{renderMiniMarkdown(anomaliesInsight)}</div>
          </div>
        )}

        <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={18} className="text-sky-500" /> Tùy chọn biến phân tích</h3>
          <div className="flex flex-wrap gap-3">
            {dataset.headers.map(header => {
              const isSelected = selectedVariables.includes(header);
              return (
                <button key={header} onClick={() => toggleVariable(header)} className={`px-4 py-2.5 rounded-xl border text-[14px] font-medium flex items-center gap-2 transition-all ${isSelected ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-[0_2px_8px_-3px_rgba(2,132,199,0.3)]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-sky-600 border-sky-600' : 'border-slate-300'}`}>{isSelected && <CheckCircle size={12} className="text-white" />}</div>
                  {header}
                </button>
              );
            })}
          </div>
        </div>

        {numericVars.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/80 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2.5"><Activity size={22} className="text-sky-500"/> Chỉ số Định lượng</h3></div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[15px]">
                <thead>
                  <tr className="bg-white">
                    <th className="p-4 border-b border-r border-slate-100 font-bold text-slate-600">Biến số</th><th className="p-4 border-b border-slate-100 text-right font-bold text-slate-600">N</th><th className="p-4 border-b border-slate-100 text-right font-bold text-slate-600">Min</th><th className="p-4 border-b border-slate-100 text-right font-bold text-slate-600">Max</th><th className="p-4 border-b border-sky-100 text-sky-800 bg-sky-50/50 text-right font-bold">Trung bình</th><th className="p-4 border-b border-slate-100 text-right font-bold text-slate-600">StdDev</th><th className="p-4 border-b border-emerald-100 text-emerald-800 bg-emerald-50/50 text-center font-bold">95% CI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {numericVars.map(h => (
                    <tr key={h} className="hover:bg-slate-50/50"><td className="p-4 font-sans font-semibold text-slate-700 border-r border-slate-100">{h}</td><td className="p-4 text-right">{dataStats[h].count}</td><td className="p-4 text-right">{dataStats[h].min}</td><td className="p-4 text-right">{dataStats[h].max}</td><td className="p-4 text-right font-bold text-sky-700 bg-sky-50/20">{dataStats[h].mean}</td><td className="p-4 text-right">{dataStats[h].stdDev}</td><td className="p-4 text-center text-emerald-700 bg-emerald-50/20 text-sm">{dataStats[h].ci95}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {categoricalVars.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/80 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2.5"><PieChart size={22} className="text-teal-500"/> Tần suất Định tính</h3></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">
              {categoricalVars.map(h => (
                <div key={h} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center"><span className="font-bold text-slate-700">{h}</span><span className="text-[12px] font-medium bg-white px-2 py-1 rounded-md border text-slate-500">N={dataStats[h].count}</span></div>
                  <ul className="divide-y divide-slate-100 text-[14px] max-h-56 overflow-y-auto custom-scrollbar">
                    {dataStats[h].frequencies.map((f, i) => (
                      <li key={i} className="flex justify-between p-3 hover:bg-slate-50/80"><span className="truncate mr-3 font-medium text-slate-600">{f.label}</span><div className="flex gap-4 shrink-0 items-center"><span className="font-bold text-slate-700">{f.count}</span><span className="text-[12px] w-12 text-right font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{f.percent}%</span></div></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="text-[18px] font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Microscope size={22} className="text-indigo-500" /> Phân Tích Kiểm Định Chuyên Sâu
           </h3>
           <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[250px]">
                 <label className="block text-sm font-semibold text-slate-600 mb-2">Loại Kiểm Định / Biểu Đồ Đặc Thù</label>
                 <select value={advancedTest} onChange={(e) => { setAdvancedTest(e.target.value); setTestVar1(''); setTestVar2(''); setTestResult(null); }} className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 bg-slate-50 font-medium">
                    <option value="">-- Chọn công cụ phân tích --</option>
                    <optgroup label="Hồi quy & Tương quan">
                       <option value="correlation">Ma trận Tương quan Pearson</option>
                       <option value="regression_scatter">Hồi quy Tuyến tính & Scatter Plot</option>
                       <option value="logistic">Hồi quy Logistic (Dự đoán Nhị phân)</option>
                    </optgroup>
                    <optgroup label="Biểu đồ chuyên sâu">
                       <option value="boxplot">Biểu đồ Hộp Box-plot</option>
                    </optgroup>
                    <optgroup label="Kiểm định giả thuyết">
                       <option value="chisquare">Chi-Square (Định tính)</option>
                       <option value="ttest_ind">T-test Độc lập</option>
                       <option value="ttest_paired">T-test Bắt cặp</option>
                       <option value="anova">ANOVA (So sánh trung bình &gt;=3 nhóm)</option>
                    </optgroup>
                 </select>
              </div>

              {advancedTest === 'logistic' && (
                 <>
                    <div className="flex-1 min-w-[200px]">
                       <label className="block text-sm font-semibold text-slate-600 mb-2">Biến Y (Nhị phân)</label>
                       <select value={testVar1} onChange={(e) => setTestVar1(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50">
                           <option value="">-- Chọn biến --</option>
                           {dataset.headers.map(v => <option key={v} value={v}>{v}</option>)}
                       </select>
                    </div>
                    <div className="flex-1 min-w-[300px]">
                       <label className="block text-sm font-semibold text-slate-600 mb-2">Các Biến X (Định lượng)</label>
                       <div className="border rounded-xl p-2 bg-slate-50 h-[100px] overflow-y-auto grid grid-cols-2 gap-1 custom-scrollbar">
                         {numericVars.filter(h => h !== testVar1).map(h => (
                           <label key={h} className="flex items-center gap-2 text-sm p-1 hover:bg-white rounded cursor-pointer">
                             <input type="checkbox" checked={multiTestVars.includes(h)} onChange={() => {
                               setMultiTestVars(prev => prev.includes(h) ? prev.filter(v=>v!==h) : [...prev, h]);
                             }} />
                             <span className="truncate">{h}</span>
                           </label>
                         ))}
                       </div>
                    </div>
                 </>
              )}

              {advancedTest !== '' && advancedTest !== 'correlation' && advancedTest !== 'logistic' && (
                 <>
                    <div className="flex-1 min-w-[200px]">
                       <label className="block text-sm font-semibold text-slate-600 mb-2">Biến số 1</label>
                       <select value={testVar1} onChange={(e) => setTestVar1(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50">
                           <option value="">-- Chọn biến --</option>
                           {dataset.headers.map(v => <option key={v} value={v}>{v}</option>)}
                       </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                       <label className="block text-sm font-semibold text-slate-600 mb-2">Biến số 2</label>
                       <select value={testVar2} onChange={(e) => setTestVar2(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50">
                           <option value="">-- Chọn biến --</option>
                           {dataset.headers.map(v => <option key={v} value={v}>{v}</option>)}
                       </select>
                    </div>
                 </>
              )}

              <button 
                 onClick={runStatisticalTest} 
                 disabled={!advancedTest || (advancedTest !== 'correlation' && (!testVar1 || (advancedTest !== 'logistic' && !testVar2)))} 
                 className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors h-[46px]"
              >
                 Chạy Phân Tích
              </button>
           </div>
           {testResult && renderTestResult()}
        </div>
      </div>
    );
  };

  const renderAIChat = () => (
    <div className="flex flex-col h-full bg-slate-50 relative p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-white flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100"><BrainCircuit className="text-indigo-600 w-6 h-6" /></div>
          <div><h2 className="font-extrabold text-slate-800 text-xl">Trợ Lý Phân Tích Dữ Liệu</h2><p className="text-sm text-slate-500">Hỏi đáp trực tiếp với AI về tập dữ liệu của bạn</p></div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mr-3 mt-1"><BrainCircuit className="text-indigo-600 w-4 h-4"/></div>}
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 bg-white border-t border-slate-100">
          <form onSubmit={handleChatSubmit} className="flex gap-3 relative">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Nhập câu hỏi phân tích..." className="flex-1 pl-5 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all text-[15px]" disabled={isLoading} />
            <button type="submit" disabled={isLoading || !chatInput} className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">Gửi AI</button>
          </form>
        </div>
      </div>
    </div>
  );

  if (!isUiLoaded) return <div className="flex items-center justify-center h-screen bg-slate-50 font-bold">Đang tải giao diện...</div>;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden text-slate-800">
      <div className="w-[260px] bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shrink-0 z-20 shadow-2xl">
        <div className="p-5 bg-slate-950 border-b border-slate-800">
          <label className="cursor-pointer block w-full">
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex items-center gap-3">
               {customLogo ? (
                 <div className="w-[60px] h-[60px] bg-white rounded-xl overflow-hidden shrink-0"><img src={customLogo} alt="Logo" className="w-full h-full object-contain" /></div>
               ) : (
                 <div className="w-[50px] h-[50px] bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shrink-0"><Activity size={24} className="text-white" /></div>
               )}
               <h1 className="text-[16px] font-extrabold text-white tracking-wide uppercase leading-tight">CDC<br/><span className="text-sky-400 text-[11px] capitalize font-bold">Hệ Thống Giám Sát</span></h1>
            </div>
          </label>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-2">
          {[
            { id: 'upload', icon: <UploadCloud size={20}/>, label: 'Nguồn Dữ Liệu' },
            { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dashboard Biểu Đồ' },
            { id: 'data', icon: <Table2 size={20}/>, label: 'Bảng Dữ Liệu' },
            { id: 'analysis', icon: <TrendingUp size={20}/>, label: 'Báo Cáo Thống Kê' },
            { id: 'map', icon: <MapIcon size={20}/>, label: 'Bản Đồ GIS' },
            { id: 'chat', icon: <MessageSquare size={20}/>, label: 'Hỏi Đáp AI' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[14px] ${activeTab === item.id ? 'bg-sky-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
              {item.icon} <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 flex flex-col relative h-full bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2"><Calendar size={18} className="text-slate-400"/><span className="text-sm font-medium text-slate-500">{new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
          <div className="flex items-center gap-4">
            {dataset.rows.length > 0 && <button onClick={handleResetAllData} className="px-4 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-full text-[12px] font-bold border border-rose-100"><RefreshCw size={14} className="inline mr-1" /> Reset Hệ Thống</button>}
            <span className={`px-4 py-1.5 rounded-full border text-[12px] font-bold ${dataset.rows.length === 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{dataset.rows.length === 0 ? 'Chưa có dữ liệu' : `Sẵn sàng: ${dataset.rows.length.toLocaleString()} dòng`}</span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'upload' && (
            <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
              <div className="text-center mb-10"><h2 className="text-[32px] font-extrabold text-slate-800 mb-3 uppercase tracking-tight">Hệ Thống Phân Tích Dịch Tễ</h2><p className="text-slate-500 text-lg">Hỗ trợ Excel/CSV, cập nhật Bản đồ GIS và Dashboard AI</p></div>
              <div className="w-full bg-white border-2 border-dashed border-sky-300 rounded-[2.5rem] p-16 text-center hover:bg-sky-50 transition-colors relative shadow-sm group">
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><FileSpreadsheet className="w-12 h-12 text-sky-600" /></div>
                <h3 className="text-2xl font-bold text-slate-700 mb-2">Kéo thả tệp dữ liệu vào đây</h3>
                <p className="text-slate-500 font-medium">Hỗ trợ định dạng .xlsx, .csv từ mọi hệ thống báo cáo</p>
              </div>
              <button onClick={loadSampleData} className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black shadow-xl flex items-center gap-3 transition-transform hover:scale-105"><Play size={22} fill="currentColor" /> Chạy Dữ Liệu Mẫu (Demo GIS)</button>
            </div>
          )}

          {activeTab === 'map' && dataset.rows.length > 0 && (
            <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
              <div className="mb-4 shrink-0"><h2 className="text-[24px] font-extrabold text-slate-800 flex items-center gap-2.5"><MapIcon className="text-sky-600" size={26} /> Bản Đồ GIS Dịch Tễ</h2></div>
              <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full min-h-0">
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col group">
                  <div ref={mapRef} className="flex-1 w-full h-full z-10"></div>
                  {(mapPoints.length > 0 || mapGeoJsonFeatures.length > 0) && !isMapAnalyzing && (
                    <div className="absolute top-4 right-4 z-[1000] flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={handleResetMapZoom} className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50"><Maximize size={16}/></button>
                       <button onClick={handleExportMap} className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50"><ImageIcon size={16}/></button>
                       <button onClick={() => setIsMapSidebarOpen(!isMapSidebarOpen)} className={`px-3 py-2 border rounded-lg shadow-sm text-sm font-bold flex items-center gap-2 ${isMapSidebarOpen ? 'bg-sky-50 text-sky-700' : 'bg-slate-800 text-white'}`}>{isMapSidebarOpen ? <PanelRightClose size={16}/> : <PanelRightOpen size={16}/>}</button>
                    </div>
                  )}
                  {isMapAnalyzing && <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-2xl flex items-center gap-3"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> {mapProgressText}</div>}
                </div>
                {isMapSidebarOpen && (
                  <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5 overflow-y-auto custom-scrollbar pb-6 pr-2">
                    <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col gap-4">
                      <h3 className="font-bold text-slate-800 text-[15px] border-b pb-3 flex items-center gap-2"><Settings size={18} className="text-sky-600"/> Cấu Hình GIS</h3>
                      <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Địa Phương</label><select value={mapConfig.locationCol} onChange={(e) => setMapConfig({...mapConfig, locationCol: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm bg-slate-50">{dataset.headers.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                      <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Số liệu</label><select value={mapConfig.analyzeVar} onChange={(e) => setMapConfig({...mapConfig, analyzeVar: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm bg-slate-50" disabled={mapConfig.aggMethod === 'count'}>{dataset.headers.filter(h => dataStats[h]?.type === 'numeric').map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                      <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Tính toán</label><select value={mapConfig.aggMethod} onChange={(e) => setMapConfig({...mapConfig, aggMethod: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm bg-slate-50"><option value="count">Đếm ca</option><option value="sum">Tổng cộng</option><option value="mean">Trung bình</option></select></div>
                      <div><label className="block text-[11px] font-bold text-sky-600 uppercase mb-1.5">Kiểu hiển thị</label><select value={mapConfig.mapStyle} onChange={(e) => setMapConfig({...mapConfig, mapStyle: e.target.value})} className="w-full p-2.5 border-2 border-sky-200 rounded-lg text-sm font-bold bg-sky-50"><option value="polygon">Vùng ranh giới</option><option value="heat">Bản đồ nhiệt</option><option value="bubble">Bong bóng</option></select></div>
                      <button onClick={handleAnalyzeMapWithAI} disabled={isMapAnalyzing} className="w-full h-11 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2">Cập nhật bản đồ</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && dataset.rows.length > 0 && renderDashboardView()}
          {activeTab === 'data' && dataset.rows.length > 0 && renderDataView()}
          {activeTab === 'analysis' && dataset.rows.length > 0 && renderAnalysis()}
          {activeTab === 'chat' && dataset.rows.length > 0 && renderAIChat()}

          {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4"></div><p className="font-bold text-slate-700">Đang phân tích...</p></div>}
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .map-label-content { font-size: 10px; font-weight: 700; color: #334; text-shadow: 1px 1px #fff; }
        @media print { .z-20, header, .flex-wrap, button { display: none !important; } main { width: 100% !important; } }
      `}} />
    </div>
  );
}