/*
***
MuyuReport - code.gs - V1.07
22/12/2025 - 12:08
***
*/

/*
***
01. Configuración Global - code.gs - V1.01-SV01
***
*/
const CONFIG = {
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/1lZ8OEIfeUvHqxWsVHYy4W1ow2VpIYCvTr9YFAxDkCCU/edit?usp=sharing',
  SHEET_NAME: 'Ventas',
  BATCH_SIZE: 100, // Registros a cargar por bloque
  INITIAL_DISPLAY: 5 // Registros iniciales a mostrar
};

/*
***
02. Función Principal - Servir HTML - code.gs - V1.03-SV02
***
*/
function doGet() {
  return HtmlService.createTemplateFromFile('home')
    .evaluate()
    .setTitle('MuyuReport - Dashboard de Ventas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/*
***
03. Incluir Archivos HTML - code.gs - V1.01-SV03
***
*/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/*
***
04. Obtener Registros del Último Día - code.gs - V1.07-SV04
***
*/
function getLastRecords(cantidad = CONFIG.BATCH_SIZE) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: [], total: 0, lastDate: '', dayOfWeek: '', breakdown: {} };
    }
    
    // Leer últimos 200 registros para asegurar capturar todo el último día
    const startRow = Math.max(2, lastRow - 199);
    const numRows = lastRow - startRow + 1;
    const range = sheet.getRange(startRow, 1, numRows, 7);
    const values = range.getDisplayValues();
    
    // Obtener la última fecha válida
    let lastDate = null;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i][0] && values[i][2]) { // Fecha y Producto válidos
        lastDate = values[i][0];
        break;
      }
    }
    
    if (!lastDate) {
      return { success: true, data: [], total: 0, lastDate: '', dayOfWeek: '', breakdown: {} };
    }
    
    // Filtrar solo registros del último día y procesar
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
        
        // Acumular por medio de pago
        if (medioPago === 'Yape') breakdown.Yape += total;
        else if (medioPago === 'Efectivo') breakdown.Efectivo += total;
        else if (medioPago === 'Tarjeta') breakdown.Tarjeta += total;
        
        totalDay += total;
      }
    }
    
    // Calcular día de la semana
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

/*
***
05. Obtener Ventas de un Día Específico - code.gs - V1.07-SV05
***
*/
function getSalesByDay(fecha, medioPago = 'Todas') {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: [], total: 0, breakdown: {} };
    }
    
    // Leer todos los datos
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    // Filtrar por fecha y medio de pago
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
        // Acumular totales por medio de pago
        if (rowMedioPago === 'Yape') breakdown.Yape += total;
        else if (rowMedioPago === 'Efectivo') breakdown.Efectivo += total;
        else if (rowMedioPago === 'Tarjeta') breakdown.Tarjeta += total;
        
        totalDay += total;
        
        // Filtrar por medio de pago si no es "Todas"
        if (medioPago === 'Todas' || rowMedioPago === medioPago) {
          // Si es "Todas", incluir medioPago; si no, omitirlo
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
    
    // Calcular día de la semana
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

/*
***
06. Obtener Datos Mensuales - code.gs - V1.06-SV06
***
*/
function getMonthlyData(year, months) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: {} };
    }
    
    // Leer todos los datos como TEXTO VISUAL
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    // Procesar por mes
    const monthlyData = {};
    
    months.forEach(month => {
      const categories = {};
      let totalMes = 0;
      
      values.forEach(row => {
        const fecha = row[0]; // Ya es texto "9/6/2025" o "09/06/2025"
        const producto = row[2];
        
        if (!fecha || !producto) return;
        
        // Verificar si pertenece al mes/año
        const parts = fecha.split('/');
        if (parts.length === 3) {
          const rowMonth = parseInt(parts[1]); // Convertir a número: "6" o "06" → 6
          const rowYear = parseInt(parts[2]);
          
          // Comparar números directamente
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
      
      // Ordenar categorías y obtener top 10
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

/*
***
07. Obtener Datos para Gráficos - code.gs - V1.06-SV07
***
*/
function getChartData(year, months) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: {} };
    }
    
    // Leer todos los datos como TEXTO VISUAL
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    const chartData = {};
    
    months.forEach(month => {
      // Inicializar semanas
      const weeks = {
        S1: 0, // días 1-7
        S2: 0, // días 8-14
        S3: 0, // días 15-21
        S4: 0  // días 22-fin
      };
      
      let totalMes = 0;
      
      values.forEach(row => {
        const fecha = row[0]; // Ya es texto "9/6/2025" o "09/06/2025"
        const producto = row[2];
        
        if (!fecha || !producto) return;
        
        const parts = fecha.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const rowMonth = parseInt(parts[1]); // Convertir a número
          const rowYear = parseInt(parts[2]);
          
          // Comparar números directamente
          if (rowMonth === month && rowYear === year) {
            const total = parseFloat(row[6]) || 0;
            totalMes += total;
            
            // Asignar a semana
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

/*
***
08. Obtener Ventas Anuales por Mes - code.gs - V1.07-SV08
***
*/
function getYearlySales(year) {
  try {
    const sheet = getSheet();
    const lastRow = getLastValidRow(sheet);
    
    if (lastRow < 2) {
      return { success: true, data: [], totalYear: 0 };
    }
    
    // Leer todos los datos
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getDisplayValues();
    
    // Objeto para acumular por mes
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
          
          // Acumular por medio de pago
          if (medioPago === 'Yape') monthlyData[rowMonth].Yape += total;
          else if (medioPago === 'Efectivo') monthlyData[rowMonth].Efectivo += total;
          else if (medioPago === 'Tarjeta') monthlyData[rowMonth].Tarjeta += total;
          
          monthlyData[rowMonth].total += total;
          totalYear += total;
        }
      }
    });
    
    // Convertir a array ordenado
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

/*
***
09. Funciones Auxiliares - code.gs - V1.07-SV09
***
*/
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
  // fecha viene como "21/12/2025"
  const parts = fecha.split('/');
  if (parts.length !== 3) return '';
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2]);
  
  const date = new Date(year, month, day);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  return days[date.getDay()];
}
