# Google Apps Script E-pos Template

Kopieer en plak hierdie kode in jou **Google Apps Script** (wat aan jou Google Sheet gekoppel is) om die bestaande e-pos funksie te vervang of op te gradeer.

```javascript
// Hierdie funksie kan binne-in jou bestaande 'doPost' of bestelling logikagebruik word.
// Maak seker jy gee die 'orderNumber' (Bestelnommer) en die 'data' objek deur wat vanaf die webtuiste ontvang is.

function stuurPragtigeEpos(orderNumber, data) {
  var to = data.email;
  var subject = "Jou Bestelling by Vinkel en Koljander (#" + orderNumber + ")";
  
  // Fallbacks as sekere inligting dalk nie verskaf is nie
  var pickup = data.pickupTime || "Nie gespesifiseer nie";
  var payment = data.paymentOption || "Nie gespesifiseer nie";
  var notes = data.notes || "Geen notas nie";
  
  // Voeg betalingsinligting by (SnapScan en EFT)
  var prefix = "Vinkel";
  var verwysing = prefix + orderNumber;
  var amountInCents = Math.round(data.total * 100);
  
  // SnapScan skakels
  var snapscanUrl = "https://pos.snapscan.io/qr/JUqUDzJH?id=" + verwysing + "&amount=" + amountInCents;
  var qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(snapscanUrl);

  var paymentInstructions = `
    <div style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 15px; margin-top: 20px; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0; color: #00879e; font-size: 16px;">Hoe wil u betaal?</h3>
      <p style="font-size: 14px; margin-bottom: 15px; color: #555;">Kies een van die opsies hieronder:</p>
      
      <!-- SnapScan -->
      <div style="background-color: #ffffff; border: 1px solid #eee; padding: 15px; border-radius: 4px; margin-bottom: 15px; text-align: center;">
        <h4 style="margin: 0 0 10px 0; color: #333;">Opsie 1: SnapScan</h4>
        <img src="${qrCodeUrl}" alt="SnapScan QR Kode" style="max-width: 150px; margin: 0 auto; display: block;">
        <p style="margin: 15px 0 0 0;">
          <a href="${snapscanUrl}" style="display: inline-block; background-color: #0072CE; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; font-size: 14px;">Betaal met SnapScan App</a>
        </p>
      </div>

      <!-- EFT -->
      <div style="background-color: #ffffff; border: 1px solid #eee; padding: 15px; border-radius: 4px; text-align: left;">
        <h4 style="margin: 0 0 10px 0; color: #333;">Opsie 2: EFT</h4>
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Naam:</strong> Durbanville Bergsig</p>
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Bank:</strong> ABSA Durbanville</p>
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Tak kode:</strong> 334810</p>
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Tipe Rekening:</strong> Tjek</p>
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Rekening nommer:</strong> 1410590154</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #865d25;"><strong>Verwysing:</strong> <strong style="font-size: 16px;">${verwysing}</strong></p>
      </div>
    </div>
  `;
  
  // Bou die HTML rye vir elke item in die mandjie
  var itemsHtml = "";
  if (data.items && data.items.length > 0) {
    for (var i = 0; i < data.items.length; i++) {
      var item = data.items[i];
      itemsHtml += `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee;">
            <strong style="color: #2c3e50;">${item.name}</strong><br>
            <span style="color: #777777; font-size: 12px;">${item.date}</span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: center; color: #555555;">${item.quantity}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #555555;">R${item.price.toFixed(2)}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #2c3e50;"><strong>R${item.lineTotal.toFixed(2)}</strong></td>
        </tr>
      `;
    }
  }

  // Die volledige HTML uitleg vir die e-pos (inline CSS is die beste vir e-posse)
  var htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 20px; color: #333; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      
      <!-- Koplosie (Header) -->
      <div style="background-color: #2c3e50; color: #ffffff; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px;">Vinkel en Koljander</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Jou bespreking is bevestig!</p>
      </div>
      
      <!-- Inhoud -->
      <div style="padding: 30px 25px;">
        <p style="font-size: 16px; margin-top: 0; color: #2c3e50;">Hallo <strong>${data.name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #555555;">Baie dankie vir jou bestelling! Hier is 'n volledige opsomming van jou etes en bespreekte besonderhede.</p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px 20px; margin: 25px 0; border-radius: 0 4px 4px 0;">
          <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 18px;">Bestelbesonderhede (Nommer: #${orderNumber})</h3>
          <p style="margin: 6px 0; font-size: 14px; color: #555;"><strong>Afhaaltyd:</strong> ${pickup}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #555;"><strong>Betaalopsie:</strong> ${payment}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #555;"><strong>Notas:</strong> ${notes}</p>
          ${paymentInstructions}
        </div>
        
        <h3 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 8px;">Jou Etes</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px 10px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e0e0e0;">Item</th>
              <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e0e0e0;">Aantal</th>
              <th style="padding: 12px 10px; text-align: right; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e0e0e0;">Prys</th>
              <th style="padding: 12px 10px; text-align: right; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e0e0e0;">Totaal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 18px 10px; text-align: right; font-weight: 700; font-size: 16px; color: #2c3e50;">Groottotaal:</td>
              <td style="padding: 18px 10px; text-align: right; font-weight: 700; font-size: 18px; color: #e74c3c;">R${data.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <p style="font-size: 14px; line-height: 1.6; color: #777777; text-align: center; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 25px;">
          As jy enige vrae het of veranderinge wil maak, antwoord gerus op hierdie e-pos.<br><br>
          Groete,<br>
          <strong style="color: #2c3e50;">Die Vinkel en Koljander Span</strong>
        </p>
      </div>
      
    </div>
  </body>
  </html>
  `;
  
  // Stuur die e-pos deur MailApp
  MailApp.sendEmail({
    to: to,
    subject: subject,
    htmlBody: htmlBody,
    name: "Vinkel en Koljander Mark Etes"
  });
}

// ---------------------------------------------------------
// TOETS FUNKSIE
// ---------------------------------------------------------
// Plak hierdie funksie onderaan jou Apps Script.
// Kies dan 'toetsMyEpos' in die bo-kieslys en klik 'Run' (Speel)
// om 'n voorbeeld na jou eie e-posadres te stuur.

function toetsMyEpos() {
  // BELANGRIK: Verander hierdie na jou regte e-posadres om die toets te ontvang
  var myEposAdres = "jou_eie_eposadres@gmail.com"; 

  // Fiktiewe data wat presies lyk soos wat die webtuiste sou stuur
  var dummyData = {
    name: "Jan Toets",
    email: myEposAdres,
    phone: "082 123 4567",
    notes: "Dit is slegs 'n toetsbestelling. Alles lyk fantasties!",
    pickupTime: "17:30",
    paymentOption: "EFT", // Jy kan hierdie verander na "Kontant" of "SnapScan" om te sien hoe dit verander
    total: 250.00,
    items: [
      {
        name: "Beesstert Potjie",
        date: "25 Mei 2026",
        quantity: 1,
        price: 150.00,
        lineTotal: 150.00
      },
      {
        name: "Hoenderpastei",
        date: "26 Mei 2026",
        quantity: 2,
        price: 50.00,
        lineTotal: 100.00
      }
    ]
  };

  var dummyBestelNommer = 9999;

  // Roep jou nuwe pragtige e-pos funksie
  stuurPragtigeEpos(dummyBestelNommer, dummyData);
}
```
