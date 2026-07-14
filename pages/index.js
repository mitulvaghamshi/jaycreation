// JS Logic for Professional PDF Invoice Template B - Jay Creation
document.addEventListener('DOMContentLoaded', () => {
  const itemsBody = document.getElementById('invoice-items-body');

  // Action Buttons
  const btnReset = document.getElementById('btn-reset');
  const btnPrint = document.getElementById('btn-print');
  const btnAddRow = document.getElementById('btn-add-row');

  // QR Code Image Upload Elements
  const qrUploadBox = document.getElementById('qr-upload-box');
  const qrFileInput = document.getElementById('qr-file-input');
  const qrImage = document.getElementById('qr-image');
  const qrText = document.getElementById('qr-text');

  // PDF Prefill Data
  const defaultPrefill = {
    copyType: "DEX",
    deity: "!! Shree Ganeshaya Namah !!",
    companyName: "JAY CREATION",
    companyGst: "24AUYPK6789Q1Z5",
    companyUdyam: "GJ-05-0593906 (MICRO)",
    companyPan: "AUYPK6789Q",
    companyAddress: "224 3RD FLOOR BHAGYODAY INDUSTRIES, B/H DR WORLD AAI MATA ROAD, SURAT",
    companyPhone: "9275182042",
    buyerName: "",
    buyerAddress1: "",
    buyerAddress2: "",
    buyerAddress3: "",
    buyerGst: "",
    billNo: "",
    challanNo: "",
    billDate: "",
    orderNo: "",
    placeOfSupply: "",
    consigneeName: "",
    consigneeGst: "",
    agentName: "",
    agentPhone: "",
    agentAddress: "",
    lrNo: "",
    transportName: "",
    stationName: "",
    lrDate: "",
    caseNo: "",
    weightVal: "",
    freightVal: "",
    hsnVal: "",
    bankDetails: {
      name: "ICICI Bank",
      acno: "655705500241",
      ifsc: "ICIC0006557"
    },
    remark: "",
    cgstPercent: "2.50",
    sgstPercent: "2.50",
    dueDays: "",
    items: [
      {
        desc: "",
        packing: "",
        pcs: "",
        cut: "",
        mts: "",
        rate: "",
        per: "PCS"
      }
    ]
  };

  // --- QR Code Upload / Local Persistence ---

  // Load saved QR Code on start
  // const savedQR = localStorage.getItem('invoice-b-qrcode');
  // if (savedQR) {
  //   qrImage.src = savedQR;
  //   qrImage.style.display = 'block';
  //   qrText.style.display = 'none';
  // }

  qrUploadBox.addEventListener('click', () => {
    qrFileInput.click();
  });

  qrFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const base64Data = event.target.result;
        qrImage.src = base64Data;
        qrImage.style.display = 'block';
        qrText.style.display = 'none';
        // localStorage.setItem('invoice-b-qrcode', base64Data);
      };
      reader.readAsDataURL(file);
    }
  });

  // --- Print Invoice ---
  btnPrint.addEventListener('click', () => {
    const billNo = document.getElementById('bill-no').textContent.trim() || 'Draft';
    const buyerName = document.getElementById('buyer-name').textContent.trim() || 'Client';
    const originalTitle = document.title;

    document.title = `Invoice_${billNo}_${buyerName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    document.body.classList.add('printing');

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove('printing');
    }, 100);
  });

  // --- Reset Invoice Data ---
  btnReset.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all invoice data to default template values?')) {
      loadData(defaultPrefill);
      // Optional: Clear QR code local storage? No, let's keep the QR code if they uploaded one
    }
  });

  // --- Add New Item Row ---
  btnAddRow.addEventListener('click', () => {
    addNewRow();
  });

  // --- Event Delegation for Row calculations ---
  itemsBody.addEventListener('input', (e) => {
    const target = e.target;
    const row = target.closest('.item-row');
    if (!row) return;

    if (
      target.classList.contains('input-pcs') ||
      target.classList.contains('input-cut') ||
      target.classList.contains('input-rate') ||
      target.classList.contains('input-per')
    ) {
      recalculateRowAmount(row);
    }
  });

  itemsBody.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('delete-row-btn')) {
      const row = target.closest('.item-row');
      if (row) {
        const cells = Array.from(row.querySelectorAll('.table-cell-edit'));
        const hasContent = cells.some(cell => cell.textContent.trim().length > 0);
        if (!hasContent || confirm('Delete this invoice line item?')) {
          row.remove();
          recalculateTotals();
        }
      }
    }
  });

  // Watch tax percent fields and due days for recalculations
  document.getElementById('cgst-percent').addEventListener('input', recalculateTotals);
  document.getElementById('sgst-percent').addEventListener('input', recalculateTotals);

  // --- Core Calculations Logic ---

  function parseNumber(text, isFloat = false) {
    const cleanText = text.replace(/[^\d.-]/g, '');
    if (isFloat) {
      const val = parseFloat(cleanText);
      return isNaN(val) ? 0.0 : val;
    } else {
      const val = parseInt(cleanText, 10);
      return isNaN(val) ? 0 : val;
    }
  }

  function formatCurrency(amount) {
    // Standard Indian Currency formatting (e.g. 4,89,983.00)
    const str = amount.toFixed(2);
    const parts = str.split('.');
    let x = parts[0];
    const lastThree = x.substring(x.length - 3);
    const otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== '') {
      x = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    } else {
      x = lastThree;
    }
    return '₹' + x + '.' + parts[1];
  }

  function formatNumberIndian(val, decimals = 2) {
    const str = val.toFixed(decimals);
    const parts = str.split('.');
    let x = parts[0];
    const lastThree = x.substring(x.length - 3);
    const otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== '') {
      x = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    } else {
      x = lastThree;
    }
    return decimals > 0 ? (x + '.' + parts[1]) : x;
  }

  function recalculateRowAmount(row) {
    const pcsCell = row.querySelector('.input-pcs');
    const cutCell = row.querySelector('.input-cut');
    const mtsCell = row.querySelector('.input-mts');
    const rateCell = row.querySelector('.input-rate');
    const perCell = row.querySelector('.input-per');
    const amtCell = row.querySelector('.row-amount');

    const pcs = parseNumber(pcsCell.textContent);
    const cut = parseNumber(cutCell.textContent, true);

    // Rule: Mts = Pcs * Cut
    let mts = pcs * cut;
    if (pcs > 0 && cut > 0) {
      mtsCell.textContent = formatNumberIndian(mts, 2);
    } else {
      // If Cut is empty but they manually entered Mts, parse it
      mts = parseNumber(mtsCell.textContent, true);
    }

    const rate = parseNumber(rateCell.textContent, true);
    const per = perCell.textContent.trim().toUpperCase();

    let amount = 0.0;
    if (per === 'MTS' || per === 'MTR' || per === 'METER' || per === 'METERS') {
      amount = mts * rate;
    } else {
      // Default is PCS
      amount = pcs * rate;
    }

    amtCell.textContent = formatNumberIndian(amount, 2);
    recalculateTotals();
  }

  function recalculateTotals() {
    const rows = Array.from(itemsBody.querySelectorAll('.item-row'));

    let totalPcs = 0;
    let totalMts = 0.0;
    let totalTaxable = 0.0;

    rows.forEach(row => {
      const pcsCell = row.querySelector('.input-pcs');
      const mtsCell = row.querySelector('.input-mts');
      const amtCell = row.querySelector('.row-amount');

      totalPcs += parseNumber(pcsCell.textContent);
      totalMts += parseNumber(mtsCell.textContent, true);
      totalTaxable += parseNumber(amtCell.textContent, true);
    });

    // Update Subtotal elements
    document.getElementById('subtotal-pcs').textContent = totalPcs > 0 ? totalPcs : '';
    document.getElementById('subtotal-mts').textContent = totalMts > 0 ? formatNumberIndian(totalMts, 2) : '';
    document.getElementById('subtotal-amount').textContent = formatCurrency(totalTaxable);

    // Compute Tax
    const cgstPercent = parseNumber(document.getElementById('cgst-percent').textContent, true);
    const sgstPercent = parseNumber(document.getElementById('sgst-percent').textContent, true);

    const cgstAmount = totalTaxable * (cgstPercent / 100);
    const sgstAmount = totalTaxable * (sgstPercent / 100);

    document.getElementById('cgst-val').textContent = formatCurrency(cgstAmount);
    document.getElementById('sgst-val').textContent = formatCurrency(sgstAmount);

    // Grand Total
    const grandTotal = totalTaxable + cgstAmount + sgstAmount;

    // PDF Grand Total rounding match (In India, invoices usually round to nearest whole rupee)
    const roundedGrandTotal = Math.round(grandTotal);

    document.getElementById('grand-total-val').textContent = formatCurrency(roundedGrandTotal);

    // Update Words Total
    document.getElementById('grand-total-words').textContent = convertNumberToWords(roundedGrandTotal);
  }

  function addNewRow(data = { desc: "", packing: "", pcs: "", cut: "", mts: "", rate: "", per: "PCS" }) {
    // Remove spacer row if it exists
    const existingSpacer = itemsBody.querySelector('.spacer-row');
    if (existingSpacer) {
      existingSpacer.remove();
    }

    const tr = document.createElement('tr');
    tr.className = 'item-row';

    const pcsDisplay = data.pcs !== "" && data.pcs !== undefined ? data.pcs : "";
    const cutDisplay = data.cut !== "" && data.cut !== undefined ? (typeof data.cut === 'number' ? data.cut.toFixed(2) : data.cut) : "";

    let mts = 0.0;
    if (typeof data.pcs === 'number' && typeof data.cut === 'number') {
      mts = data.pcs * data.cut;
    } else {
      mts = data.mts !== "" && data.mts !== undefined ? parseNumber(String(data.mts), true) : 0.0;
    }
    const mtsDisplay = mts > 0 ? formatNumberIndian(mts, 2) : "";

    const rateDisplay = data.rate !== "" && data.rate !== undefined ? (typeof data.rate === 'number' ? data.rate.toFixed(2) : data.rate) : "";

    let amt = 0.0;
    if (data.per.toUpperCase() === 'MTS' || data.per.toUpperCase() === 'MTR') {
      amt = mts * parseNumber(String(rateDisplay), true);
    } else {
      amt = parseNumber(String(pcsDisplay)) * parseNumber(String(rateDisplay), true);
    }
    const amtDisplay = amt > 0 ? formatNumberIndian(amt, 2) : "0.00";

    tr.innerHTML = `
      <td class="col-desc"><div class="table-cell-edit text-left" contenteditable="true" placeholder="Item/Design Name">${data.desc}</div></td>
      <td class="col-pack"><div class="table-cell-edit text-center" contenteditable="true" placeholder="-">${data.packing}</div></td>
      <td class="col-pcs"><div class="table-cell-edit text-right input-pcs" contenteditable="true" inputmode="numeric" placeholder="0">${pcsDisplay}</div></td>
      <td class="col-cut"><div class="table-cell-edit text-right input-cut" contenteditable="true" inputmode="decimal" placeholder="0.00">${cutDisplay}</div></td>
      <td class="col-mts"><div class="table-cell-edit text-right input-mts" contenteditable="true" inputmode="decimal" placeholder="0.00">${mtsDisplay}</div></td>
      <td class="col-rate"><div class="table-cell-edit text-right input-rate" contenteditable="true" inputmode="decimal" placeholder="0.00">${rateDisplay}</div></td>
      <td class="col-per"><div class="table-cell-edit text-center input-per" contenteditable="true" placeholder="PCS">${data.per}</div></td>
      <td class="col-amt text-right" style="position: relative; font-weight: bold;">
        <span class="row-amount">${amtDisplay}</span>
        <button class="delete-row-btn no-print" title="Delete Row">&times;</button>
      </td>
    `;
    itemsBody.appendChild(tr);

    // Append spacer row to take up remaining vertical space
    appendSpacerRow();
    recalculateTotals();
  }

  function appendSpacerRow() {
    // If spacer row already exists, remove it first
    const existing = itemsBody.querySelector('.spacer-row');
    if (existing) {
      existing.remove();
    }

    const tr = document.createElement('tr');
    tr.className = 'spacer-row';
    tr.innerHTML = `
      <td class="col-desc"></td>
      <td class="col-pack"></td>
      <td class="col-pcs"></td>
      <td class="col-cut"></td>
      <td class="col-mts"></td>
      <td class="col-rate"></td>
      <td class="col-per"></td>
      <td class="col-amt"></td>
    `;
    itemsBody.appendChild(tr);
  }

  // --- Indian English Currency Number to Words ---
  function convertNumberToWords(amount) {
    const num = Math.round(amount);
    if (num === 0) return "ZERO RUPEES ONLY";

    const units = [
      "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
      "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"
    ];
    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

    function helper(n) {
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
      if (n < 1000) return units[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " " + helper(n % 100) : "");
      return "";
    }

    let remaining = num;
    let result = "";

    // Crores (10,00,00,000)
    if (remaining >= 10000000) {
      result += helper(Math.floor(remaining / 10000000)) + " CRORE ";
      remaining %= 10000000;
    }
    // Lakhs (1,00,000)
    if (remaining >= 100000) {
      result += helper(Math.floor(remaining / 100000)) + " LAKH ";
      remaining %= 100000;
    }
    // Thousands (1,000)
    if (remaining >= 1000) {
      result += helper(Math.floor(remaining / 1000)) + " THOUSAND ";
      remaining %= 1000;
    }
    // Remaining (Hundreds, Tens, Ones)
    if (remaining > 0) {
      result += helper(remaining);
    }

    return (result.trim().replace(/\s+/g, ' ') + " ONLY");
  }

  // --- Load Full Dataset ---
  function loadData(data) {
    document.getElementById('copy-type-label').textContent = data.copyType;
    document.getElementById('company-name').textContent = data.companyName;
    document.getElementById('company-gst').textContent = data.companyGst;
    document.getElementById('company-udyam').textContent = data.companyUdyam;
    document.getElementById('company-pan').textContent = data.companyPan;
    document.getElementById('company-address').textContent = data.companyAddress;
    document.getElementById('company-phone').textContent = data.companyPhone;

    document.getElementById('buyer-name').textContent = data.buyerName;
    document.getElementById('buyer-address').textContent = data.buyerAddress1;
    document.getElementById('buyer-address-2').textContent = data.buyerAddress2;
    document.getElementById('buyer-address-3').textContent = data.buyerAddress3;
    document.getElementById('buyer-gst').textContent = data.buyerGst;

    document.getElementById('bill-no').textContent = data.billNo;
    document.getElementById('challan-no').textContent = data.challanNo;
    document.getElementById('bill-date').textContent = data.billDate;
    document.getElementById('order-no').textContent = data.orderNo;
    document.getElementById('place-of-supply').textContent = data.placeOfSupply;

    document.getElementById('consignee-name').textContent = data.consigneeName;
    document.getElementById('consignee-gst').textContent = data.consigneeGst;

    document.getElementById('agent-name').textContent = data.agentName;
    document.getElementById('agent-phone').textContent = data.agentPhone;
    document.getElementById('agent-address').textContent = data.agentAddress;

    document.getElementById('lr-no').textContent = data.lrNo;
    document.getElementById('transport-name').textContent = data.transportName;
    document.getElementById('station-name').textContent = data.stationName;
    document.getElementById('lr-date').textContent = data.lrDate;
    document.getElementById('case-no').textContent = data.caseNo;
    document.getElementById('weight-val').textContent = data.weightVal;
    document.getElementById('freight-val').textContent = data.freightVal;
    document.getElementById('hsn-val').textContent = data.hsnVal;

    document.getElementById('bank-details-name').textContent = data.bankDetails.name;
    document.getElementById('bank-details-acno').textContent = data.bankDetails.acno;
    document.getElementById('bank-details-ifsc').textContent = data.bankDetails.ifsc;
    document.getElementById('remark-text').textContent = data.remark;

    document.getElementById('cgst-percent').textContent = data.cgstPercent;
    document.getElementById('sgst-percent').textContent = data.sgstPercent;
    document.getElementById('due-days').textContent = data.dueDays;

    // Clear and build items
    itemsBody.innerHTML = '';
    data.items.forEach(item => {
      addNewRow(item);
    });

    recalculateTotals();
  }

  // Pre-load initial default data
  loadData(defaultPrefill);
});
