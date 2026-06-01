const itemsList = document.querySelector("#items-list");
const partidaTabs = document.querySelector("#partida-tabs");
const partidaSummary = document.querySelector("#partida-summary");
const totalUnitsElement = document.querySelector("#total-units");
const totalPriceElement = document.querySelector("#total-price");
const resetButton = document.querySelector("#reset-button");

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

let items = [];
let activePartida = "";
let quantities = {};

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

function getPartidaSubtotal(partida) {
  return getItemsByPartida(partida).reduce(
    (subtotal, item) => subtotal + getItemSubtotal(item),
    0
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
    const subtotalElement = input.closest(".item-row").querySelector(".subtotal");

    input.value = getQuantity(input.dataset.itemId);

    if (item && subtotalElement) {
      subtotalElement.textContent = formatCurrency(getItemSubtotal(item));
    }
  });

  totalUnitsElement.textContent = totalUnits;
  totalPriceElement.textContent = formatCurrency(totalPrice);
  updatePartidaSummary();
  updateTabSubtotals();
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createItemInfo(item) {
  const itemInfo = document.createElement("div");
  itemInfo.className = "item-info";
  itemInfo.setAttribute("role", "cell");

  itemInfo.appendChild(createTextElement("span", "item-name", item.nombre));

  if (item.descripcion) {
    itemInfo.appendChild(
      createTextElement("span", "item-description", item.descripcion)
    );
  }

  return itemInfo;
}

function createItemRow(item, index) {
  const row = document.createElement("div");
  row.className = "table-row item-row";
  row.setAttribute("role", "row");

  const price = Number(item.precio) || 0;
  const priceElement = createTextElement("span", "price", formatCurrency(price));
  priceElement.setAttribute("role", "cell");

  const quantityLabel = document.createElement("label");
  quantityLabel.className = "quantity-field";
  quantityLabel.setAttribute("role", "cell");

  const hiddenLabel = createTextElement(
    "span",
    "sr-only",
    `Cantidad para ${item.nombre}`
  );

  const quantityInput = document.createElement("input");
  quantityInput.className = "quantity-input";
  quantityInput.type = "number";
  quantityInput.min = "0";
  quantityInput.step = "1";
  quantityInput.value = getQuantity(item.id);
  quantityInput.inputMode = "numeric";
  quantityInput.dataset.itemId = item.id;

  const subtotalElement = createTextElement("span", "subtotal", formatCurrency(0));
  subtotalElement.dataset.itemId = item.id;
  subtotalElement.setAttribute("role", "cell");

  quantityLabel.append(hiddenLabel, quantityInput);
  row.append(createItemInfo(item), priceElement, quantityLabel, subtotalElement);

  row.querySelector(".quantity-input").addEventListener("input", (event) => {
    const quantity = Math.max(0, Math.floor(Number(event.target.value) || 0));
    quantities[item.id] = quantity;
    event.target.value = quantity;
    updateTotals();
  });

  return row;
}

function updatePartidaSummary() {
  if (!activePartida) {
    partidaSummary.textContent = "";
    return;
  }

  partidaSummary.textContent = `Subtotal partida ${activePartida}: ${formatCurrency(
    getPartidaSubtotal(activePartida)
  )}`;
}

function updateTabSubtotals() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    const subtotalElement = button.querySelector(".tab-subtotal");
    subtotalElement.textContent = formatCurrency(getPartidaSubtotal(button.dataset.partida));
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
    formatCurrency(getPartidaSubtotal(partida))
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
loadItems();
