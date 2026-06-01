const itemsList = document.querySelector("#items-list");
const partidaTabs = document.querySelector("#partida-tabs");
const partidaSummary = document.querySelector("#partida-summary");
const totalUnitsElement = document.querySelector("#total-units");
const totalPriceElement = document.querySelector("#total-price");
const resetButton = document.querySelector("#reset-button");
const pdfButton = document.querySelector("#pdf-button");
const cartPreviewList = document.querySelector("#cart-preview-list");
const clientWizard = document.querySelector("#client-wizard");
const clientWizardForm = document.querySelector("#client-wizard-form");
const wizardStepLabel = document.querySelector("#wizard-step-label");
const wizardCloseButton = document.querySelector("#wizard-close-button");
const wizardCancelButton = document.querySelector("#wizard-cancel-button");
const wizardBackButton = document.querySelector("#wizard-back-button");
const wizardNextButton = document.querySelector("#wizard-next-button");
const wizardGenerateButton = document.querySelector("#wizard-generate-button");
const wizardError = document.querySelector("#wizard-error");
const wizardReviewClient = document.querySelector("#wizard-review-client");
const wizardReviewItems = document.querySelector("#wizard-review-items");
const wizardReviewTotal = document.querySelector("#wizard-review-total");

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

// Datos editables para la cabecera del presupuesto.

const empresaEmisora = {
  nombre: "Labelgrup Networks",
  cif: "CIF/NIF",
  direccion: "Av. del Progrés, 16, 08840 Viladecans, Barcelona",
  telefono: "936807171",
  email: "info@labelgrup.com",
  web: "www.labelgrup.com",
};

// Datos editables del cliente receptor del presupuesto.
const clienteReceptor = {
  nombre: "Empresa cliente",
  cif: "CIF/NIF cliente",
  direccion: "Dirección cliente",
  contacto: "Persona de contacto",
  email: "email@cliente.com",
  telefono: "",
  observaciones: "",
};

// Logo local para evitar problemas de CORS al generar el PDF.
const logoEmpresaSrc = "./assets/logo-labelgrup.png.webp";

let items = [];
let activePartida = "";
let quantities = {};
let wizardCurrentStep = 1;

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function getQuantityInputs() {
  return [...document.querySelectorAll(".quantity-input")];
}

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeItems(nextItems) {
  return nextItems.map((item, index) => ({
    ...item,
    id: item.id || `${slugify(item.nombre || "item")}-${index + 1}`,
    partida: item.partida || "General",
  }));
}

function getPartidas() {
  return [...new Set(items.map((item) => item.partida))];
}

function getItemsByPartida(partida) {
  return items.filter((item) => item.partida === partida);
}

function getQuantity(itemId) {
  return quantities[itemId] || 0;
}

function getItemSubtotal(item) {
  return (Number(item.precio) || 0) * getQuantity(item.id);
}

function getSelectedItems() {
  return getItemsSeleccionados();
}

function getItemsSeleccionados() {
  return items
    .filter((item) => getQuantity(item.id) > 0)
    .map((item) => ({
      ...item,
      cantidad: getQuantity(item.id),
      precioUnitario: Number(item.precio) || 0,
      subtotal: getItemSubtotal(item),
    }));
}

function getTotalPresupuesto(selectedItems = getItemsSeleccionados()) {
  return selectedItems.reduce((total, item) => total + item.subtotal, 0);
}

function getPartidaSubtotal(partida) {
  return getItemsByPartida(partida).reduce(
    (subtotal, item) => subtotal + getItemSubtotal(item),
    0,
  );
}

