/*
***
MuyuReport - testall.gs - V1.03
22/12/2025 - 11:46
***
*/

/*
***
00. Función Principal de Tests - testall.gs - V1.03-SV00
***
*/
function testAll() {
  Logger.clear();
  Logger.log('🧪 ============================================');
  Logger.log('🧪 INICIANDO BATERÍA DE PRUEBAS - MuyuReport');
  Logger.log('🧪 Versión: V1.07');
  Logger.log('🧪 ============================================\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  // Tests de configuración
  runTest('TEST 1: Verificar CONFIG.SHEET_URL', testSheetUrl, results);
  runTest('TEST 2: Verificar CONFIG.SHEET_NAME', testSheetName, results);
  runTest('TEST 3: Conexión con el Sheet', testSheetConnection, results);
  
  // Tests de funciones auxiliares
  runTest('TEST 4: getSheet()', testGetSheet, results);
  runTest('TEST 5: getLastValidRow()', testGetLastValidRow, results);
  runTest('TEST 6: getDayOfWeek()', testGetDayOfWeek, results);
  
  // Tests de funciones principales - Diarias
  runTest('TEST 7: getLastRecords()', testGetLastRecords, results);
  runTest('TEST 8: getSalesByDay() - Todas', testGetSalesByDayAll, results);
  runTest('TEST 9: getSalesByDay() - Yape', testGetSalesByDayYape, results);
  runTest('TEST 10: getSalesByDay() - Efectivo', testGetSalesByDayEfectivo, results);
  runTest('TEST 11: getSalesByDay() - Tarjeta', testGetSalesByDayTarjeta, results);
  
  // Tests de funciones principales - Mensual
  runTest('TEST 12: getMonthlyData()', testGetMonthlyData, results);
  runTest('TEST 13: getYearlySales()', testGetYearlySales, results);
  
  // Tests de funciones principales - Gráficos
  runTest('TEST 14: getChartData()', testGetChartData, results);
  
  // Tests de validación de datos
  runTest('TEST 15: Validar formato de breakdown', testBreakdownFormat, results);
  runTest('TEST 16: Validar categoría "Resto"', testRestoCategory, results);
  
  // Resumen final
  Logger.log('\n🧪 ============================================');
  Logger.log('🧪 RESUMEN DE PRUEBAS');
  Logger.log('🧪 ============================================');
  Logger.log(`✅ Total de pruebas: ${results.total}`);
  Logger.log(`✅ Exitosas: ${results.passed}`);
  Logger.log(`❌ Fallidas: ${results.failed}`);
  Logger.log(`📊 Porcentaje de éxito: ${((results.passed/results.total)*100).toFixed(2)}%`);
  Logger.log('🧪 ============================================\n');
  
  if (results.failed > 0) {
    Logger.log('\n⚠️ DETALLES DE PRUEBAS FALLIDAS:');
    Logger.log('⚠️ ============================================');
    results.details
      .filter(d => d.status === 'FAILED')
      .forEach(d => {
        Logger.log(`\n❌ ${d.name}`);
        Logger.log(`   Error: ${d.message}`);
      });
  }
  
  return results;
}

/*
***
01. Función Auxiliar para Ejecutar Tests - testall.gs - V1.03-SV01
***
*/
function runTest(name, testFunction, results) {
  results.total++;
  try {
    testFunction();
    results.passed++;
    results.details.push({
      name: name,
      status: 'PASSED',
      message: 'OK'
    });
    Logger.log(`✅ ${name}: PASSED`);
  } catch (error) {
    results.failed++;
    results.details.push({
      name: name,
      status: 'FAILED',
      message: error.message
    });
    Logger.log(`❌ ${name}: FAILED - ${error.message}`);
  }
}

/*
***
02. Tests de Configuración - testall.gs - V1.03-SV02
***
*/
function testSheetUrl() {
  if (!CONFIG.SHEET_URL || CONFIG.SHEET_URL === '') {
    throw new Error('CONFIG.SHEET_URL no definido');
  }
  if (!CONFIG.SHEET_URL.includes('docs.google.com/spreadsheets')) {
    throw new Error('CONFIG.SHEET_URL no es una URL válida de Google Sheets');
  }
}

function testSheetName() {
  if (!CONFIG.SHEET_NAME || CONFIG.SHEET_NAME === '') {
    throw new Error('CONFIG.SHEET_NAME no definido');
  }
}

function testSheetConnection() {
  const ss = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL);
  if (!ss) {
    throw new Error('No se puede abrir el Spreadsheet');
  }
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error(`Hoja "${CONFIG.SHEET_NAME}" no encontrada`);
  }
}

