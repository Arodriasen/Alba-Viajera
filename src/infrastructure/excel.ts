import { fechaParaExcel, type Celda, type Hoja, type TipoColumna } from '@/domain/exportar';

const FORMATO: Partial<Record<TipoColumna, string>> = {
  fecha: 'dd/mm/yyyy',
  euros: '#,##0.00 "€"',
};

function celda(valor: Celda, tipo: TipoColumna, negrita: boolean) {
  if (valor === null) return null;
  const estilo = negrita ? { fontWeight: 'bold' as const } : {};
  if (tipo === 'fecha' && typeof valor === 'string') {
    const d = fechaParaExcel(valor);
    if (d) return { value: d, type: Date, format: FORMATO.fecha, ...estilo };
  }
  if (typeof valor === 'number') return { value: valor, type: Number, ...(FORMATO[tipo] ? { format: FORMATO[tipo] } : {}), ...estilo };
  return { value: valor, type: String, ...(tipo === 'largo' ? { wrap: true } : {}), alignVertical: 'top' as const, ...estilo };
}

/** Las hojas a un .xlsx (la librería se carga solo al exportar: no pesa en la app). */
export async function aExcel(hojas: Hoja[]): Promise<Blob> {
  const { default: escribir } = await import('write-excel-file/browser');
  const libro = hojas.map((h) => {
    const conCabecera = h.columnas.some((c) => c.titulo);
    const cabecera = conCabecera ? [h.columnas.map((c) => ({ value: c.titulo, type: String, fontWeight: 'bold' as const, backgroundColor: '#EFE9DD' }))] : [];
    const filas = h.filas.map((f, i) => f.map((v, j) => celda(v, h.columnas[j]?.tipo ?? 'texto', (h.conTotal && i === h.filas.length - 1) || (!conCabecera && j === 0))));
    return {
      sheet: h.nombre,
      data: [...cabecera, ...filas],
      columns: h.columnas.map((c) => ({ width: c.ancho })),
      ...(conCabecera ? { stickyRowsCount: 1 } : {}),
    };
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- los tipos de celdas mezcladas no los infiere
  return escribir(libro as any, { fontFamily: 'Calibri' }).toBlob();
}

/** Guarda el archivo: en el móvil, con la hoja de compartir si se puede (Archivos, Drive, WhatsApp…). */
export async function guardarArchivo(blob: Blob, nombre: string): Promise<void> {
  const archivo = new File([blob], nombre, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre });
      return;
    } catch (e) {
      // Cancelado por la persona: no se descarga.
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