function updateTotals() {
  let totalUnits = 0;
  let totalPrice = 0;

  items.forEach((item) => {
    const quantity = getQuantity(item.id);

    totalUnits += quantity;
    totalPrice += getItemSubtotal(item);
  });

  getQuantityInputs().forEach((input) => {
    const item = items.find((nextItem) => nextItem.id === input.dataset.itemId);
    const subtotalElement = input
      .closest(".item-row")
      .querySelector(".subtotal");

    input.value = getQuantity(input.dataset.itemId);

    if (item && subtotalElement) {
      subtotalElement.textContent = formatCurrency(getItemSubtotal(item));
    }
  });

  totalUnitsElement.textContent = totalUnits;
  totalPriceElement.textContent = formatCurrency(totalPrice);
  updatePartidaSummary();
  updateTabSubtotals();
  renderCartPreview();
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function getWizardInput(name) {
  return clientWizardForm.elements[name];
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setWizardError(message) {
  wizardError.textContent = message;
}

function recogerDatosCliente() {
  return {
    nombre: getWizardInput("nombre").value.trim(),
    cif: getWizardInput("cif").value.trim(),
    direccion: getWizardInput("direccion").value.trim(),
    contacto: getWizardInput("contacto").value.trim(),
    email: getWizardInput("email").value.trim(),
    telefono: getWizardInput("telefono").value.trim(),
    observaciones: getWizardInput("observaciones").value.trim(),
  };
}

function updateWizardReview() {
  const selectedItems = getItemsSeleccionados();
  const clientData = recogerDatosCliente();

  wizardReviewClient.textContent = clientData.nombre || "-";
  wizardReviewItems.textContent = selectedItems.length;
  wizardReviewTotal.textContent = formatCurrency(
    getTotalPresupuesto(selectedItems),
  );
}

function setWizardStep(step) {
  wizardCurrentStep = step;
  document.querySelectorAll(".wizard-step").forEach((stepElement) => {
    stepElement.hidden = Number(stepElement.dataset.step) !== step;
  });

  wizardStepLabel.textContent = `Paso ${step} de 2`;
  wizardBackButton.hidden = step === 1;
  wizardNextButton.hidden = step === 2;
  wizardGenerateButton.hidden = step === 1;
  setWizardError("");

  if (step === 2) {
    updateWizardReview();
  }
}

function validateWizardClient() {
  const clientData = recogerDatosCliente();

  if (!clientData.nombre) {
    setWizardError("El nombre de empresa cliente es obligatorio.");
    getWizardInput("nombre").focus();
    return false;
  }

  if (!isValidEmail(clientData.email)) {
    setWizardError("Introduce un email válido o deja el campo vacío.");
    getWizardInput("email").focus();
    return false;
  }

  setWizardError("");
  return true;
}

function abrirWizardCliente() {
  if (getItemsSeleccionados().length === 0) {
    alert("Selecciona al menos un item para generar el presupuesto.");
    return;
  }

  clientWizard.hidden = false;
  document.body.classList.add("modal-open");
  setWizardStep(1);
  getWizardInput("nombre").focus();
}

function cerrarWizardCliente() {
  clientWizard.hidden = true;
  document.body.classList.remove("modal-open");
  setWizardError("");
}

function createItemInfo(item) {
  const itemInfo = document.createElement("div");
  itemInfo.className = "item-info";
  itemInfo.setAttribute("role", "cell");

  itemInfo.appendChild(createTextElement("span", "item-name", item.nombre));

  if (item.descripcion) {
    itemInfo.appendChild(
      createTextElement("span", "item-description", item.descripcion),
    );
  }

  return itemInfo;
}

function createItemRow(item, index) {
  const row = document.createElement("div");
  row.className = "table-row item-row";
  row.setAttribute("role", "row");

  const price = Number(item.precio) || 0;
  const priceElement = createTextElement(
    "span",
    "price",
    formatCurrency(price),
  );
  priceElement.setAttribute("role", "cell");

  const quantityLabel = document.createElement("label");
  quantityLabel.className = "quantity-field";
  quantityLabel.setAttribute("role", "cell");

  const hiddenLabel = createTextElement(
    "span",
    "sr-only",
    `Cantidad para ${item.nombre}`,
  );

  const quantityInput = document.createElement("input");
  quantityInput.className = "quantity-input";
  quantityInput.type = "number";
  quantityInput.min = "0";
  quantityInput.step = "1";
  quantityInput.value = getQuantity(item.id);
  quantityInput.inputMode = "numeric";
  quantityInput.dataset.itemId = item.id;

  const subtotalElement = createTextElement(
    "span",
    "subtotal",
    formatCurrency(0),
  );
  subtotalElement.dataset.itemId = item.id;
  subtotalElement.setAttribute("role", "cell");

  quantityLabel.append(hiddenLabel, quantityInput);
  row.append(
    createItemInfo(item),
    priceElement,
    quantityLabel,
    subtotalElement,
  );

  row.querySelector(".quantity-input").addEventListener("input", (event) => {
    const quantity = Math.max(0, Math.floor(Number(event.target.value) || 0));
    quantities[item.id] = quantity;
    event.target.value = quantity;
    updateTotals();
  });

  return row;
}

function createCartPreviewItem(item) {
  const cartItem = document.createElement("div");
  cartItem.className = "cart-preview-item";
  cartItem.title = `${item.nombre} | Cant: ${getQuantity(item.id)} | ${formatCurrency(
    Number(item.precio) || 0,
  )} | Total: ${formatCurrency(getItemSubtotal(item))}`;

  cartItem.append(
    createTextElement("span", "cart-preview-item-name", item.nombre),
    createTextElement(
      "span",
      "cart-preview-item-quantity",
      getQuantity(item.id),
    ),
    createTextElement(
      "span",
      "cart-preview-item-price",
      formatCurrency(Number(item.precio) || 0),
    ),
    createTextElement(
      "span",
      "cart-preview-item-subtotal",
      formatCurrency(getItemSubtotal(item)),
    ),
  );
  return cartItem;
}

function renderCartPreview() {
  cartPreviewList.innerHTML = "";

  const selectedItems = getSelectedItems();

  if (selectedItems.length === 0) {
    cartPreviewList.appendChild(
      createTextElement(
        "p",
        "cart-preview-empty",
        "No hay items seleccionados todavía.",
      ),
    );
    return;
  }

  selectedItems.forEach((item) => {
    cartPreviewList.appendChild(createCartPreviewItem(item));
  });
}

function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatDateForPdf(date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function createBudgetNumber(date) {
  const datePart = formatDateForFilename(date);
  const timePart = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join("");

  return `PRES-${datePart}-${timePart}`;
}

async function cargarImagenComoBase64(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar la imagen: ${response.status}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function convertirBase64APng(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function calcularDimensionesProporcionales(width, height, maxWidth, maxHeight) {
  if (!width || !height) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(maxWidth / width, maxHeight / height);

  return {
    width: width * scale,
    height: height * scale,
  };
}

function addPdfFooter(doc, budgetNumber) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(217, 226, 223);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(98, 112, 108);
    doc.text(`Presupuesto ${budgetNumber}`, 14, pageHeight - 9);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - 14, pageHeight - 9, {
      align: "right",
    });
  }
}

// Plantilla independiente para generar el presupuesto sin depender del HTML visible.
async function generarPDFPresupuesto(cliente = clienteReceptor) {
  const selectedItems = getItemsSeleccionados();

  if (selectedItems.length === 0) {
    alert("Selecciona al menos un item para generar el presupuesto.");
    return false;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("No se ha podido cargar la librería de PDF. Revisa la conexión.");
    return false;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  if (typeof doc.autoTable !== "function") {
    alert("No se ha podido cargar la tabla del PDF. Revisa la conexión.");
    return false;
  }

  const budgetDate = new Date();
  const budgetNumber = createBudgetNumber(budgetDate);
  let logo = null;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  try {
    const logoBase64 = await cargarImagenComoBase64(logoEmpresaSrc);
    logo = await convertirBase64APng(logoBase64);
  } catch (error) {
    console.warn("No se pudo cargar el logo en el PDF:", error);
  }

  const headerTop = 10;
  const maxLogoWidth = 60;
  const maxLogoHeight = 24;
  const logoSize = logo
    ? calcularDimensionesProporcionales(
        logo.width,
        logo.height,
        maxLogoWidth,
        maxLogoHeight,
      )
    : null;
  const headerHeight = Math.max(34, (logoSize?.height || 0) + 12);
  const headerBottom = headerTop + headerHeight;

  doc.setDrawColor(217, 226, 223);
  doc.setFillColor(248, 251, 250);
  doc.roundedRect(
    margin,
    headerTop,
    pageWidth - margin * 2,
    headerHeight,
    2,
    2,
    "FD",
  );

  if (logo && logoSize) {
    const logoY = headerTop + (headerHeight - logoSize.height) / 2;
    doc.addImage(
      logo.dataUrl,
      "PNG",
      margin + 4,
      logoY,
      logoSize.width,
      logoSize.height,
    );
  }

  doc.setTextColor(22, 33, 31);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(empresaEmisora.nombre, pageWidth - margin - 4, headerTop + 8, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    [
      `CIF/NIF: ${empresaEmisora.cif}`,
      empresaEmisora.direccion,
      `Tel: ${empresaEmisora.telefono}`,
      empresaEmisora.email,
      empresaEmisora.web,
    ].filter(Boolean),
    pageWidth - margin - 4,
    headerTop + 14,
    { align: "right", maxWidth: 82 },
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Presupuesto de instalación", margin, headerBottom + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nº ${budgetNumber}`, margin, headerBottom + 20);
  doc.text(
    `Fecha: ${formatDateForPdf(budgetDate)}`,
    pageWidth - margin,
    headerBottom + 20,
    {
      align: "right",
    },
  );

  const clientLines = [
    cliente.nombre,
    cliente.cif ? `CIF/NIF: ${cliente.cif}` : "",
    cliente.direccion,
    cliente.contacto ? `Contacto: ${cliente.contacto}` : "",
    cliente.email,
    cliente.telefono ? `Tel: ${cliente.telefono}` : "",
  ].filter(Boolean);
  const clientTitleY = headerBottom + 34;
  const clientTextY = clientTitleY + 6;
  const tableStartY = clientTextY + clientLines.length * 5 + 10;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente", margin, clientTitleY);
  doc.setFont("helvetica", "normal");
  doc.text(clientLines, margin, clientTextY);

  doc.autoTable({
    startY: tableStartY,
    head: [
      ["Partida", "Producto", "Descripción", "Cant.", "P. unit.", "Subtotal"],
    ],
    body: selectedItems.map((item) => [
      item.partida,
      item.nombre,
      item.descripcion || "",
      item.cantidad,
      formatCurrency(item.precioUnitario),
      formatCurrency(item.subtotal),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [25, 113, 95],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.4,
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 34 },
      2: { cellWidth: 62 },
      3: { cellWidth: 14, halign: "right" },
      4: { cellWidth: 24, halign: "right" },
      5: { cellWidth: 24, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  const total = getTotalPresupuesto(selectedItems);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total presupuesto", 142, finalY);
  doc.text(formatCurrency(total), pageWidth - margin, finalY, {
    align: "right",
  });

  doc.setDrawColor(217, 226, 223);
  doc.line(142, finalY + 3, pageWidth - margin, finalY + 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Observaciones y condiciones comerciales", margin, finalY + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const condiciones = [
    cliente.observaciones,
    "Presupuesto sujeto a validación comercial y técnica.",
    "Los importes no incluyen impuestos salvo indicación expresa.",
    "La validez del presupuesto es de 30 días desde la fecha de emisión.",
  ].filter(Boolean);

  doc.text(condiciones, margin, finalY + 24, {
    maxWidth: pageWidth - margin * 2,
  });

  addPdfFooter(doc, budgetNumber);
  doc.save(`presupuesto-instalacion-${formatDateForFilename(budgetDate)}.pdf`);
  return true;
}

function updatePartidaSummary() {
  if (!activePartida) {
    partidaSummary.textContent = "";
    return;
  }

  partidaSummary.textContent = `Subtotal partida ${activePartida}: ${formatCurrency(
    getPartidaSubtotal(activePartida),
  )}`;
}

function updateTabSubtotals() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    const subtotalElement = button.querySelector(".tab-subtotal");
    subtotalElement.textContent = formatCurrency(
      getPartidaSubtotal(button.dataset.partida),
    );
  });
}

function setActivePartida(partida) {
  activePartida = partida;
  renderTabs();
  renderItems(getItemsByPartida(partida));
}

function createTab(partida) {
  const button = document.createElement("button");
  button.className = "tab-button";
  button.type = "button";
  button.setAttribute("role", "tab");
  button.dataset.partida = partida;
  button.setAttribute("aria-selected", partida === activePartida);

  const label = createTextElement("span", "tab-label", partida);
  const subtotal = createTextElement(
    "span",
    "tab-subtotal",
    formatCurrency(getPartidaSubtotal(partida)),
  );

  button.append(label, subtotal);
  button.addEventListener("click", () => setActivePartida(partida));
  return button;
}

function renderTabs() {
  partidaTabs.innerHTML = "";
  getPartidas().forEach((partida) => {
    partidaTabs.appendChild(createTab(partida));
  });
}

function renderItems(nextItems) {
  itemsList.innerHTML = "";

  nextItems.forEach((item, index) => {
    itemsList.appendChild(createItemRow(item, index));
  });

  updateTotals();
}

function resetQuantities() {
  items.forEach((item) => {
    quantities[item.id] = 0;
  });

  renderItems(getItemsByPartida(activePartida));
  updateTotals();
}

async function loadItems() {
  try {
    const response = await fetch("data/items.json");

    if (!response.ok) {
      throw new Error("No se ha podido cargar el fichero de items.");
    }

    items = normalizeItems(await response.json());
    quantities = Object.fromEntries(items.map((item) => [item.id, 0]));
    activePartida = getPartidas()[0] || "";

    renderTabs();
    renderItems(getItemsByPartida(activePartida));
  } catch (error) {
    itemsList.innerHTML = `<p class="error-message">${error.message}</p>`;
  }
}

resetButton.addEventListener("click", resetQuantities);
pdfButton.addEventListener("click", abrirWizardCliente);
wizardCloseButton.addEventListener("click", cerrarWizardCliente);
wizardCancelButton.addEventListener("click", cerrarWizardCliente);
wizardBackButton.addEventListener("click", () => setWizardStep(1));
wizardNextButton.addEventListener("click", () => {
  if (validateWizardClient()) {
    setWizardStep(2);
  }
});
clientWizard.addEventListener("click", (event) => {
  if (event.target === clientWizard) {
    cerrarWizardCliente();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !clientWizard.hidden) {
    cerrarWizardCliente();
  }
});
clientWizardForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (wizardCurrentStep === 1) {
    if (validateWizardClient()) {
      setWizardStep(2);
    }

    return;
  }

  if (!validateWizardClient()) {
    setWizardStep(1);
    return;
  }

  const pdfGenerado = await generarPDFPresupuesto(recogerDatosCliente());

  if (pdfGenerado) {
    cerrarWizardCliente();
  }
});
loadItems();
