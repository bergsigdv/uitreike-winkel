// Eenvoudige vertaling (i18n) vir Afrikaans / Engels
const I18N = {
    af: {
        title: "Uitreike Winkel",
        heroText: "Plaas jou bestelling. (Let wel: Foto’s is slegs ter illustrasie)",
        viewProducts: "Kyk na die Produkte",
        availableProducts: "Beskikbare Produkte",
        loadingProducts: "Besig om die produklys en pryse te laai...",
        yourOrder: "U Bestelling",
        total: "Totaal:",
        checkout: "Gaan na Betaalpunt",
        completeOrder: "Voltooi Bestelling",
        fullName: "Naam en Van",
        email: "E-posadres",
        phone: "Selfoonnommer",
        choosePickup: "Kies Afhaaltyd",
        choosePayment: "Kies Betaalopsie",
        loadingTimes: "Besig om tye te laai...",
        loadingOptions: "Besig om opsies te laai...",
        notes: "Notas",
        placeOrder: "Plaas Bestelling",
        thankYou: "Baie Dankie!",
        orderPlaced: "U bestelling is suksesvol geplaas.",
        howPay: "Hoe wil u betaal?",
        option1: "Opsie 1: SnapScan",
        option2: "Opsie 2: EFT",
        paySnapScan: "Betaal met SnapScan App",
        snapAlt: "SnapScan QR Kode",
        eftName: "Naam:",
        eftBranch: "Tak kode:",
        eftType: "Tipe Rekening:",
        eftTypeVal: "Tjek",
        eftAccount: "Rekening nommer:",
        eftRef: "Verwysing:",
        close: "Maak Toe",
        footer: "© 2026 Bergsig DV. Alle regte voorbehou.",
        closedBanner: "GESLUIT",
        closed: "Gesluit",
        soldOut: "Uitverkoop",
        choose: "Kies",
        emptyCartAlert: "U mandjie is tans leeg. Voeg asseblief etes by om voort te gaan.",
        checkingStock: "Kontroleer voorraad...",
        loadFailed: "Kon nie produklys laai nie.",
        noPickup: "Geen afhaaltye beskikbaar nie.",
        noPayment: "Geen betaalopsies beskikbaar nie.",
        stockChanged: "Die volgende items se voorraad het intussen verander:",
        stockChangedForm: "Ongelukkig het die voorraad verander terwyl u die vorm ingevul het:",
        onlyAvailable: "- {name}: Jammer, daar is net {available} beskikbaar en jy het {requested} bestel.",
        nowSoldOut: "- {name}: Jammer, hierdie item het intussen heeltemal uitverkoop.",
        cartAdjusted: "Ons het u mandjie outomaties aangepas na wat wel beskikbaar is.",
        cartAdjustedRetry: "Ons het u mandjie outomaties aangepas. Gaan asseblief u mandjie na en probeer weer.",
        orderError: "Fout met bestelling: ",
        orderNumber: "Bestelnommer: ",
        sending: "Stuur bestelling...",
        waitAdmin: "Wag asseblief vir admin om die Google skakel te koppel.",
        sendError: "Daar was 'n fout om die bestelling te plaas. Probeer asseblief weer.",
        onlyXOf: "Jammer, daar is slegs {stock} beskikbaar van {name}.",
        isSoldOut: "Jammer, {name} is uitverkoop.",
        emptyCart: "Jou mandjie is leeg."
    },
    en: {
        title: "Outreach Shop",
        heroText: "Place your order. (Please note: photos are for illustration only)",
        viewProducts: "View Products",
        availableProducts: "Available Products",
        loadingProducts: "Loading product list and prices...",
        yourOrder: "Your Order",
        total: "Total:",
        checkout: "Proceed to Checkout",
        completeOrder: "Complete Order",
        fullName: "Full Name",
        email: "Email Address",
        phone: "Cellphone Number",
        choosePickup: "Choose Pickup Time",
        choosePayment: "Choose Payment Option",
        loadingTimes: "Loading times...",
        loadingOptions: "Loading options...",
        notes: "Notes",
        placeOrder: "Place Order",
        thankYou: "Thank You!",
        orderPlaced: "Your order has been placed successfully.",
        howPay: "How would you like to pay?",
        option1: "Option 1: SnapScan",
        option2: "Option 2: EFT",
        paySnapScan: "Pay with SnapScan App",
        snapAlt: "SnapScan QR Code",
        eftName: "Name:",
        eftBranch: "Branch code:",
        eftType: "Account Type:",
        eftTypeVal: "Cheque",
        eftAccount: "Account number:",
        eftRef: "Reference:",
        close: "Close",
        footer: "© 2026 Bergsig DV. All rights reserved.",
        closedBanner: "CLOSED",
        closed: "Closed",
        soldOut: "Sold Out",
        choose: "Select",
        emptyCartAlert: "Your cart is currently empty. Please add items to continue.",
        checkingStock: "Checking stock...",
        loadFailed: "Could not load the product list.",
        noPickup: "No pickup times available.",
        noPayment: "No payment options available.",
        stockChanged: "Stock for the following items has changed in the meantime:",
        stockChangedForm: "Unfortunately the stock changed while you were filling in the form:",
        onlyAvailable: "- {name}: Sorry, only {available} available and you ordered {requested}.",
        nowSoldOut: "- {name}: Sorry, this item has sold out in the meantime.",
        cartAdjusted: "We have automatically adjusted your cart to what is available.",
        cartAdjustedRetry: "We have automatically adjusted your cart. Please review your cart and try again.",
        orderError: "Order error: ",
        orderNumber: "Order number: ",
        sending: "Sending order...",
        waitAdmin: "Please wait for the admin to link the Google URL.",
        sendError: "There was an error placing the order. Please try again.",
        onlyXOf: "Sorry, only {stock} of {name} available.",
        isSoldOut: "Sorry, {name} is sold out.",
        emptyCart: "Your cart is empty."
    }
};

let currentLang = (new URLSearchParams(location.search).get('lang')) ||
    localStorage.getItem('lang') || 'af';
if (!I18N[currentLang]) currentLang = 'af';

function t(key, vars = {}) {
    let str = (I18N[currentLang] && I18N[currentLang][key]) ?? I18N.af[key] ?? key;
    return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        el.alt = t(el.dataset.i18nAlt);
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

function setLang(lang) {
    if (!I18N[lang]) return;
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
    applyTranslations();
});
