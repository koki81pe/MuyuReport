// MOD-001: ENCABEZADO [INICIO]
/*
*****************************************
PROYECTO: MuyuReport
ARCHIVO: code.gs
VERSIÓN: 01.08
FECHA: 19/01/2026 11:43 (UTC-5)
*****************************************
*/
// MOD-001: FIN

// MOD-002: CONFIGURACIÓN GLOBAL [INICIO]
const CONFIG = {
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/1lZ8OEIfeUvHqxWsVHYy4W1ow2VpIYCvTr9YFAxDkCCU/edit?usp=sharing',
  SHEET_NAME: 'Ventas',
  BATCH_SIZE: 100,
  INITIAL_DISPLAY: 5
};
// MOD-002: FIN

// MOD-003: SERVIR HTML [INICIO]
function doGet() {
  return HtmlService.createTemplateFromFile('home')
    .evaluate()
    .setTitle('MuyuReport - Dashboard de Ventas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}
// MOD-003: FIN

// MOD-004: INCLUIR ARCHIVOS HTML [INICIO]
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
// MOD-004: FIN

// MOD-005: OBTENER REGISTROS DEL ÚLTIMO DÍA [INICIO]
function getLastRecords(cantidad = CONFIG.BATCH_SIZE) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: [], total: 0, lastDate: '', dayOfWeek: '', breakdown: {} };
    }
    
    const startRow = Math.max(2, lastRow - 199);
    const numRows = lastRow - startRow + 1;
    const range = sheet.getRange(startRow, 1, numRows, 7);
    const values = range.getDisplayValues();
    
    let lastDate = null;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i][0] && values[i][2]) {
        lastDate = values[i][0];
        break;
      }
    }
    
    if (!lastDate) {
      return { success: true, data: [], total: 0, lastDate: '', dayOfWeek: '', breakdown: {} };
    }
    
    const records = [];
    const breakdown = { Yape: 0, Efectivo: 0, Tarjeta: 0 };
    let totalDay = 0;
    
    for (let i = values.length - 1; i >= 0; i--) {
      const fecha = values[i][0];
      const categoria = values[i][1] || '';
      const producto = values[i][2] || '';
      const medioPago = values[i][3] || '';
      const total = parseFloat(values[i][6]) || 0;
      
      if (fecha === lastDate && producto) {
        records.push({
          categoria: categoria,
          producto: producto,
          medioPago: medioPago,
          total: total
        });
        
        if (medioPago === 'Yape') breakdown.Yape += total;
        else if (medioPago === 'Efectivo') breakdown.Efectivo += total;
        else if (medioPago === 'Tarjeta') breakdown.Tarjeta += total;
        
        totalDay += total;
      }
    }
    
    const dayOfWeek = getDayOfWeek(lastDate);
    
    return {
      success: true,
      data: records,
      total: totalDay,
      lastDate: lastDate,
      dayOfWeek: dayOfWeek,
      breakdown: breakdown
    };
    
  } catch (error) {
    console.log('Error en getLastRecords: ' + error.toString());
    return {
      success: false,
      error: 'Error al obtener registros',
      message: error.toString()
    };
  }
}
// MOD-005: FIN

// MOD-006: OBTENER VENTAS POR DÍA [INICIO]
function getSalesByDay(fecha, medioPago = 'Todas') {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: [], total: 0, breakdown: {} };
    }
    
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    const records = [];
    const breakdown = { Yape: 0, Efectivo: 0, Tarjeta: 0 };
    let totalDay = 0;
    
    values.forEach(row => {
      const rowFecha = row[0];
      const categoria = row[1] || '';
      const producto = row[2] || '';
      const rowMedioPago = row[3] || '';
      const total = parseFloat(row[6]) || 0;
      
      if (rowFecha === fecha && producto) {
        if (rowMedioPago === 'Yape') breakdown.Yape += total;
        else if (rowMedioPago === 'Efectivo') breakdown.Efectivo += total;
        else if (rowMedioPago === 'Tarjeta') breakdown.Tarjeta += total;
        
        totalDay += total;
        
        if (medioPago === 'Todas' || rowMedioPago === medioPago) {
          if (medioPago === 'Todas') {
            records.push({
              categoria: categoria,
              producto: producto,
              medioPago: rowMedioPago,
              total: total
            });
          } else {
            records.push({
              categoria: categoria,
              producto: producto,
              total: total
            });
          }
        }
      }
    });
    
    const dayOfWeek = getDayOfWeek(fecha);
    
    return {
      success: true,
      data: records,
      total: totalDay,
      breakdown: breakdown,
      fecha: fecha,
      dayOfWeek: dayOfWeek
    };
    
  } catch (error) {
    console.log('Error en getSalesByDay: ' + error.toString());
    return {
      success: false,
      error: 'Error al obtener ventas del día'
    };
  }
}
// MOD-006: FIN

// MOD-007: OBTENER DATOS MENSUALES [INICIO]
function getMonthlyData(year, months) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: {} };
    }
    
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    const monthlyData = {};
    
    months.forEach(month => {
      const categories = {};
      let totalMes = 0;
      
      values.forEach(row => {
        const fecha = row[0];
        const producto = row[2];
        
        if (!fecha || !producto) return;
        
        const parts = fecha.split('/');
        if (parts.length === 3) {
          const rowMonth = parseInt(parts[1]);
          const rowYear = parseInt(parts[2]);
          
          if (rowMonth === month && rowYear === year) {
            const categoria = row[1] || 'Sin categoría';
            const total = parseFloat(row[6]) || 0;
            
            if (!categories[categoria]) {
              categories[categoria] = 0;
            }
            categories[categoria] += total;
            totalMes += total;
          }
        }
      });
      
      const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);
      
      const top10 = sortedCategories.slice(0, 10);
      const others = sortedCategories.slice(10);
      
      let othersTotal = 0;
      others.forEach(([cat, val]) => {
        othersTotal += val;
      });
      
      const ranking = top10.map(([cat, val], index) => ({
        posicion: index + 1,
        categoria: cat,
        total: val
      }));
      
      if (othersTotal > 0) {
        ranking.push({
          posicion: 11,
          categoria: 'Resto',
          total: othersTotal
        });
      }
      
      monthlyData[month] = {
        total: totalMes,
        ranking: ranking
      };
    });
    
    return {
      success: true,
      data: monthlyData
    };
    
  } catch (error) {
    console.log('Error en getMonthlyData: ' + error.toString());
    return {
      success: false,
      error: 'Error al obtener datos mensuales'
    };
  }
}
// MOD-007: FIN

