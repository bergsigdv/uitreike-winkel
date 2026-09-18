// Replace with your actual Sheet ID
const SPREADSHEET_ID = '1z-TLfM-PnX3hDCNba9EXBM4CkcRjSJyVN1eSNUbxRq8';

function setupPermissions() {
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), "Toestemmings Toets", "As jy hierdie kry, het jou skrip nou die regte toestemming om eposse te stuur.");
}

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  // -- HAAL PRODUKTE OP --
  let voorraadSheetGlobal = sheet.getSheetByName("Voorraad") || sheet.getSheetByName("Produkte");
  let products = {};
  if (voorraadSheetGlobal) {
    const data = voorraadSheetGlobal.getDataRange().getValues();
    if (data.length > 0) {
      const headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s/g, ''));

      let colName = headers.indexOf("naam");
      if (colName === -1) colName = 0;
      let colPrice = headers.indexOf("prys");
      if (colPrice === -1) colPrice = 1;
      let colStock = headers.indexOf("voorraad");
      if (colStock === -1) colStock = 2;
      let colDate = headers.indexOf("datum");
      if (colDate === -1) colDate = 3;

      let colImage = headers.indexOf("prent");
      if (colImage === -1) colImage = headers.indexOf("prentjienaam");
      if (colImage === -1) colImage = headers.indexOf("prentjie");
      if (colImage === -1) colImage = headers.indexOf("image");

      let colDesc = headers.indexOf("beskrywing");
      if (colDesc === -1) colDesc = headers.indexOf("description");

      let colOrder = headers.indexOf("volgorde");
      if (colOrder === -1) colOrder = 6;

      let colAktief = headers.indexOf("aktief");

      const baseUrl = "https://raw.githubusercontent.com/bergsigdv/uitreike-winkel/master/images/";

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const name = row[colName];
        if (!name || String(name).trim() === "") continue;

        let dateVal = row[colDate] || "";
        let uniqueKey = name + "___" + dateVal;

        let finalImageUrl = "";
        if (colImage !== -1 && row[colImage]) {
          let imageUrl = row[colImage];
          let imgStr = String(imageUrl).trim();
          if (imgStr !== "" && isNaN(Number(imgStr))) {
            if (!imgStr.includes(".") && !imgStr.startsWith("http")) {
              imgStr += ".jpg";
            }
            if (imgStr.startsWith("http")) {
              finalImageUrl = imgStr;
            } else {
              finalImageUrl = baseUrl + encodeURI(imgStr);
            }
          }
        }

        let description = "";
        if (colDesc !== -1) {
          description = row[colDesc] || "";
        }

        products[uniqueKey] = {
          realName: name,
          price: row[colPrice] || 0,
          stock: row[colStock] || 0,
          date: dateVal,
          image: finalImageUrl,
          description: description,
          order: row[colOrder] || 99,
          aktief: colAktief !== -1 && row[colAktief] !== "" ? row[colAktief] : 1
        };
      }
    }
  }

  // -- HAAL TYE OP --
  let tyeSheet = sheet.getSheetByName("Tye") || sheet.getSheetByName("Afhaaltye");
  let tye = [];
  if (tyeSheet) {
    const data = tyeSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) tye.push(data[i][0]);
    }
  }

  // -- HAAL BETAALOPSIES OP --
  let opsiesSheet = sheet.getSheetByName("BetaalOpsies") || sheet.getSheetByName("Betaalopsies") || sheet.getSheetByName("Betaal opsies");
  let betaalOpsies = [];
  if (opsiesSheet) {
    const data = opsiesSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) betaalOpsies.push(data[i][0]);
    }
  }

  if (betaalOpsies.length === 0) {
    betaalOpsies = [
      "Snapscan (Betalings sal outomaties opgetel word en geen bewys is nodig nie)",
      "EFT (Bring die bewys van betaling saam en e-pos aan bergsig.uitreike@gmail.com)",
      "Kontant / Kaart (Betaal as jy die kos kom afhaal)"
    ];
  }

  // -- HAAL PREFIX OP --
  let prefix = "Uitreike";
  let settingsSheet = sheet.getSheetByName("Stellings");
  if (settingsSheet) {
    const val = settingsSheet.getRange("A2").getValue();
    if (val) prefix = val;
  }

  const action = e.parameter.action;
  const callback = e.parameter.callback;

  if (action === 'order') {
    try {
      const payload = JSON.parse(e.parameter.payload);
      let ordersSheet = sheet.getSheetByName("Bestellings") || sheet.insertSheet("Bestellings");
      let settingsSheetLocal = sheet.getSheetByName("Stellings") || sheet.insertSheet("Stellings");

      let orderNumCell = settingsSheetLocal.getRange("B2");
      let orderNum = Number(orderNumCell.getValue()) || 1000;
      orderNumCell.setValue(orderNum + 1);

      const orderDate = new Date();
      if (payload.items && payload.items.length > 0) {
        payload.items.forEach(item => {
          ordersSheet.appendRow([
            orderNum, orderDate, payload.name, payload.email, payload.phone, payload.pickupTime,
            payload.paymentOption, item.date, item.name, item.quantity, item.price, item.lineTotal, payload.total, payload.notes
          ]);
        });

        let voorraadSheet = sheet.getSheetByName("Voorraad") || sheet.getSheetByName("Produkte");
        if (voorraadSheet) {
          const vData = voorraadSheet.getDataRange().getValues();
          const h = vData[0].map(header => String(header).toLowerCase().trim().replace(/\s/g, ''));
          let cName = h.indexOf("naam");
          let cDate = h.indexOf("datum");
          let cStock = h.indexOf("voorraad");

          payload.items.forEach(item => {
            const sName = String(item.name).toLowerCase().replace(/\s/g, '');
            const sDate = String(item.date).toLowerCase().replace(/\s/g, '');
            for (let i = 1; i < vData.length; i++) {
              if (String(vData[i][cName]).toLowerCase().replace(/\s/g, '') === sName && String(vData[i][cDate]).toLowerCase().replace(/\s/g, '') === sDate) {
                voorraadSheet.getRange(i + 1, cStock + 1).setValue(Number(vData[i][cStock]) - item.quantity);
                break;
              }
            }
          });
        }
      }

      // Epos Logika (Roep ons nuwe pragtige epos funksie)
      stuurPragtigeEpos(orderNum, payload, prefix);

      const success = { result: "success", orderNumber: orderNum };
      return ContentService.createTextOutput(callback ? callback + '(' + JSON.stringify(success) + ');' : JSON.stringify(success)).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
    } catch (err) {
      const error = { error: err.toString() };
      return ContentService.createTextOutput(callback ? callback + '(' + JSON.stringify(error) + ');' : JSON.stringify(error)).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
    }
  }

  const responseData = { products: products, tye: tye, betaalOpsies: betaalOpsies, prefix: prefix };
  return ContentService.createTextOutput(callback ? callback + '(' + JSON.stringify(responseData) + ');' : JSON.stringify(responseData)).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}