/*
***
03. Tests de Funciones Auxiliares - testall.gs - V1.03-SV03
***
*/
function testGetSheet() {
  const sheet = getSheet();
  if (!sheet) {
    throw new Error('getSheet() devolvió null');
  }
  if (sheet.getName() !== CONFIG.SHEET_NAME) {
    throw new Error(`Nombre de hoja incorrecto: ${sheet.getName()}`);
  }
  Logger.log(`   → Hoja: ${sheet.getName()}`);
}

function testGetLastValidRow() {
  const sheet = getSheet();
  const lastRow = getLastValidRow(sheet);
  
  if (typeof lastRow !== 'number') {
    throw new Error('getLastValidRow() no devuelve un número');
  }
  if (lastRow < 1) {
    throw new Error(`Última fila inválida: ${lastRow}`);
  }
  Logger.log(`   → Última fila: ${lastRow}`);
}

function testGetDayOfWeek() {
  const testCases = [
    { fecha: '22/12/2025', expected: 'Lunes' },
    { fecha: '21/12/2025', expected: 'Domingo' },
    { fecha: '25/12/2025', expected: 'Jueves' }
  ];
  
  testCases.forEach(test => {
    const result = getDayOfWeek(test.fecha);
    if (result !== test.expected) {
      throw new Error(`getDayOfWeek('${test.fecha}') devolvió '${result}', esperado '${test.expected}'`);
    }
  });
  
  Logger.log(`   → Tests exitosos: ${testCases.length}`);
}

/*
***
04. Tests de Funciones Principales - Diarias - testall.gs - V1.03-SV04
***
*/
function testGetLastRecords() {
  const result = getLastRecords();
  
  if (!result.success) {
    throw new Error(`getLastRecords() falló: ${result.error}`);
  }
  
  if (!Array.isArray(result.data)) {
    throw new Error('getLastRecords() no devuelve un array en data');
  }
  
  if (typeof result.total !== 'number') {
    throw new Error('getLastRecords() no devuelve número en total');
  }
  
  if (!result.lastDate) {
    throw new Error('getLastRecords() no devuelve lastDate');
  }
  
  if (!result.dayOfWeek) {
    throw new Error('getLastRecords() no devuelve dayOfWeek');
  }
  
  if (!result.breakdown || typeof result.breakdown !== 'object') {
    throw new Error('getLastRecords() no devuelve breakdown válido');
  }
  
  // Validar estructura de breakdown
  if (!('Yape' in result.breakdown) || !('Efectivo' in result.breakdown) || !('Tarjeta' in result.breakdown)) {
    throw new Error('breakdown no contiene Yape, Efectivo y Tarjeta');
  }
  
  Logger.log(`   → Registros: ${result.data.length}`);
  Logger.log(`   → Fecha: ${result.dayOfWeek} ${result.lastDate}`);
  Logger.log(`   → Total: ${result.total}`);
}

function testGetSalesByDayAll() {
  // Usar la última fecha disponible
  const lastRecordsResult = getLastRecords();
  if (!lastRecordsResult.success || !lastRecordsResult.lastDate) {
    throw new Error('No se pudo obtener última fecha para test');
  }
  
  const fecha = lastRecordsResult.lastDate;
  const result = getSalesByDay(fecha, 'Todas');
  
  if (!result.success) {
    throw new Error(`getSalesByDay() falló: ${result.error}`);
  }
  
  if (!Array.isArray(result.data)) {
    throw new Error('getSalesByDay() no devuelve array en data');
  }
  
  if (typeof result.total !== 'number') {
    throw new Error('getSalesByDay() no devuelve número en total');
  }
  
  if (!result.breakdown) {
    throw new Error('getSalesByDay() no devuelve breakdown');
  }
  
  Logger.log(`   → Fecha: ${fecha}`);
  Logger.log(`   → Registros: ${result.data.length}`);
  Logger.log(`   → Total: ${result.total}`);
}