// MOD-008: OBTENER DATOS PARA GRÁFICOS [INICIO]
function getChartData(year, months) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: {} };
    }
    
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    const chartData = {};
    
    months.forEach(month => {
      const weeks = {
        S1: 0,
        S2: 0,
        S3: 0,
        S4: 0
      };
      
      let totalMes = 0;
      
      values.forEach(row => {
        const fecha = row[0];
        const producto = row[2];
        
        if (!fecha || !producto) return;
        
        const parts = fecha.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const rowMonth = parseInt(parts[1]);
          const rowYear = parseInt(parts[2]);
          
          if (rowMonth === month && rowYear === year) {
            const total = parseFloat(row[6]) || 0;
            totalMes += total;
            
            if (day >= 1 && day <= 7) {
              weeks.S1 += total;
            } else if (day >= 8 && day <= 14) {
              weeks.S2 += total;
            } else if (day >= 15 && day <= 21) {
              weeks.S3 += total;
            } else {
              weeks.S4 += total;
            }
          }
        }
      });
      
      chartData[month] = {
        total: totalMes,
        weeks: weeks
      };
    });
    
    return {
      success: true,
      data: chartData
    };
    
  } catch (error) {
    console.log('Error en getChartData: ' + error.toString());
    return {
      success: false,
      error: 'Error al obtener datos de gráficos'
    };
  }
}
// MOD-008: FIN

// MOD-009: OBTENER VENTAS ANUALES [INICIO]
function getYearlySales(year) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: [], totalYear: 0 };
    }
    
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    const monthlyData = {};
    let totalYear = 0;
    
    values.forEach(row => {
      const fecha = row[0];
      const producto = row[2];
      const medioPago = row[3] || '';
      const total = parseFloat(row[6]) || 0;
      
      if (!fecha || !producto) return;
      
      const parts = fecha.split('/');
      if (parts.length === 3) {
        const rowMonth = parseInt(parts[1]);
        const rowYear = parseInt(parts[2]);
        
        if (rowYear === year) {
          if (!monthlyData[rowMonth]) {
            monthlyData[rowMonth] = {
              month: rowMonth,
              Yape: 0,
              Efectivo: 0,
              Tarjeta: 0,
              total: 0
            };
          }
          
          if (medioPago === 'Yape') monthlyData[rowMonth].Yape += total;
          else if (medioPago === 'Efectivo') monthlyData[rowMonth].Efectivo += total;
          else if (medioPago === 'Tarjeta') monthlyData[rowMonth].Tarjeta += total;
          
          monthlyData[rowMonth].total += total;
          totalYear += total;
        }
      }
    });
    
    const monthsArray = Object.values(monthlyData).sort((a, b) => a.month - b.month);
    
    return {
      success: true,
      data: monthsArray,
      totalYear: totalYear
    };
    
  } catch (error) {
    console.log('Error en getYearlySales: ' + error.toString());
    return {
      success: false,
      error: 'Error al obtener ventas anuales'
    };
  }
}
// MOD-009: FIN

// MOD-010: FUNCIONES AUXILIARES [INICIO]
function getSheet() {
  const ss = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL);
  return ss.getSheetByName(CONFIG.SHEET_NAME);
}

function getLastValidRow(sheet) {
  const column = sheet.getRange('A:A').getValues();
  let lastRow = 0;
  
  for (let i = column.length - 1; i >= 0; i--) {
    if (column[i][0]) {
      lastRow = i + 1;
      break;
    }
  }
  
  return lastRow;
}

function getDayOfWeek(fecha) {
  const parts = fecha.split('/');
  if (parts.length !== 3) return '';
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  
  const date = new Date(year, month, day);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  return days[date.getDay()];
}
// MOD-010: FIN

// MOD-099: NOTAS [INICIO]
/*
DESCRIPCIÓN:
Backend central de MuyuReport - Dashboard de Ventas.
Procesa datos de Google Sheets y los entrega al frontend.

DEPENDENCIAS:
- MOD-002: CONFIG contiene URL del Spreadsheet y configuración
- MOD-010: Funciones auxiliares usadas por todos los módulos de consulta

FUNCIONES PRINCIPALES:
- getLastRecords(): Obtiene registros del último día registrado (lee últimos 200 para asegurar)
- getSalesByDay(): Filtra ventas de un día específico con opción de filtrar por medio de pago
- getMonthlyData(): Genera ranking top 10 de categorías por mes
- getChartData(): Agrupa ventas por semanas (S1-S4) para gráficos
- getYearlySales(): Consolida ventas mensuales del año con desglose por medio de pago

ADVERTENCIAS:
- Todas las funciones usan getDisplayValues() para procesar fechas como texto visual
- getDayOfWeek() convierte string "DD/MM/YYYY" a día de la semana en español
- Fechas procesadas asumen formato DD/MM/YYYY de Google Sheets Perú
*/
// MOD-099: FIN
