// @ts-nocheck
import PdfPrinter from 'pdfmake';

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

const documentTypeLabels: Record<string, string> = {
  INVOICE: 'חשבונית מס',
  INVOICE_RECEIPT: 'חשבונית מס / קבלה',
  RECEIPT: 'קבלה',
  QUOTE: 'הצעת מחיר',
};

export async function generatePDF(document: any): Promise<Buffer> {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
    },
    content: [
      // Header - Business info
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: document.user.businessName, style: 'businessName', alignment: 'right' },
              { text: document.user.address || '', alignment: 'right' },
              { text: document.user.phone ? `טל: ${document.user.phone}` : '', alignment: 'right' },
              { text: document.user.businessId ? `ע.מ: ${document.user.businessId}` : '', alignment: 'right' },
            ],
          },
        ],
      },
      { text: '', margin: [0, 20, 0, 0] },
      
      // Document Title
      {
        text: documentTypeLabels[document.type] || document.type,
        style: 'docTitle',
        alignment: 'center',
      },
      {
        text: `מס' ${document.documentNumber}`,
        style: 'docNumber',
        alignment: 'center',
      },
      { text: '', margin: [0, 10, 0, 0] },
      
      // Client info and date
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'פרטי לקוח:', style: 'sectionHeader', alignment: 'right' },
              { text: document.client.name, alignment: 'right' },
              { text: document.client.address || '', alignment: 'right' },
              { text: document.client.businessId ? `ח.פ: ${document.client.businessId}` : '', alignment: 'right' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: `תאריך: ${new Date(document.issueDate).toLocaleDateString('he-IL')}`, alignment: 'left' },
              document.dueDate 
                ? { text: `לתשלום עד: ${new Date(document.dueDate).toLocaleDateString('he-IL')}`, alignment: 'left' }
                : { text: '' },
            ],
          },
        ],
      },
      { text: '', margin: [0, 20, 0, 0] },
      
      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 60, 80, 80],
          body: [
            [
              { text: 'תיאור', style: 'tableHeader', alignment: 'right' },
              { text: 'כמות', style: 'tableHeader', alignment: 'center' },
              { text: 'מחיר יחידה', style: 'tableHeader', alignment: 'center' },
              { text: 'סה"כ', style: 'tableHeader', alignment: 'left' },
            ],
            ...document.items.map((item: any) => [
              { text: item.description, alignment: 'right' },
              { text: item.quantity.toString(), alignment: 'center' },
              { text: `₪${item.unitPrice.toFixed(2)}`, alignment: 'center' },
              { text: `₪${item.total.toFixed(2)}`, alignment: 'left' },
            ]),
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
          vLineWidth: () => 0,
          hLineColor: () => '#1e3a5f',
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },
      { text: '', margin: [0, 15, 0, 0] },
      
      // Totals
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', 100],
              body: [
                [
                  { text: 'סה"כ לפני מע"מ:', alignment: 'right', border: [false, false, false, false] },
                  { text: `₪${document.subtotal.toFixed(2)}`, alignment: 'left', border: [false, false, false, false] },
                ],
                [
                  { text: `מע"מ (${document.vatRate}%):`, alignment: 'right', border: [false, false, false, false] },
                  { text: `₪${document.vatAmount.toFixed(2)}`, alignment: 'left', border: [false, false, false, false] },
                ],
                [
                  { text: 'סה"כ לתשלום:', alignment: 'right', style: 'totalLabel', border: [false, true, false, false] },
                  { text: `₪${document.total.toFixed(2)}`, alignment: 'left', style: 'totalValue', border: [false, true, false, false] },
                ],
              ],
            },
            layout: 'noBorders',
          },
        ],
      },
      
      // Notes (conditional)
      ...(document.notes ? [
        { text: '', margin: [0, 20, 0, 0] },
        { text: 'הערות:', style: 'sectionHeader', alignment: 'right' },
        { text: document.notes, alignment: 'right' },
      ] : []),
    ],
    styles: {
      businessName: {
        fontSize: 16,
        bold: true,
        color: '#1e3a5f',
      },
      docTitle: {
        fontSize: 20,
        bold: true,
        color: '#1e3a5f',
      },
      docNumber: {
        fontSize: 14,
        color: '#666666',
      },
      sectionHeader: {
        fontSize: 11,
        bold: true,
        color: '#1e3a5f',
        margin: [0, 0, 0, 5],
      },
      tableHeader: {
        bold: true,
        fillColor: '#f0f7ff',
        color: '#1e3a5f',
      },
      totalLabel: {
        bold: true,
        fontSize: 12,
      },
      totalValue: {
        bold: true,
        fontSize: 14,
        color: '#1e3a5f',
      },
    },
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    
    pdfDoc.end();
  });
}