function testGetSalesByDayYape() {
  const lastRecordsResult = getLastRecords();
  const fecha = lastRecordsResult.lastDate;
  const result = getSalesByDay(fecha, 'Yape');
  
  if (!result.success) {
    throw new Error('getSalesByDay(Yape) falló');
  }
  
  // Los registros deben ser solo de categoría/producto/total (sin medio de pago)
  if (result.data.length > 0) {
    const firstRecord = result.data[0];
    if ('medioPago' in firstRecord) {
      throw new Error('getSalesByDay(filtrado) no debe incluir medioPago en los registros');
    }
  }
  
  Logger.log(`   → Registros Yape: ${result.data.length}`);
}

function testGetSalesByDayEfectivo() {
  const lastRecordsResult = getLastRecords();
  const fecha = lastRecordsResult.lastDate;
  const result = getSalesByDay(fecha, 'Efectivo');
  
  if (!result.success) {
    throw new Error('getSalesByDay(Efectivo) falló');
  }
  
  Logger.log(`   → Registros Efectivo: ${result.data.length}`);
}

function testGetSalesByDayTarjeta() {
  const lastRecordsResult = getLastRecords();
  const fecha = lastRecordsResult.lastDate;
  const result = getSalesByDay(fecha, 'Tarjeta');
  
  if (!result.success) {
    throw new Error('getSalesByDay(Tarjeta) falló');
  }
  
  Logger.log(`   → Registros Tarjeta: ${result.data.length}`);
}

/*
***
05. Tests de Funciones Principales - Mensual - testall.gs - V1.03-SV05
***
*/
function testGetMonthlyData() {
  const year = 2025;
  const months = [10, 11, 12]; // Oct, Nov, Dic
  
  const result = getMonthlyData(year, months);
  
  if (!result.success) {
    throw new Error(`getMonthlyData() falló: ${result.error}`);
  }
  
  if (typeof result.data !== 'object') {
    throw new Error('getMonthlyData() no devuelve objeto en data');
  }
  
  months.forEach(month => {
    if (!(month in result.data)) {
      throw new Error(`Mes ${month} no encontrado en resultado`);
    }
    
    const monthData = result.data[month];
    if (!monthData.total || !monthData.ranking) {
      throw new Error(`Mes ${month} no tiene estructura correcta`);
    }
  });
  
  Logger.log(`   → Meses procesados: ${months.length}`);
}

function testGetYearlySales() {
  const year = 2025;
  
  const result = getYearlySales(year);
  
  if (!result.success) {
    throw new Error(`getYearlySales() falló: ${result.error}`);
  }
  
  if (!Array.isArray(result.data)) {
    throw new Error('getYearlySales() no devuelve array en data');
  }
  
  if (typeof result.totalYear !== 'number') {
    throw new Error('getYearlySales() no devuelve totalYear');
  }
  
  // Validar estructura de cada mes
  if (result.data.length > 0) {
    const firstMonth = result.data[0];
    if (!('month' in firstMonth) || !('Yape' in firstMonth) || !('Efectivo' in firstMonth) || !('Tarjeta' in firstMonth) || !('total' in firstMonth)) {
      throw new Error('Estructura de mes incorrecta en getYearlySales()');
    }
  }
  
  Logger.log(`   → Meses con datos: ${result.data.length}`);
  Logger.log(`   → Total año: ${result.totalYear}`);
}

