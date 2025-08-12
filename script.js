let entries = [];
let entryIdCounter = 1;

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("entryDate").value = new Date()
    .toISOString()
    .split("T")[0];

  document.querySelector(".btn-submit").addEventListener("click", submitEntry);

  loadDataFromStorage();
  updateTotals();
  displayEntries();
});

function addExpenseItem() {
  const expensesList = document.getElementById("expensesList");
  const expenseItem = document.createElement("div");
  expenseItem.className = "expense-item";

  expenseItem.innerHTML = `
        <input type="text" class="expense-description" placeholder="e.g., Food, Transport, Bills...">
        <input type="number" class="expense-amount" placeholder="0.00" step="0.01" min="0">
        <button type="button" class="remove-expense" onclick="removeExpense(this)">×</button>
    `;

  expensesList.append(expenseItem);

  updateRemoveButtons();
}

function removeExpense(button) {
  const expenseItem = button.parentElement;
  expenseItem.remove();
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const expenseItems = document.querySelectorAll(".expense-item");
  const removeButtons = document.querySelectorAll(".remove-expense");

  removeButtons.forEach((button, index) => {
    button.style.display = expenseItems.length > 1 ? "block" : "none";
  });
}

function submitEntry() {
  const entryDate = document.getElementById("entryDate").value;
  const incomeDescription = document
    .getElementById("incomeDescription")
    .value.trim();
  const incomeAmount =
    parseFloat(document.getElementById("incomeAmount").value) || 0;

  const expenseItems = document.querySelectorAll(".expense-item");
  const expenses = [];

  expenseItems.forEach((item) => {
    const description = item.querySelector(".expense-description").value.trim();
    const amount = parseFloat(item.querySelector(".expense-amount").value) || 0;

    if (description && amount > 0) {
      expenses.push({
        description: description,
        amount: amount,
      });
    }
  });

  // Validation
  if (!entryDate) {
    alert("Please select a date");
    return;
  }

  if (incomeAmount === 0 && expenses.length === 0) {
    alert("Please add at least one income or expense entry");
    return;
  }

  if (incomeAmount > 0 && !incomeDescription) {
    alert("Please provide income description");
    return;
  }

  const newEntry = {
    id: entryIdCounter++,
    date: entryDate,
    income: {
      description: incomeDescription,
      amount: incomeAmount,
    },
    expenses: expenses,
    totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
  };

  entries.push(newEntry);

  updateTotals();
  displayEntries();
  clearForm();

  saveDataToStorage();

  showMessage("Entry added successfully!", "success");
}

function clearForm() {
  document.getElementById("incomeDescription").value = "";
  document.getElementById("incomeAmount").value = "";

  const expensesList = document.getElementById("expensesList");
  const firstExpenseItem = expensesList.querySelector(".expense-item");

  firstExpenseItem.querySelector(".expense-description").value = "";
  firstExpenseItem.querySelector(".expense-amount").value = "";

  const expenseItems = expensesList.querySelectorAll(".expense-item");
  for (let i = 1; i < expenseItems.length; i++) {
    expenseItems[i].remove();
  }

  updateRemoveButtons();
}

function updateTotals() {
  const totalIncome = entries.reduce(
    (sum, entry) => sum + entry.income.amount,
    0
  );
  const totalExpenses = entries.reduce(
    (sum, entry) => sum + entry.totalExpenses,
    0
  );
  const totalBalance = totalIncome - totalExpenses;

  document.getElementById("totalIncome").textContent = `₹${totalIncome.toFixed(
    2
  )}`;
  document.getElementById(
    "totalExpense"
  ).textContent = `₹${totalExpenses.toFixed(2)}`;
  document.getElementById(
    "totalBalance"
  ).textContent = `₹${totalBalance.toFixed(2)}`;

  const balanceElement = document.getElementById("totalBalance");
  balanceElement.className =
    totalBalance >= 0 ? "amount positive" : "amount negative";
}

function displayEntries() {
  const entriesGrid = document.getElementById("entriesGrid");
  const entriesCount = document.getElementById("entriesCount");

  entriesCount.textContent = `${entries.length} ${
    entries.length === 1 ? "entry" : "entries"
  }`;

  entriesGrid.innerHTML = "";

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedEntries.forEach((entry) => {
    const entryCard = createEntryCard(entry);
    entriesGrid.append(entryCard);
  });
}

function createEntryCard(entry) {
  const entryDiv = document.createElement("div");
  entryDiv.className = "entry-card";
  entryDiv.dataset.entryId = entry.id;

  const formattedDate = new Date(entry.date).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  let expensesHtml = "";
  if (entry.expenses.length > 0) {
    expensesHtml = entry.expenses
      .map(
        (expense) =>
          `<div class="expense-detail">
                <span class="expense-desc">${expense.description}</span>
                <span class="expense-amt">₹${expense.amount.toFixed(2)}</span>
            </div>`
      )
      .join("");
  }

  const netAmount = entry.income.amount - entry.totalExpenses;
  const netClass = netAmount >= 0 ? "positive" : "negative";

  entryDiv.innerHTML = `
        <div class="entry-header">
            <div class="entry-date">${formattedDate}</div>
            <button class="delete-entry" onclick="deleteEntry(${entry.id})">
                <span>❌</span>
            </button>
        </div>
        
        ${
          entry.income.amount > 0
            ? `
        <div class="income-detail">
            <div class="income-label">Income</div>
            <div class="income-desc">${entry.income.description}</div>
            <div class="income-amount">+₹${entry.income.amount.toFixed(2)}</div>
        </div>`
            : ""
        }
        
        ${
          entry.expenses.length > 0
            ? `
        <div class="expenses-detail">
            <div class="expenses-label">Expenses</div>
            ${expensesHtml}
            <div class="expenses-total">Total: ₹${entry.totalExpenses.toFixed(
              2
            )}</div>
        </div>`
            : ""
        }
        
        <div class="entry-net">
            <div class="net-label">Net</div>
            <div class="net-amount ${netClass}">${
    netAmount >= 0 ? "+" : ""
  }₹${netAmount.toFixed(2)}</div>
        </div>
    `;

  return entryDiv;
}

function deleteEntry(entryId) {
  if (confirm("Are you sure you want to delete this entry?")) {
    entries = entries.filter((entry) => entry.id !== entryId);
    updateTotals();
    displayEntries();
    saveDataToStorage();
    showMessage("Entry deleted successfully!", "success");
  }
}

function saveDataToStorage() {
  localStorage.setItem(
    "incomeExpenseData",
    JSON.stringify({
      entries: entries,
      entryIdCounter: entryIdCounter,
    })
  );
}

function loadDataFromStorage() {
  const savedData = localStorage.getItem("incomeExpenseData");
  if (savedData) {
    const data = JSON.parse(savedData);
    entries = data.entries || [];
    entryIdCounter = data.entryIdCounter || 1;
  }
}

function showMessage(message, type) {
  // Remove existing messages
  const existingMessage = document.querySelector(".message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;

  document
    .querySelector(".container")
    .insertBefore(messageDiv, document.querySelector(".balance-section"));

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}
