export const getContrastText = (hexcolor) => {
  if (!hexcolor) return 'white';

  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? 'black' : 'white';
};

export const printZTicket = (totals, storeName) => {
  const popupWin = window.open('', '_blank', 'width=350,height=600');
  if (!popupWin) return alert('Por favor permite ventanas emergentes para imprimir.');

  const now = new Date();
  const html = `
      <html>
        <head>
          <title>Cierre de Caja</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
            body { font-family: 'Courier Prime', monospace; padding: 20px; font-size: 12px; color: #000; width: 80mm; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .title { font-size: 16px; font-weight: bold; margin: 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${storeName}</h1>
            <p>REPORTE DE CIERRE Z</p>
            <p>${now.toLocaleDateString()} - ${now.toLocaleTimeString()}</p>
          </div>
          <div class="row"><span>Pedidos Totales:</span><span>${totals.count}</span></div>
          <br/>
          <div class="row"><span>Efectivo:</span><span>$${totals.cash.toLocaleString()}</span></div>
          <div class="row"><span>Digital:</span><span>$${totals.digital.toLocaleString()}</span></div>
          <div class="total-row"><span>TOTAL VENTAS:</span><span>$${totals.total.toLocaleString()}</span></div>
          <div class="footer"><p>Sistema RIVA ESTUDIO</p></div>
          <script>window.print();setTimeout(function(){ window.close(); }, 500);</script>
        </body>
      </html>
    `;

  popupWin.document.write(html);
  popupWin.document.close();
};
