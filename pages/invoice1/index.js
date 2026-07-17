// Invoice Generator JS Logic - Jay Creation
document.addEventListener("DOMContentLoaded", () => {
  const invoicePage = document.getElementById("invoice-page");
  const itemsBody = document.getElementById("invoice-items-body");

  // Buttons
  const btnTheme = document.getElementById("btn-theme");
  const btnPrint = document.getElementById("btn-print");
  const btnReset = document.getElementById("btn-reset");
  const btnAddRow = document.getElementById("btn-add-row");

  // Data to restore on Reset
  const prefillData = {
    companyGst: "24AUYPK6789Q1Z5",
    companyPhone: "92751 82042",
    companyName: "JAY CREATION",
    companySubtitle: "All Type of : Embroidery & Sequence Works",
    companyAddress: "224, 3rd Floor, Bhagyoday Industries, B/H. DR World, Aai Mata Road, Surat.",
    clientName: "",
    clientAddress: "",
    clientGst: "",
    billNo: "",
    billDate: "",
    challanNo: "",
    companyPan: "AUYPK6789Q",
    bankName: "ICICI Bank",
    bankAc: "655705500241",
    bankIfsc: "ICIC0006557",
    cgstPercent: "2.5",
    sgstPercent: "2.5",
    items: [{ cha: "", date: "", particulars: "", pieces: "", rate: "" }],
  };

  // --- Theme Toggle ---
  btnTheme.addEventListener("click", () => {
    if (invoicePage.classList.contains("classic-red")) {
      invoicePage.classList.remove("classic-red");
      invoicePage.classList.add("clean-white");
    } else {
      invoicePage.classList.remove("clean-white");
      invoicePage.classList.add("classic-red");
    }
  });

  // --- Print / Save PDF ---
  btnPrint.addEventListener("click", () => {
    // Set document title to Invoice_{BillNo} for clean PDF saving name
    const billNo = document.getElementById("bill-no").textContent.trim() || "Draft";
    const clientName = document.getElementById("client-name").textContent.trim() || "Client";
    const originalTitle = document.title;

    document.title = `Invoice_${billNo}_${clientName.replace(/[^a-zA-Z0-9]/g, "_")}`;

    // Add print class to body for extra control if needed
    document.body.classList.add("printing");

    window.print();

    // Restore original title and remove class after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove("printing");
    }, 100);
  });

  // --- Reset Data ---
  btnReset.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all fields data?")) {
      loadData(prefillData);
    }
  });

  // --- Add New Item Row ---
  btnAddRow.addEventListener("click", () => {
    addNewRow();
  });

  // --- Event Delegation for Table inputs & Delete row buttons ---
  itemsBody.addEventListener("input", (e) => {
    const target = e.target;
    if (target.classList.contains("input-pieces") || target.classList.contains("input-rate")) {
      const row = target.closest(".item-row");
      recalculateRowAmount(row);
    }
  });

  // Handle clicking the delete row button
  itemsBody.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("btn-delete-row")) {
      const row = target.closest(".item-row");

      // If row has some content, ask for confirmation
      const hasContent = Array.from(row.querySelectorAll('[contenteditable="true"]'))
        .some((cell) => cell.textContent.trim().length > 0);

      if (!hasContent || confirm("Delete this row?")) {
        row.remove();
        recalculateTotals();
      }
    }
  });

  // Recalculate totals on tax percent edits
  document.getElementById("cgst-percent").addEventListener("input", recalculateTotals);
  document.getElementById("sgst-percent").addEventListener("input", recalculateTotals);

  // --- Core Calculation Functions ---

  function parseNumber(text, isFloat = false) {
    // Strip everything except digits, dots and minus
    const cleanText = text.replace(/[^\d.-]/g, "");
    if (isFloat) {
      const val = parseFloat(cleanText);
      return isNaN(val) ? 0.0 : val;
    } else {
      const val = parseInt(cleanText, 10);
      return isNaN(val) ? 0 : val;
    }
  }

  function recalculateRowAmount(row) {
    const piecesCell = row.querySelector(".input-pieces");
    const rateCell = row.querySelector(".input-rate");
    const amountSpan = row.querySelector(".row-amount");

    const pieces = parseNumber(piecesCell.textContent);
    const rate = parseNumber(rateCell.textContent, true);
    const amount = pieces * rate;

    amountSpan.textContent = `₹${amount.toFixed(2)}`;
    recalculateTotals();
  }

  function recalculateTotals() {
    const rowAmounts = Array.from(itemsBody.querySelectorAll(".row-amount"))
      .map((span) => parseFloat(span.textContent.substring(1)) || 0.0);

    const subtotal = rowAmounts.reduce((sum, val) => sum + val, 0.0);
    document.getElementById("taxable-amount").textContent = subtotal.toFixed(2);

    const cgstPercent = parseNumber(document.getElementById("cgst-percent").textContent, true);
    const sgstPercent = parseNumber(document.getElementById("sgst-percent").textContent, true);

    const cgstAmount = subtotal * (cgstPercent / 100);
    const sgstAmount = subtotal * (sgstPercent / 100);

    document.getElementById("cgst-amount").textContent = cgstAmount.toFixed(2);
    document.getElementById("sgst-amount").textContent = sgstAmount.toFixed(2);

    const grandTotal = subtotal + cgstAmount + sgstAmount;
    document.getElementById("grand-total").textContent = grandTotal.toFixed(2);
  }

  function addNewRow(data = { cha: "", date: "", particulars: "", pieces: "", rate: "" }) {
    const tr = document.createElement("tr");
    tr.className = "item-row";

    const piecesDisplay = data.pieces !== "" ? data.pieces : "";
    const rateDisplay = data.rate !== "" ? (typeof data.rate === "number" ? data.rate.toFixed(1) : data.rate) : "";
    const amountVal = parseNumber(String(piecesDisplay)) * parseNumber(String(rateDisplay), true);
    const amountDisplay = amountVal > 0 ? amountVal.toFixed(2) : "0.00";

    tr.innerHTML = `
      <td><div class="table-input" contenteditable="true" placeholder="...">${data.cha}</div></td>
      <td><div class="table-input" contenteditable="true" placeholder="...">${data.date}</div></td>
      <td><div class="table-input text-left" contenteditable="true" placeholder="Design No / Particulars / Item Name">${data.particulars}</div></td>
      <td><div class="table-input input-pieces" contenteditable="true" inputmode="numeric" placeholder="0">${piecesDisplay}</div></td>
      <td><div class="table-input input-rate" contenteditable="true" inputmode="decimal" placeholder="0.00">${rateDisplay}</div></td>
      <td class="amount-cell">
        <span class="row-amount">₹${amountDisplay}</span>
        <button class="btn-delete-row no-print" title="Delete Row">&times;</button>
      </td>
    `;
    itemsBody.appendChild(tr);
  }

  // --- Load Data Set ---
  function loadData(data) {
    document.getElementById("company-gst").textContent = data.companyGst;
    document.getElementById("company-phone").textContent = data.companyPhone;
    document.getElementById("company-name").textContent = data.companyName;
    document.getElementById("company-subtitle").textContent = data.companySubtitle;
    document.getElementById("company-address").textContent = data.companyAddress;
    document.getElementById("client-name").textContent = data.clientName;
    document.getElementById("client-address").textContent = data.clientAddress;
    document.getElementById("client-gst").textContent = data.clientGst;
    document.getElementById("bill-no").textContent = data.billNo;
    document.getElementById("bill-date").textContent = data.billDate;
    document.getElementById("challan-no").textContent = data.challanNo;
    document.getElementById("company-pan").textContent = data.companyPan;
    document.getElementById("bank-name").textContent = data.bankName;
    document.getElementById("bank-ac").textContent = data.bankAc;
    document.getElementById("bank-ifsc").textContent = data.bankIfsc;
    document.getElementById("cgst-percent").textContent = data.cgstPercent;
    document.getElementById("sgst-percent").textContent = data.sgstPercent;

    // Clear existing table rows
    itemsBody.innerHTML = "";

    // Add sample rows
    data.items.forEach((item) => {
      addNewRow(item);
    });

    recalculateTotals();
  }

  // Load data initially if not already edited
  loadData(prefillData);
});
