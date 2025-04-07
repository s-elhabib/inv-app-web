import { Order, CartItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// Function to generate invoice HTML
export const generateInvoiceHTML = (
  order: Order,
  items: CartItem[],
  language: 'en' | 'ar' = 'ar'
): string => {
  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'right' : 'left';

  // Translations
  const translations = {
    invoice: isArabic ? 'فاتورة' : 'Invoice',
    invoiceNumber: isArabic ? 'رقم الفاتورة' : 'Invoice Number',
    date: isArabic ? 'التاريخ' : 'Date',
    client: isArabic ? 'العميل' : 'Client',
    item: isArabic ? 'المنتج' : 'Item',
    quantity: isArabic ? 'الكمية' : 'Quantity',
    price: isArabic ? 'السعر' : 'Price',
    total: isArabic ? 'المجموع' : 'Total',
    subtotal: isArabic ? 'المجموع الفرعي' : 'Subtotal',
    tax: isArabic ? 'الضريبة' : 'Tax',
    grandTotal: isArabic ? 'المجموع الكلي' : 'Grand Total',
    thankYou: isArabic ? 'شكرا لتسوقكم معنا' : 'Thank you for your business',
  };

  // Format date
  const date = new Date(order.createdAt || new Date()).toLocaleDateString(
    isArabic ? 'ar-MA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Calculate total (no tax for now)
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Generate HTML
  return `
    <!DOCTYPE html>
    <html lang="${language}" dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${translations.invoice} #${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          direction: ${dir};
          text-align: ${textAlign};
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .invoice-details div {
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          text-align: ${textAlign};
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .totals {
          width: 300px;
          margin-${isArabic ? 'right' : 'left'}: auto;
        }
        .totals table {
          margin-bottom: 0;
        }
        .totals th {
          text-align: ${isArabic ? 'right' : 'left'};
        }
        .totals td {
          text-align: right;
        }
        .grand-total {
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #777;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="invoice-title">${translations.invoice}</div>
        <div>#${order.invoiceNumber || order.id}</div>
      </div>

      <div class="invoice-details">
        <div>
          <p><strong>${translations.date}:</strong> ${date}</p>
          <p><strong>${translations.invoiceNumber}:</strong> #${order.invoiceNumber || order.id}</p>
        </div>
        <div>
          <p><strong>${translations.client}:</strong> ${order.client?.name || 'N/A'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>${translations.item}</th>
            <th>${translations.quantity}</th>
            <th>${translations.price}</th>
            <th>${translations.total}</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toFixed(2)} MAD</td>
              <td>${(item.price * item.quantity).toFixed(2)} MAD</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr class="grand-total">
            <th>${translations.total}:</th>
            <td>${total.toFixed(2)} MAD</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>${translations.thankYou}</p>
      </div>
    </body>
    </html>
  `;
};

// Function to generate and download PDF invoice
export const generateAndDownloadInvoice = async (
  order: Order,
  items: CartItem[],
  language: 'en' | 'ar' = 'ar'
): Promise<void> => {
  // Generate HTML
  const html = generateInvoiceHTML(order, items, language);

  // Create a blob from the HTML
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  // Open the invoice in a new window for printing
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      // Clean up
      URL.revokeObjectURL(url);
    };
  } else {
    // If popup is blocked, offer direct download
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
};

// Function to share invoice via WhatsApp
export const shareViaWhatsApp = (phoneNumber: string, message: string): void => {
  // Format phone number (remove spaces, ensure it starts with '+212')
  const formattedPhone = phoneNumber.replace(/\s/g, '').replace(/^0/, '+212');

  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  // Open WhatsApp
  window.open(whatsappUrl, '_blank');
};