/*
***
06. Tests de Funciones Principales - Gráficos - testall.gs - V1.03-SV06
***
*/
function testGetChartData() {
  const year = 2025;
  const months = [10, 11, 12];
  
  const result = getChartData(year, months);
  
  if (!result.success) {
    throw new Error(`getChartData() falló: ${result.error}`);
  }
  
  if (typeof result.data !== 'object') {
    throw new Error('getChartData() no devuelve objeto en data');
  }
  
  months.forEach(month => {
    if (!(month in result.data)) {
      throw new Error(`Mes ${month} no encontrado en resultado`);
    }
    
    const monthData = result.data[month];
    if (!monthData.weeks || !monthData.weeks.S1 === undefined) {
      throw new Error(`Mes ${month} no tiene estructura de semanas correcta`);
    }
  });
  
  Logger.log(`   → Meses procesados: ${months.length}`);
}

/*
***
07. Tests de Validación de Datos - testall.gs - V1.03-SV07
***
*/
function testBreakdownFormat() {
  const result = getLastRecords();
  
  if (!result.success) {
    throw new Error('No se pudo obtener datos para validar breakdown');
  }
  
  const breakdown = result.breakdown;
  
  // Validar que sean números
  if (typeof breakdown.Yape !== 'number' || typeof breakdown.Efectivo !== 'number' || typeof breakdown.Tarjeta !== 'number') {
    throw new Error('breakdown contiene valores no numéricos');
  }
  
  // Validar que sean no negativos
  if (breakdown.Yape < 0 || breakdown.Efectivo < 0 || breakdown.Tarjeta < 0) {
    throw new Error('breakdown contiene valores negativos');
  }
  
  // Validar que la suma sea igual al total
  const sum = breakdown.Yape + breakdown.Efectivo + breakdown.Tarjeta;
  const diff = Math.abs(sum - result.total);
  
  if (diff > 0.01) { // Tolerancia para errores de redondeo
    throw new Error(`Suma de breakdown (${sum}) no coincide con total (${result.total})`);
  }
  
  Logger.log(`   → Breakdown válido: Yape ${breakdown.Yape}, Efectivo ${breakdown.Efectivo}, Tarjeta ${breakdown.Tarjeta}`);
}

function testRestoCategory() {
  const year = 2025;
  const months = [10]; // Solo un mes para simplificar
  
  const result = getMonthlyData(year, months);
  
  if (!result.success) {
    throw new Error('No se pudo obtener datos para validar categoría Resto');
  }
  
  const monthData = result.data[10];
  
  // Buscar si hay categoría "Resto"
  const restoItem = monthData.ranking.find(item => item.categoria === 'Resto');
  
  if (restoItem) {
    Logger.log(`   → Categoría "Resto" encontrada con total: ${restoItem.total}`);
    
    // Verificar que sea la última posición si existe
    const lastItem = monthData.ranking[monthData.ranking.length - 1];
    if (lastItem.categoria !== 'Resto') {
      throw new Error('Categoría "Resto" no está en última posición');
    }
  } else {
    Logger.log('   → No hay categoría "Resto" (menos de 11 categorías)');
  }
  
  // Verificar que NO haya categoría "Otros"
  const otrosItem = monthData.ranking.find(item => item.categoria === 'Otros');
  if (otrosItem) {
    throw new Error('Se encontró categoría "Otros", debería ser "Resto"');
  }
}

/*
***
08. Test de Performance - testall.gs - V1.03-SV08
***
*/
function testPerformance() {
  Logger.clear();
  Logger.log('⏱️ ============================================');
  Logger.log('⏱️ TEST DE PERFORMANCE');
  Logger.log('⏱️ ============================================\n');
  
  const tests = [
    { name: 'getLastRecords()', func: () => getLastRecords() },
    { name: 'getSalesByDay()', func: () => {
      const lastDate = getLastRecords().lastDate;
      return getSalesByDay(lastDate, 'Todas');
    }},
    { name: 'getMonthlyData()', func: () => getMonthlyData(2025, [10, 11, 12]) },
    { name: 'getYearlySales()', func: () => getYearlySales(2025) },
    { name: 'getChartData()', func: () => getChartData(2025, [10, 11, 12]) }
  ];
  
  tests.forEach(test => {
    const start = new Date().getTime();
    test.func();
    const end = new Date().getTime();
    const duration = end - start;
    
    Logger.log(`${test.name}: ${duration}ms`);
  });
  
  Logger.log('\n⏱️ ============================================');
}
