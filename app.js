// State
let cart = [];

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');

const checkoutOverlay = document.getElementById('checkout-overlay');
const closeCheckoutBtn = document.getElementById('close-checkout');
const checkoutForm = document.getElementById('checkout-form');
const orderSuccess = document.getElementById('order-success');
const closeSuccessBtn = document.getElementById('close-success-btn');

// Initialize
function init() {
    setupEventListeners();
    updateCartUI();
    // Herteken dinamiese inhoud wanneer taal verander
    document.addEventListener('langchange', () => {
        updateCartUI();
        if (window.lastSheetData) window.renderOptions(window.lastSheetData);
    });
}

// Render products
function renderProducts(dynamicProducts = []) {
    window.currentDynamicProducts = dynamicProducts;
    productsGrid.innerHTML = '';

    dynamicProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const cartItem = cart.find(item => item.id === product.id);
        const currentQty = cartItem ? cartItem.quantity : 0;

        const isSoldOut = product.stock <= 0;
        const isOrdersClosed = product.aktief === 2;

        let bannerHtml = '';
        if (isOrdersClosed) {
            bannerHtml = `<div class="closed-banner">${t('closedBanner')}</div>`;
        } else if (isSoldOut) {
            bannerHtml = `<div class="sold-out-banner">${t('soldOut')}</div>`;
        }

        let footerHtml = '';
        if (isOrdersClosed) {
            footerHtml = `<button class="add-to-cart" disabled>${t('closed')}</button>`;
        } else if (isSoldOut) {
            footerHtml = `<button class="add-to-cart" disabled>${t('soldOut')}</button>`;
        } else if (currentQty > 0) {
            footerHtml = `
                <div class="inline-qty-controls">
                    <button class="inline-qty-btn inline-minus" data-id="${product.id}">-</button>
                    <span class="inline-qty-val">${currentQty}</span>
                    <button class="inline-qty-btn inline-plus" data-id="${product.id}">+</button>
                </div>
            `;
        } else {
            footerHtml = `<button class="add-to-cart" data-id="${product.id}">${t('choose')}</button>`;
        }

        const shouldGrayOut = isSoldOut || isOrdersClosed;

        card.innerHTML = `
            <div class="product-img-container">
                ${bannerHtml}
                <img src="${product.image}" alt="${product.name}" class="product-img" ${shouldGrayOut ? 'style="opacity: 0.6; filter: grayscale(80%);"' : ''}>
            </div>
            <div class="product-content">
                <span class="product-date">${product.date}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">R${product.price.toFixed(2)}</span>
                    ${footerHtml}
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.add-to-cart:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            addToCart(id);
        });
    });

    document.querySelectorAll('.inline-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            updateQuantity(id, -1);
        });
    });

    document.querySelectorAll('.inline-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            updateQuantity(id, 1);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Open cart
    cartIcon.addEventListener('click', () => {
        cartOverlay.classList.add('active');
    });

    // Close cart
    closeCartBtn.addEventListener('click', () => {
        cartOverlay.classList.remove('active');
    });

    // Close cart when clicking outside
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) {
            cartOverlay.classList.remove('active');
        }
    });

    // Open Checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert(t('emptyCartAlert'));
            return;
        }

        // Verander knoppie teks om te wys ons laai
        const originalText = checkoutBtn.textContent;
        checkoutBtn.textContent = t('checkingStock');
        checkoutBtn.style.opacity = "0.7";
        checkoutBtn.disabled = true;

        // Stel flag sodat updateStockUI weet ons wil checkout doen
        window.isCheckingOut = true;

        // Gaan haal die nuutste voorraad vanaf Google Sheets
        fetchStock();
    });

    // Close Checkout
    closeCheckoutBtn.addEventListener('click', () => {
        checkoutOverlay.classList.remove('active');
    });

    checkoutOverlay.addEventListener('click', (e) => {
        if (e.target === checkoutOverlay) {
            checkoutOverlay.classList.remove('active');
        }
    });

    // Vul asseblief hierdie skakel in na die Apps Script Web App ontplooi is:
    const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxhtnHcl29mGC6LOAg-E096TcF79mgcjCIv_EKQG4ewu93RcoyBfno-CaHf0cLVALx8hg/exec";

    // Haal voorraad op met JSONP
    window.updateStockUI = function (sheetData) {
        let dynamicProducts = [];
        let nameToId = window.nameToIdMap || {};
        let nextId = window.nextId || 1;

        // As daar 'n fout is
        if (sheetData.error) {
            document.getElementById('loading-message').textContent = t('loadFailed');
            return;
        }

        const productsObj = sheetData.products || sheetData;
        window.orderPrefix = sheetData.prefix || "OppihoekB"; // Save the prefix with a fallback

        for (const [key, info] of Object.entries(productsObj)) {
            let aktief = info.aktief !== undefined ? parseInt(info.aktief) : 1;
            if (aktief === 0) continue; // Skip as dit nie aktief is nie

            let actualName = info.realName || key;

            if (!nameToId[key]) {
                nameToId[key] = nextId++;
            }
            window.nameToIdMap = nameToId;
            window.nextId = nextId;

            let finalImage = info.image;
            if (!finalImage || finalImage.trim() === "") {
                finalImage = "images/logo.png";
            }

            dynamicProducts.push({
                id: nameToId[key],
                name: actualName,
                description: info.description || "",
                date: info.date || "",
                price: parseFloat(info.price) || 0,
                image: finalImage,
                stock: parseInt(info.stock) || 0,
                order: info.order !== undefined ? info.order : 99,
                aktief: aktief
            });
        }

        dynamicProducts.sort((a, b) => a.order - b.order);

        window.lastSheetData = sheetData;
        window.renderOptions(sheetData);

        // Teken slegs die beskikbare produkte in die regte volgorde
        renderProducts(dynamicProducts);

        // Versteek die laai boodskap en wys die grid
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) loadingMsg.style.display = 'none';

        const grid = document.getElementById('products-grid');
        if (grid) grid.style.display = 'grid';

        handleCheckoutValidation(dynamicProducts);
    };

    // Populeer afhaaltye en betaalopsies (behou gekose waardes)
    window.renderOptions = function (sheetData) {
        const prevPickup = document.querySelector('input[name="pickup-time"]:checked')?.value;
        const prevPayment = document.querySelector('input[name="payment-option"]:checked')?.value;

        // Populeer die Tye opsies as radio buttons
        const pickupContainer = document.getElementById('pickup-time-container');
        if (pickupContainer) {
            pickupContainer.innerHTML = '';
            if (sheetData.tye && sheetData.tye.length > 0) {
                sheetData.tye.forEach((tyd, index) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'radio-item';

                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = 'pickup-time';
                    input.value = tyd;
                    input.id = 'pickup-time-' + index;
                    input.required = true;
                    if (tyd === prevPickup) input.checked = true;

                    const label = document.createElement('label');
                    label.htmlFor = 'pickup-time-' + index;
                    label.textContent = tyd;

                    wrapper.appendChild(input);
                    wrapper.appendChild(label);
                    pickupContainer.appendChild(wrapper);
                });
            } else {
                pickupContainer.innerHTML = '<p style="color: #666; font-size: 0.9em; margin: 0;">' + t('noPickup') + '</p>';
            }
        }

        // Populeer die Betaal opsies as radio buttons
        const paymentContainer = document.getElementById('payment-option-container');
        if (paymentContainer) {
            paymentContainer.innerHTML = '';
            if (sheetData.betaalOpsies && sheetData.betaalOpsies.length > 0) {
                sheetData.betaalOpsies.forEach((opsie, index) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'radio-item';

                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = 'payment-option';
                    input.value = opsie;
                    input.id = 'payment-option-' + index;
                    input.required = true;
                    if (opsie === prevPayment) input.checked = true;

                    const label = document.createElement('label');
                    label.htmlFor = 'payment-option-' + index;
                    label.textContent = opsie;

                    wrapper.appendChild(input);
                    wrapper.appendChild(label);
                    paymentContainer.appendChild(wrapper);
                });
            } else {
                paymentContainer.innerHTML = '<p style="color: #666; font-size: 0.9em; margin: 0;">' + t('noPayment') + '</p>';
            }
        }
    };

    function handleCheckoutValidation(dynamicProducts) {
        // As ons besig is om te checkout, doen die validasie NOU met die vars data
        if (window.isCheckingOut) {
            window.isCheckingOut = false; // Reset flag

            // Herstel die knoppie
            checkoutBtn.textContent = t('checkout');
            checkoutBtn.style.opacity = "1";
            checkoutBtn.disabled = false;

            let hasError = false;
            let errorMsg = t('stockChanged') + "\n\n";

            cart.forEach(item => {
                const productInfo = dynamicProducts.find(p => p.id === item.id);
                if (productInfo && item.quantity > productInfo.stock) {
                    hasError = true;
                    if (productInfo.stock > 0) {
                        errorMsg += t('onlyAvailable', { name: item.name, available: productInfo.stock, requested: item.quantity }) + "\n";
                        item.quantity = productInfo.stock;
                    } else {
                        errorMsg += t('nowSoldOut', { name: item.name }) + "\n";
                        item.quantity = 0;
                    }
                }
            });

            if (hasError) {
                alert(errorMsg + "\n" + t('cartAdjusted'));
                cart = cart.filter(item => item.quantity > 0);
                updateCartUI();
                return; // Stop die checkout proses
            }

            // Alles is veilig! Maak die vorm oop.
            cartOverlay.classList.remove('active');
            checkoutOverlay.classList.add('active');
        }
    }

    function fetchStock() {
        if (!GOOGLE_WEB_APP_URL || GOOGLE_WEB_APP_URL.includes("HIER_KOPPEL_ONS_DIE_SKAKEL")) return;
        const script = document.createElement('script');
        script.src = GOOGLE_WEB_APP_URL + "?callback=updateStockUI";
        document.body.appendChild(script);
    }

    // Roep fetchStock wanneer app laai
    setTimeout(fetchStock, 500);

    // Hanteer die antwoord van Google nadat bestelling geplaas is
    window.onOrderSuccess = function (response) {
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');

        if (response.type === "stock_insufficient") {
            let errorMsg = t('stockChangedForm') + "\n\n";
            // Dateer die mandjie aan met die regte syfers vanaf die server
            if (response.items) {
                response.items.forEach(issue => {
                    const cartItem = cart.find(item => item.name === issue.name);
                    if (cartItem) {
                        if (issue.available > 0) {
                            errorMsg += t('onlyAvailable', { name: issue.name, available: issue.available, requested: issue.requested }) + "\n";
                            cartItem.quantity = issue.available;
                        } else {
                            errorMsg += t('nowSoldOut', { name: issue.name }) + "\n";
                            cartItem.quantity = 0;
                        }
                    }
                });
                cart = cart.filter(item => item.quantity > 0);
            }

            alert(errorMsg + "\n" + t('cartAdjustedRetry'));
            updateCartUI();

            // Bring kliënt terug na die mandjie om aan te pas
            checkoutForm.classList.remove('hidden');
            checkoutOverlay.classList.remove('active');
            if (cart.length > 0) {
                cartOverlay.classList.add('active');
            }

            submitBtn.textContent = t('placeOrder');
            submitBtn.disabled = false;

            // Haal weer die voorraad om die 'Uitverkoop' banners te wys
            fetchStock();
            return;
        }

        if (response.error) {
            alert(t('orderError') + response.error);
            submitBtn.textContent = t('placeOrder');
            submitBtn.disabled = false;
            return;
        }

        if (response.result === "success") {
            const orderNum = response.orderNumber;
            const orderNumberDisplay = document.getElementById('order-number-display');
            if (orderNumberDisplay) {
                orderNumberDisplay.textContent = t('orderNumber') + orderNum;
            }

            // Haal die prefix wat ons vroeër gestoor het
            const prefix = window.orderPrefix || "OppihoekB";

            // Update SnapScan link en QR Kode met JUqUDzJH en die bestelnommer
            const snapscanUrl = `https://pos.snapscan.io/qr/JUqUDzJH?id=${prefix}${orderNum}&amount=${window.currentTotalCents}`;

            const snapscanLink = document.getElementById('snapscan-link');
            if (snapscanLink) {
                snapscanLink.href = snapscanUrl;
            }

            const snapscanQr = document.getElementById('snapscan-qr');
            if (snapscanQr) {
                // Gebruik die amptelike API (of betroubare qrserver)
                snapscanQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(snapscanUrl)}`;
                snapscanQr.style.display = "block";
            }

            // Dateer EFT verwysing op
            const eftRef = document.getElementById('eft-reference');
            if (eftRef) {
                eftRef.textContent = prefix + orderNum;
            }

            // Hide form, show success
            checkoutForm.classList.add('hidden');
            orderSuccess.classList.remove('hidden');

            // Clear cart
            cart = [];
            updateCartUI();

            // Herstel knoppie vir volgende keer
            submitBtn.textContent = t('placeOrder');
            submitBtn.disabled = false;
        }
    };

    // Submit Checkout Form
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Calculate total in cents and summary
        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const totalCents = Math.round(totalPrice * 100);
        window.currentTotalCents = totalCents; // Stoor vir die callback

        const pickupTimeVal = document.querySelector('input[name="pickup-time"]:checked')?.value || '';
        const paymentOptionVal = document.querySelector('input[name="payment-option"]:checked')?.value || '';
        let summary = `Afhaaltyd: ${pickupTimeVal}\nBetaalopsie: ${paymentOptionVal}\n\n`;
        let itemsList = [];
        cart.forEach(item => {
            summary += `${item.quantity}x ${item.name} (${item.date})\n`;
            itemsList.push({
                id: item.id,
                name: item.name,
                date: item.date,
                quantity: item.quantity,
                price: item.price,
                lineTotal: item.price * item.quantity
            });
        });

        // Disable knoppie
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = t('sending');
        submitBtn.disabled = true;

        // Versamel vorm data
        const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            notes: document.getElementById('notes').value,
            pickupTime: pickupTimeVal,
            paymentOption: paymentOptionVal,
            orderSummary: summary,
            items: itemsList,
            total: totalPrice,
            lang: currentLang
        };

        // Stuur na Google Sheets met JSONP sodat ons die antwoord kan lees
        if (!GOOGLE_WEB_APP_URL || GOOGLE_WEB_APP_URL.includes("HIER_KOPPEL_ONS_DIE_SKAKEL")) {
            alert(t('waitAdmin'));
            submitBtn.textContent = oldText;
            submitBtn.disabled = false;
            return;
        }

        const url = new URL(GOOGLE_WEB_APP_URL);
        url.searchParams.append('action', 'order');
        url.searchParams.append('callback', 'onOrderSuccess');
        url.searchParams.append('payload', JSON.stringify(data));

        const script = document.createElement('script');
        script.src = url.toString();
        script.onerror = function () {
            alert(t('sendError'));
            submitBtn.textContent = oldText;
            submitBtn.disabled = false;
        };
        document.body.appendChild(script);
    });

    // Close success message
    closeSuccessBtn.addEventListener('click', () => {
        checkoutOverlay.classList.remove('active');
        // Reset form for next time
        setTimeout(() => {
            checkoutForm.reset();
            checkoutForm.classList.remove('hidden');
            orderSuccess.classList.add('hidden');
        }, 300);
    });
}

// Add item to cart
function addToCart(id) {
    const product = window.currentDynamicProducts.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
            alert(t('onlyXOf', { stock: product.stock, name: product.name }));
            return;
        }
        existingItem.quantity += 1;
    } else {
        if (product.stock < 1) {
            alert(t('isSoldOut', { name: product.name }));
            return;
        }
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

// Update item quantity
function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        const newQty = item.quantity + change;

        // As ons probeer meer byvoeg as wat in voorraad is
        if (change > 0 && window.currentDynamicProducts) {
            const productInfo = window.currentDynamicProducts.find(p => p.id === id);
            if (productInfo && newQty > productInfo.stock) {
                alert(t('onlyXOf', { stock: productInfo.stock, name: item.name }));
                return; // Moenie verder gaan nie
            }
        }

        item.quantity = newQty;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }
}

// Update Cart UI
function updateCartUI() {
    // Update count
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update items list
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="empty-cart"><p>${t('emptyCart')}</p></div>`;
        checkoutBtn.style.opacity = '0.5';
        checkoutBtn.style.cursor = 'not-allowed';
    } else {
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.cursor = 'pointer';

        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-date">${item.date}</div>
                    <div class="cart-item-price">R${(item.price * item.quantity).toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn minus" data-id="${item.id}">-</button>
                    <span class="item-qty">${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.id}">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Add event listeners to qty buttons
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                updateQuantity(parseInt(e.target.dataset.id), -1);
            });
        });

        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                updateQuantity(parseInt(e.target.dataset.id), 1);
            });
        });
    }

    // Update total price
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = `R${totalPrice.toFixed(2)}`;

    // Herteken die hoofblad as ons klaar voorraad het sodat die +/- tellers wys
    if (window.currentDynamicProducts) {
        renderProducts(window.currentDynamicProducts);
    }
}

// Run init
init();