// ==============================================================================
// PRAGTIGE EPOS FUNKSIE
// ==============================================================================
function stuurPragtigeEpos(orderNumber, data, customPrefix) {
  var to = data.email;

  var prefix = customPrefix || "Uitreike";
  var verwysing = prefix + orderNumber;
  var subject = "Jou Bestelling by die Uitreike Winkel (#" + verwysing + ")";

  // Fallbacks as sekere inligting dalk nie verskaf is nie
  var pickup = data.pickupTime || "Nie gespesifiseer nie";
  var payment = data.paymentOption || "Nie gespesifiseer nie";
  var notes = data.notes || "Geen notas nie";

  var amountInCents = Math.round(data.total * 100);

  // SnapScan skakels
  var snapscanUrl = "https://pos.snapscan.io/qr/JUqUDzJH?id=" + verwysing + "&amount=" + amountInCents;
  var qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(snapscanUrl);

  // Betalingsblok met beide opsies
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

  // Die volledige HTML uitleg vir die e-pos
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
        <h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px;">Uitreike Winkel</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Jou bespreking is bevestig!</p>
      </div>
      
      <!-- Inhoud -->
      <div style="padding: 30px 25px;">
        <p style="font-size: 16px; margin-top: 0; color: #2c3e50;">Hallo <strong>${data.name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #555555;">Baie dankie vir jou bestelling! Hier is 'n volledige opsomming van jou etes en bespreekte besonderhede.</p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px 20px; margin: 25px 0; border-radius: 0 4px 4px 0;">
          <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 18px;">Bestelbesonderhede (Nommer: #${verwysing})</h3>
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

  // Stuur die e-pos deur GmailApp soos in jou oorspronklike skrif
  GmailApp.sendEmail(to, subject, "", {
    htmlBody: htmlBody,
    cc: "bergsig.uitreike@gmail.com",
    name: "Bergsig Uitreike"
  });
}

// ==============================================================================
// TOETS FUNKSIE
// ==============================================================================
function toetsMyEpos() {
  // BELANGRIK: Verander hierdie na jou regte e-posadres om die toets te ontvang
  var myEposAdres = "steenkamp@gmail.com";

  // Fiktiewe data wat presies lyk soos wat die webtuiste sou stuur
  var dummyData = {
    name: "Jan Toets",
    email: myEposAdres,
    phone: "082 123 4567",
    notes: "Dit is slegs 'n toetsbestelling.",
    pickupTime: "17:30",
    paymentOption: "EFT",
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

  // Roep jou nuwe pragtige e-pos funksie (prefix = Uitreike)
  stuurPragtigeEpos(dummyBestelNommer, dummyData, "Uitreike");
}
