/**
 * Convierte un número numérico a su representación en letras en español (formato contable peruano).
 * Ejemplo: 150.00 -> "CIENTO CINCUENTA CON 00/100 SOLES"
 */
export function numeroALetras(monto: number, moneda: string = "PEN"): string {
  const unidades = [
    "",
    "UN",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
  ];
  const decenas = [
    "",
    "DIEZ",
    "VEINTE",
    "TREINTA",
    "CUARENTA",
    "CINCUENTA",
    "SESENTA",
    "SETENTA",
    "OCHENTA",
    "NOVENTA",
  ];
  const diezY = [
    "DIEZ",
    "ONCE",
    "DOCE",
    "TRECE",
    "CATORCE",
    "QUINCE",
    "DIECISÉIS",
    "DIECISIETE",
    "DIECIOCHO",
    "DIECINUEVE",
  ];
  const veinti = [
    "VEINTE",
    "VEINTIUNO",
    "VEINTIDÓS",
    "VEINTITRÉS",
    "VEINTICUATRO",
    "VEINTICINCO",
    "VEINTISÉIS",
    "VEINTISIETE",
    "VEINTIOCHO",
    "VEINTINUEVE",
  ];
  const centenas = [
    "",
    "CIENTO",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
  ];

  function convertirCentenas(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    let s = centenas[c];

    if (d === 1) {
      s += (s ? " " : "") + diezY[u];
    } else if (d === 2) {
      s += (s ? " " : "") + veinti[u];
    } else if (d > 2) {
      s += (s ? " " : "") + decenas[d];
      if (u > 0) s += " Y " + unidades[u];
    } else if (u > 0) {
      s += (s ? " " : "") + unidades[u];
    }
    return s.trim();
  }

  function convertirMiles(n: number): string {
    if (n === 0) return "CERO";
    if (n < 1000) return convertirCentenas(n);
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    let s = "";
    if (miles === 1) {
      s = "MIL";
    } else {
      s = convertirCentenas(miles) + " MIL";
    }
    if (resto > 0) {
      s += " " + convertirCentenas(resto);
    }
    return s.trim();
  }

  const partes = Number(monto || 0).toFixed(2).split(".");
  const entero = parseInt(partes[0], 10);
  const centavos = partes[1] || "00";

  const letras = convertirMiles(entero);
  const nombreMoneda = moneda === "USD" ? "DÓLARES AMERICANOS" : "SOLES";

  return `SON: ${letras} CON ${centavos}/100 ${nombreMoneda}`;
}
