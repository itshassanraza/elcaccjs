


let cashCurrentPage = 1;
let cashPageSize = 20;
let cashTotalTransactions = 0;
let cashFilteredTransactions = [];


let bankCurrentPage = 1;
let bankPageSize = 20;
let bankTotalTransactions = 0;
let bankFilteredTransactions = [];


let receivableCurrentPage = 1;
let receivablePageSize = 20;
let receivableTotalItems = 0;
let receivableFilteredItems = [];


let payableCurrentPage = 1;
let payablePageSize = 20;
let payableTotalItems = 0;
let payableFilteredItems = [];




async function loadCashLedger() {
    try {
        console.log('Loading cash ledger data');


        const cashTransactions = await window.dbService.getCashTransactions() || [];


        cashFilteredTransactions = cashTransactions;
        cashTotalTransactions = cashFilteredTransactions.length;


        updateCashSummary(cashTransactions);


        renderCashLedgerTable();


        setupCashPaginationControls();


        const today = window.utils.getTodayDate();

        const thirtyDaysAgo = window.utils.getDateDaysAgo(30);

        const startDateInput = document.getElementById('filter-date-start');
        const endDateInput = document.getElementById('filter-date-end');

        if (startDateInput && !startDateInput.value) startDateInput.value = thirtyDaysAgo;
        if (endDateInput && !endDateInput.value) endDateInput.value = today;
    } catch (error) {
        console.error('Failed to load cash ledger data:', error);
        window.utils.showNotification('Failed to load cash ledger data', 'error');
    }
}

function updateCashSummary(cashTransactions) {

    cashTransactions = cashTransactions || [];
    const totalCashIn = cashTransactions.reduce((sum, tx) => sum + (tx.cashIn || 0), 0);
    const totalCashOut = cashTransactions.reduce((sum, tx) => sum + (tx.cashOut || 0), 0);
    const cashBalance = totalCashIn - totalCashOut;


    const cashBalanceEl = document.getElementById('cash-balance');
    const cashInEl = document.getElementById('cash-in');
    const cashOutEl = document.getElementById('cash-out');

    if (cashBalanceEl) cashBalanceEl.textContent = window.utils.formatCurrency(cashBalance);
    if (cashInEl) cashInEl.textContent = window.utils.formatCurrency(totalCashIn);
    if (cashOutEl) cashOutEl.textContent = window.utils.formatCurrency(totalCashOut);
}

function renderCashLedgerTable() {
    const ledgerBody = document.getElementById('cash-ledger-body');
    if (!ledgerBody) return;

    ledgerBody.innerHTML = '';

    if (!cashFilteredTransactions || cashFilteredTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="px-4 py-2 text-center text-gray-500">No transactions found</td>
        `;
        ledgerBody.appendChild(row);
        return;
    }


    const sortedTransactions = [...cashFilteredTransactions].sort((a, b) => {

        const dateComparison = new Date(b.date) - new Date(a.date);


        if (dateComparison === 0 && a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }

        return dateComparison;
    });


    const startIndex = (cashCurrentPage - 1) * cashPageSize;
    const endIndex = Math.min(startIndex + cashPageSize, sortedTransactions.length);
    const currentPageItems = sortedTransactions.slice(startIndex, endIndex);


    let runningBalance = 0;
    if (startIndex > 0) {

        for (let i = 0; i < startIndex; i++) {
            runningBalance += (sortedTransactions[i].cashIn || 0) - (sortedTransactions[i].cashOut || 0);
        }
    }

    currentPageItems.forEach(tx => {

        runningBalance += (tx.cashIn || 0) - (tx.cashOut || 0);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${tx.date}</td>
            <td class="px-4 py-2">${tx.description || 'N/A'}</td>
            <td class="px-4 py-2">${tx.reference || '-'}</td>
            <td class="px-4 py-2 text-green-600">${tx.cashIn > 0 ? window.utils.formatCurrency(tx.cashIn) : '-'}</td>
            <td class="px-4 py-2 text-red-600">${tx.cashOut > 0 ? window.utils.formatCurrency(tx.cashOut) : '-'}</td>
            <td class="px-4 py-2 font-semibold">${window.utils.formatCurrency(runningBalance)}</td>
        `;
        ledgerBody.appendChild(row);
    });
}


function setupCashPaginationControls() {
    const container = document.getElementById('cash-pagination-controls');
    if (!container) return;

    container.innerHTML = '';


    const totalPages = Math.ceil(cashTotalTransactions / cashPageSize);


    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = `px-3 py-1 rounded ${cashCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    prevButton.disabled = cashCurrentPage === 1;
    if (cashCurrentPage > 1) {
        prevButton.addEventListener('click', () => {
            cashCurrentPage--;
            renderCashLedgerTable();
            setupCashPaginationControls();
        });
    }
    container.appendChild(prevButton);


    const maxPageButtons = 5;
    let startPage = Math.max(1, cashCurrentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 mx-1 rounded ${i === cashCurrentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`;
        if (i !== cashCurrentPage) {
            pageButton.addEventListener('click', () => {
                cashCurrentPage = i;
                renderCashLedgerTable();
                setupCashPaginationControls();
            });
        }
        container.appendChild(pageButton);
    }


    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = `px-3 py-1 rounded ${cashCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    nextButton.disabled = cashCurrentPage === totalPages;
    if (cashCurrentPage < totalPages) {
        nextButton.addEventListener('click', () => {
            cashCurrentPage++;
            renderCashLedgerTable();
            setupCashPaginationControls();
        });
    }
    container.appendChild(nextButton);


    const pageSizeElement = document.getElementById('cash-page-size');
    if (pageSizeElement) {
        pageSizeElement.addEventListener('change', function () {
            cashPageSize = parseInt(this.value);
            cashCurrentPage = 1;
            renderCashLedgerTable();
            setupCashPaginationControls();
        });
    }
}
async function addCashTransaction(transaction) {
    try {

        transaction.createdAt = new Date().toISOString();


        await window.dbService.addCashTransaction(transaction);


        await loadCashLedger();


        window.utils.showNotification('Cash transaction added successfully', 'success');
    } catch (error) {
        console.error('Error adding cash transaction:', error);
        window.utils.showNotification('Failed to add cash transaction', 'error');
    }
}


async function loadBankLedger() {
    try {
        console.log('Loading bank ledger data');


        const bankTransactions = await window.dbService.getBankTransactions() || [];


        bankFilteredTransactions = bankTransactions;
        bankTotalTransactions = bankFilteredTransactions.length;


        updateBankSummary(bankTransactions);


        renderBankLedgerTable();


        setupBankPaginationControls();


        const today = window.utils.getTodayDate();

        const thirtyDaysAgo = window.utils.getDateDaysAgo(30);

        const startDateInput = document.getElementById('filter-date-start');
        const endDateInput = document.getElementById('filter-date-end');

        if (startDateInput && !startDateInput.value) startDateInput.value = thirtyDaysAgo;
        if (endDateInput && !endDateInput.value) endDateInput.value = today;
    } catch (error) {
        console.error('Failed to load bank ledger data:', error);
        window.utils.showNotification('Failed to load bank ledger data', 'error');
    }
}

function updateBankSummary(bankTransactions) {

    bankTransactions = bankTransactions || [];
    const totalDeposits = bankTransactions.reduce((sum, tx) => sum + (tx.deposit || 0), 0);
    const totalWithdrawals = bankTransactions.reduce((sum, tx) => sum + (tx.withdrawal || 0), 0);
    const bankBalance = totalDeposits - totalWithdrawals;


    const bankBalanceEl = document.getElementById('bank-balance');
    const totalDepositsEl = document.getElementById('total-deposits');
    const totalWithdrawalsEl = document.getElementById('total-withdrawals');

    if (bankBalanceEl) bankBalanceEl.textContent = window.utils.formatCurrency(bankBalance);
    if (totalDepositsEl) totalDepositsEl.textContent = window.utils.formatCurrency(totalDeposits);
    if (totalWithdrawalsEl) totalWithdrawalsEl.textContent = window.utils.formatCurrency(totalWithdrawals);
}

function renderBankLedgerTable() {
    const ledgerBody = document.getElementById('bank-ledger-body');
    if (!ledgerBody) return;

    ledgerBody.innerHTML = '';

    if (!bankFilteredTransactions || bankFilteredTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="6" class="px-4 py-2 text-center text-gray-500">No transactions found</td>
      `;
        ledgerBody.appendChild(row);
        return;
    }


    const sortedTransactions = [...bankFilteredTransactions].sort((a, b) => {

        const dateComparison = new Date(b.date) - new Date(a.date);


        if (dateComparison === 0 && a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }

        return dateComparison;
    });


    const startIndex = (bankCurrentPage - 1) * bankPageSize;
    const endIndex = Math.min(startIndex + bankPageSize, sortedTransactions.length);
    const currentPageItems = sortedTransactions.slice(startIndex, endIndex);


    let runningBalance = 0;
    if (startIndex > 0) {

        for (let i = 0; i < startIndex; i++) {
            runningBalance += (sortedTransactions[i].deposit || 0) - (sortedTransactions[i].withdrawal || 0);
        }
    }

    currentPageItems.forEach(tx => {

        runningBalance += (tx.deposit || 0) - (tx.withdrawal || 0);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2">${tx.date}</td>
          <td class="px-4 py-2">${tx.description || 'N/A'}</td>
          <td class="px-4 py-2">${tx.reference || '-'}</td>
          <td class="px-4 py-2 text-green-600">${tx.deposit > 0 ? window.utils.formatCurrency(tx.deposit) : '-'}</td>
          <td class="px-4 py-2 text-red-600">${tx.withdrawal > 0 ? window.utils.formatCurrency(tx.withdrawal) : '-'}</td>
          <td class="px-4 py-2 font-semibold">${window.utils.formatCurrency(runningBalance)}</td>
      `;
        ledgerBody.appendChild(row);
    });
}


function setupBankPaginationControls() {
    const container = document.getElementById('bank-pagination-controls');
    if (!container) return;

    container.innerHTML = '';


    const totalPages = Math.ceil(bankTotalTransactions / bankPageSize);
    if (totalPages <= 0) return;


    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = `px-3 py-1 rounded ${bankCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    prevButton.disabled = bankCurrentPage === 1;
    if (bankCurrentPage > 1) {
        prevButton.addEventListener('click', () => {
            bankCurrentPage--;
            renderBankLedgerTable();
            setupBankPaginationControls();
        });
    }
    container.appendChild(prevButton);


    const maxPageButtons = 5;
    let startPage = Math.max(1, bankCurrentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 mx-1 rounded ${i === bankCurrentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`;
        if (i !== bankCurrentPage) {
            pageButton.addEventListener('click', () => {
                bankCurrentPage = i;
                renderBankLedgerTable();
                setupBankPaginationControls();
            });
        }
        container.appendChild(pageButton);
    }


    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = `px-3 py-1 rounded ${bankCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    nextButton.disabled = bankCurrentPage === totalPages;
    if (bankCurrentPage < totalPages) {
        nextButton.addEventListener('click', () => {
            bankCurrentPage++;
            renderBankLedgerTable();
            setupBankPaginationControls();
        });
    }
    container.appendChild(nextButton);


    const pageSizeElement = document.getElementById('bank-page-size');
    if (pageSizeElement) {
        pageSizeElement.addEventListener('change', function () {
            bankPageSize = parseInt(this.value);
            bankCurrentPage = 1;
            renderBankLedgerTable();
            setupBankPaginationControls();
        });
    }
}

async function addBankTransaction(transaction) {
    try {

        transaction.createdAt = new Date().toISOString();


        await window.dbService.addBankTransaction(transaction);


        await loadBankLedger();


        window.utils.showNotification('Bank transaction added successfully', 'success');
    } catch (error) {
        console.error('Error adding bank transaction:', error);
        window.utils.showNotification('Failed to add bank transaction', 'error');
    }
}




async function loadReceivables() {
    try {
        console.log('Loading receivables data');
        
        
        const receivables = await getCompleteReceivables();
        console.log(`Total receivables loaded: ${receivables.length}`);
        
        
        receivableFilteredItems = receivables;
        receivableTotalItems = receivableFilteredItems.length;
        
        
        updateReceivablesSummary(receivables);
        
        
        await setupCustomerFilter(receivables);
        renderReceivablesTable();
        setupReceivablePaginationControls();
        
        
        const today = window.utils.getTodayDate();
        const thirtyDaysAgo = window.utils.getDateDaysAgo(30);
        
        const dateFromInput = document.getElementById('date-from-filter');
        const dateToInput = document.getElementById('date-to-filter');
        
        if (dateFromInput && !dateFromInput.value) dateFromInput.value = thirtyDaysAgo;
        if (dateToInput && !dateToInput.value) dateToInput.value = today;
        
        
        setupReceivableFilterEvents();
    } catch (error) {
        console.error('Failed to load receivables data:', error);
        window.utils.showNotification('Failed to load receivables data', 'error');
    }
}



function updateReceivablesSummary(receivables) {
    console.log('Updating receivables summary with corrected business logic');
    
    try {
        // Ensure receivables is valid
        receivables = receivables || [];
        
        // 1. Calculate GROSS total of ALL transactions
        const grossTotal = receivables.reduce((sum, rx) => sum + (parseFloat(rx.amount) || 0), 0);
        
        // 2. Calculate total of RECEIVED transactions
        const paidTransactions = receivables.filter(rx => rx.status === 'paid');
        const paidTotal = paidTransactions.reduce((sum, rx) => sum + (parseFloat(rx.amount) || 0), 0);
        
        // 3. Calculate total of ACTIVE transactions (to receive)
        const activeTransactions = receivables.filter(rx => rx.status !== 'paid' && rx.status !== 'reversed');
        const activeTotal = activeTransactions.reduce((sum, rx) => sum + (parseFloat(rx.amount) || 0), 0);
        
        // 4. Calculate NET balance explicitly
        // If your gross total already includes both paid and unpaid, you need to subtract paid amount twice
        const netBalance = grossTotal - paidTotal - paidTotal;
        
        // Check if the calculation matches expected active total
        if (Math.abs(netBalance - activeTotal) > 1) {
            console.warn(`Balance calculation mismatch! netBalance: ${netBalance} vs activeTotal: ${activeTotal}`);
        }
        
        // 5. Update UI with explicit values
        if (document.getElementById('total-receivables')) {
            document.getElementById('total-receivables').textContent = window.utils.formatCurrency(activeTotal);
        }
        
        if (document.getElementById('total-paid')) {
            document.getElementById('total-paid').textContent = window.utils.formatCurrency(paidTotal);
        }
        
        if (document.getElementById('balance-receivable')) {
            // Use net balance which should now be correct
            document.getElementById('balance-receivable').textContent = window.utils.formatCurrency(netBalance);
        }
        
        // Log detailed calculation for verification
        console.log('Detailed receivable calculation:');
        console.log(`- Gross Total: ${grossTotal}`);
        console.log(`- Paid Total: ${paidTotal}`);
        console.log(`- Active Total: ${activeTotal}`);
        console.log(`- Net Balance (Gross - Paid - Paid): ${netBalance}`);
        
        return {
            grossTotal,
            paidTotal,
            activeTotal,
            netBalance
        };
    } catch (error) {
        console.error('Error in receivables balance calculation:', error);
        return null;
    }
}


async function getCompleteReceivables() {
    let allReceivables = [];
    const seenIds = new Set();
    
    
    function addItems(items, source) {
        if (!Array.isArray(items)) return 0;
        
        let added = 0;
        for (const item of items) {
            if (!item || !item.id) continue;
            
            
            if (seenIds.has(item.id)) continue;
            
            
            seenIds.add(item.id);
            allReceivables.push(item);
            added++;
        }
        
        console.log(`Added ${added} receivables from ${source}`);
        return added;
    }
    
    
    try {
        if (window.db && typeof window.db.get === 'function') {
            
            const receivables = await window.db.get('receivables');
            addItems(receivables, 'db:receivables');
            
            
            const tradeReceivables = await window.db.get('tradeReceivable');
            addItems(tradeReceivables, 'db:tradeReceivable');
        }
    } catch (error) {
        console.warn('Error getting receivables from DB:', error);
    }
    
    
    try {
        
        const storedReceivables = localStorage.getItem('receivables');
        if (storedReceivables) {
            try {
                const items = JSON.parse(storedReceivables);
                addItems(items, 'localStorage:receivables');
            } catch (e) {
                console.warn('Error parsing receivables from localStorage', e);
            }
        }
        
        
        const storedTradeReceivable = localStorage.getItem('tradeReceivable');
        if (storedTradeReceivable) {
            try {
                const items = JSON.parse(storedTradeReceivable);
                addItems(items, 'localStorage:tradeReceivable');
            } catch (e) {
                console.warn('Error parsing tradeReceivable from localStorage', e);
            }
        }
    } catch (error) {
        console.warn('Error accessing localStorage for receivables:', error);
    }
    
    return allReceivables;
}


async function getCompletePayables() {
    let allPayables = [];
    const seenIds = new Set();
    
    
    function addItems(items, source) {
        if (!Array.isArray(items)) return 0;
        
        let added = 0;
        for (const item of items) {
            if (!item || !item.id) continue;
            
            
            if (seenIds.has(item.id)) continue;
            
            
            seenIds.add(item.id);
            allPayables.push(item);
            added++;
        }
        
        console.log(`Added ${added} payables from ${source}`);
        return added;
    }
    
    
    try {
        if (window.db && typeof window.db.get === 'function') {
            
            const payables = await window.db.get('payables');
            addItems(payables, 'db:payables');
            
            
            const tradePayables = await window.db.get('tradePayable');
            addItems(tradePayables, 'db:tradePayable');
        }
    } catch (error) {
        console.warn('Error getting payables from DB:', error);
    }
    
    
    try {
        
        const storedPayables = localStorage.getItem('payables');
        if (storedPayables) {
            try {
                const items = JSON.parse(storedPayables);
                addItems(items, 'localStorage:payables');
            } catch (e) {
                console.warn('Error parsing payables from localStorage', e);
            }
        }
        
        
        const storedTradePayable = localStorage.getItem('tradePayable');
        if (storedTradePayable) {
            try {
                const items = JSON.parse(storedTradePayable);
                addItems(items, 'localStorage:tradePayable');
            } catch (e) {
                console.warn('Error parsing tradePayable from localStorage', e);
            }
        }
    } catch (error) {
        console.warn('Error accessing localStorage for payables:', error);
    }
    
    return allPayables;
}


async function setupCustomerFilter(receivables) {
    const filter = document.getElementById('customer-filter');
    if (!filter) return;

    filter.innerHTML = '<option value="">All Customers</option>';

    try {

        const customerIds = [...new Set(receivables
            .filter(rx => rx.customerId)
            .map(rx => rx.customerId))];

        if (customerIds.length > 0) {
            console.log(`Found ${customerIds.length} unique customers in receivables`);


            const customers = [];
            for (const customerId of customerIds) {
                try {
                    const customer = await window.dbService.getCustomerById(customerId);
                    if (customer && customer.name) {
                        customers.push(customer);
                    }
                } catch (error) {
                    console.warn(`Error getting customer ${customerId}:`, error);
                }
            }

            customers.sort((a, b) => a.name.localeCompare(b.name));


            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer._id;
                option.textContent = customer.name;
                filter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error setting up customer filter:', error);
    }
}

function renderReceivablesTable() {
    const tbody = document.getElementById('receivables-body');
    if (!tbody) {
        console.warn('Receivables table body not found');
        return;
    }

    tbody.innerHTML = '';

    if (!receivableFilteredItems || receivableFilteredItems.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="7" class="px-4 py-2 text-center text-gray-500">No receivables found</td>
      `;
        tbody.appendChild(row);
        return;
    }

    console.log(`Rendering ${receivableFilteredItems.length} receivables out of ${receivableTotalItems} total`);


    const sortedReceivables = [...receivableFilteredItems].sort((a, b) => {

        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        const dateComparison = dateB - dateA;


        if (dateComparison === 0) {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
        }

        return dateComparison;
    });


    const startIndex = (receivableCurrentPage - 1) * receivablePageSize;
    const endIndex = Math.min(startIndex + receivablePageSize, sortedReceivables.length);
    const currentPageItems = sortedReceivables.slice(startIndex, endIndex);

    console.log(`Displaying receivables ${startIndex + 1}-${endIndex} of ${sortedReceivables.length}`);


    console.log('All filtered receivables:', receivableFilteredItems);
    console.log('Current page receivables:', currentPageItems);


    const today = new Date();

    currentPageItems.forEach(receivable => {
        let status = 'current';
        let statusClass = 'bg-green-100 text-green-800';


        if (receivable.status === 'paid') {
            status = 'paid';
            statusClass = 'bg-gray-100 text-gray-800';
        } else if (receivable.status === 'reversed') {
            status = 'reversed';
            statusClass = 'bg-gray-100 text-gray-800';
        } else if (receivable.dueDate && new Date(receivable.dueDate) < today) {
            status = 'overdue';
            statusClass = 'bg-red-100 text-red-800';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2">${receivable.id || receivable.billId || 'N/A'}</td>
          <td class="px-4 py-2">${receivable.date || 'N/A'}</td>
          <td class="px-4 py-2">${receivable.customer || 'N/A'}</td>
          <td class="px-4 py-2">${receivable.dueDate || '-'}</td>
          <td class="px-4 py-2">${window.utils.formatCurrency(receivable.amount || 0)}</td>
          <td class="px-4 py-2">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                  ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
          </td>
          <td class="px-4 py-2">
              <button class="text-blue-600 hover:text-blue-800 mr-2 view-details" data-id="${receivable.id}" title="View Details">
                  <i class="fas fa-eye"></i>
              </button>
              
          </td>
      `;
        tbody.appendChild(row);
    });


    attachReceivableActionListeners();
}

function setupReceivablePaginationControls() {
    const container = document.getElementById('receivable-pagination-controls');
    if (!container) return;

    container.innerHTML = '';


    const totalPages = Math.ceil(receivableTotalItems / receivablePageSize);
    if (totalPages <= 0) return;


    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = `px-3 py-1 rounded ${receivableCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    prevButton.disabled = receivableCurrentPage === 1;
    if (receivableCurrentPage > 1) {
        prevButton.addEventListener('click', () => {
            receivableCurrentPage--;
            renderReceivablesTable();
            setupReceivablePaginationControls();
        });
    }
    container.appendChild(prevButton);


    const maxPageButtons = 5;
    let startPage = Math.max(1, receivableCurrentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 mx-1 rounded ${i === receivableCurrentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`;
        if (i !== receivableCurrentPage) {
            pageButton.addEventListener('click', () => {
                receivableCurrentPage = i;
                renderReceivablesTable();
                setupReceivablePaginationControls();
            });
        }
        container.appendChild(pageButton);
    }


    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = `px-3 py-1 rounded ${receivableCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    nextButton.disabled = receivableCurrentPage === totalPages;
    if (receivableCurrentPage < totalPages) {
        nextButton.addEventListener('click', () => {
            receivableCurrentPage++;
            renderReceivablesTable();
            setupReceivablePaginationControls();
        });
    }
    container.appendChild(nextButton);


    const pageSizeElement = document.getElementById('receivable-page-size');
    if (pageSizeElement) {
        pageSizeElement.addEventListener('change', function () {
            receivablePageSize = parseInt(this.value);
            receivableCurrentPage = 1;
            renderReceivablesTable();
            setupReceivablePaginationControls();
        });
    }
}

function setupReceivableFilterEvents() {
    const applyFilterBtn = document.getElementById('apply-filter');
    const resetFilterBtn = document.getElementById('reset-filter');
    const searchInput = document.getElementById('search-receivables');
    const customerFilter = document.getElementById('customer-filter');
    const statusFilter = document.getElementById('status-filter');

    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', filterReceivables);
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetReceivableFilters);
    }


    if (searchInput) {
        searchInput.addEventListener('input', filterReceivables);
    }


    if (customerFilter) {
        customerFilter.addEventListener('change', filterReceivables);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterReceivables);
    }
}

async function filterReceivables() {
    try {
        console.log('Filtering receivables');
        const searchTerm = document.getElementById('search-receivables')?.value?.toLowerCase();
        const customerId = document.getElementById('customer-filter')?.value;
        const status = document.getElementById('status-filter')?.value;
        const dateFrom = document.getElementById('date-from-filter')?.value;
        const dateTo = document.getElementById('date-to-filter')?.value;

        console.log(`Filter criteria - Customer: ${customerId}, Status: ${status}, Date range: ${dateFrom} to ${dateTo}, Search: ${searchTerm}`);


        const allReceivables = await window.dbService.getReceivables() || [];
        let filtered = [...allReceivables];


        if (customerId) {
            filtered = filtered.filter(rx => rx.customerId === customerId);
        }


        if (status) {
            if (status === 'current') {
                filtered = filtered.filter(rx => {

                    if (rx.status === 'paid' || rx.status === 'reversed') return false;
                    return !rx.dueDate || new Date(rx.dueDate) >= new Date();
                });
            } else if (status === 'overdue') {
                filtered = filtered.filter(rx => {

                    if (rx.status === 'paid' || rx.status === 'reversed') return false;
                    return rx.dueDate && new Date(rx.dueDate) < new Date();
                });
            } else {

                filtered = filtered.filter(rx => rx.status === status);
            }
        }


        if (dateFrom && dateTo) {
            filtered = filtered.filter(rx => rx.date >= dateFrom && rx.date <= dateTo);
        } else if (dateFrom) {
            filtered = filtered.filter(rx => rx.date >= dateFrom);
        } else if (dateTo) {
            filtered = filtered.filter(rx => rx.date <= dateTo);
        }


        if (searchTerm) {
            filtered = filtered.filter(rx =>
                (rx.id && rx.id.toLowerCase().includes(searchTerm)) ||
                (rx.billId && rx.billId.toLowerCase().includes(searchTerm)) ||
                (rx.customer && rx.customer.toLowerCase().includes(searchTerm)) ||
                (rx.reference && rx.reference.toLowerCase().includes(searchTerm))
            );
        }

        console.log(`Filtered receivables: ${filtered.length} of ${allReceivables.length}`);


        receivableFilteredItems = filtered;
        receivableTotalItems = receivableFilteredItems.length;
        receivableCurrentPage = 1;


        renderReceivablesTable();
        setupReceivablePaginationControls();
    } catch (error) {
        console.error('Error filtering receivables:', error);
        window.utils.showNotification('Error applying filters', 'error');
    }
}

function resetReceivableFilters() {

    const searchInput = document.getElementById('search-receivables');
    const customerFilter = document.getElementById('customer-filter');
    const statusFilter = document.getElementById('status-filter');
    const dateFromFilter = document.getElementById('date-from-filter');
    const dateToFilter = document.getElementById('date-to-filter');

    if (searchInput) searchInput.value = '';
    if (customerFilter) customerFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (dateFromFilter) dateFromFilter.value = window.utils.getDateDaysAgo(30);
    if (dateToFilter) dateToFilter.value = window.utils.getTodayDate();


    loadReceivables();
}

function attachReceivableActionListeners() {

    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id');
            try {
                const receivables = await window.dbService.getReceivables();
                const receivable = receivables.find(r => r.id === id);

                if (receivable) {
                    showReceivableDetailsModal(receivable);
                } else {
                    window.utils.showNotification('Receivable not found', 'error');
                }
            } catch (error) {
                console.error(`Error getting receivable ${id}:`, error);
                window.utils.showNotification('Error loading receivable details', 'error');
            }
        });
    });


}

function showReceivableDetailsModal(receivable) {
    try {
        const modal = document.getElementById('receivable-details-modal');
        const titleElem = document.getElementById('receivable-details-title');
        const contentElem = document.getElementById('receivable-details-content');
        const paymentBtn = document.getElementById('record-payment-btn');

        if (!modal || !titleElem || !contentElem || !paymentBtn) {
            console.error('Receivable details modal elements not found');
            return;
        }


        titleElem.textContent = `Receivable Details: ${receivable.id || receivable.billId || 'Unknown'}`;


        let status = 'Current';
        let statusClass = 'text-green-600';

        if (receivable.status === 'paid') {
            status = 'Paid';
            statusClass = 'text-gray-600';
        } else if (receivable.status === 'reversed') {
            status = 'Reversed';
            statusClass = 'text-gray-600';
        } else if (receivable.dueDate && new Date(receivable.dueDate) < new Date()) {
            status = 'Overdue';
            statusClass = 'text-red-600';
        }


        contentElem.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                  <p class="text-sm text-gray-500">Customer</p>
                  <p class="font-medium">${receivable.customer || 'N/A'}</p>
              </div>
              
              <div>
                  <p class="text-sm text-gray-500">Amount</p>
                  <p class="font-medium">${window.utils.formatCurrency(receivable.amount || 0)}</p>
              </div>
              
              <div>
                  <p class="text-sm text-gray-500">Date</p>
                  <p class="font-medium">${receivable.date || 'N/A'}</p>
              </div>
              
              <div>
                  <p class="text-sm text-gray-500">Status</p>
                  <p class="font-medium ${statusClass}">${status}</p>
              </div>
              
              ${receivable.dueDate ? `
              <div>
                  <p class="text-sm text-gray-500">Due Date</p>
                  <p class="font-medium">${receivable.dueDate}</p>
              </div>
              ` : ''}
              
              ${receivable.billId ? `
              <div>
                  <p class="text-sm text-gray-500">Invoice Reference</p>
                  <p class="font-medium">${receivable.billId}</p>
              </div>
              ` : ''}
              
              ${receivable.reference ? `
              <div>
                  <p class="text-sm text-gray-500">Reference</p>
                  <p class="font-medium">${receivable.reference}</p>
              </div>
              ` : ''}
              
              ${receivable.paymentDate ? `
              <div>
                  <p class="text-sm text-gray-500">Payment Date</p>
                  <p class="font-medium">${receivable.paymentDate}</p>
              </div>
              ` : ''}
              
              ${receivable.paymentMethod ? `
              <div>
                  <p class="text-sm text-gray-500">Payment Method</p>
                  <p class="font-medium">${receivable.paymentMethod}</p>
              </div>
              ` : ''}
              
              ${receivable.paymentReference ? `
              <div>
                  <p class="text-sm text-gray-500">Payment Reference</p>
                  <p class="font-medium">${receivable.paymentReference}</p>
              </div>
              ` : ''}
          </div>
      `;




        modal.classList.remove('opacity-0');
        modal.classList.remove('pointer-events-none');


        document.getElementById('close-details-modal').addEventListener('click', closeReceivableDetailsModal);
        document.getElementById('close-details-btn').addEventListener('click', closeReceivableDetailsModal);


        function closeReceivableDetailsModal() {
            modal.classList.add('opacity-0');
            modal.classList.add('pointer-events-none');
        }
    } catch (error) {
        console.error('Error showing receivable details:', error);
        window.utils.showNotification('Error displaying details', 'error');
    }
}

function showReceivablePaymentModal(receivable) {
    try {
        const modal = document.getElementById('payment-modal');
        const titleElem = document.getElementById('payment-modal-title');
        const customerElem = document.getElementById('payment-customer-name');
        const amountElem = document.getElementById('payment-amount-display');
        const receivableIdInput = document.getElementById('receivableId');
        const amountInput = document.getElementById('paymentAmount');
        const dateInput = document.getElementById('paymentDate');
        const paymentMethodSelect = document.getElementById('paymentMethod');

        if (!modal || !titleElem || !customerElem || !amountElem || !receivableIdInput ||
            !amountInput || !dateInput || !paymentMethodSelect) {
            console.error('Payment modal elements not found');
            return;
        }


        titleElem.textContent = `Record Payment for ${receivable.id}`;
        customerElem.textContent = receivable.customer || 'Unknown';
        amountElem.textContent = window.utils.formatCurrency(receivable.amount || 0);
        receivableIdInput.value = receivable.id;
        amountInput.value = receivable.amount || 0;
        dateInput.value = window.utils.getTodayDate();


        paymentMethodSelect.addEventListener('change', function () {
            const chequeField = document.getElementById('cheque-field');
            if (chequeField) {
                chequeField.classList.toggle('hidden', this.value !== 'cheque');
            }
        });


        modal.classList.remove('opacity-0');
        modal.classList.remove('pointer-events-none');


        document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
        document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
        document.getElementById('payment-form').addEventListener('submit', function (e) {
            e.preventDefault();
            processReceivablePayment();
        });

        function closePaymentModal() {
            modal.classList.add('opacity-0');
            modal.classList.add('pointer-events-none');
            document.getElementById('payment-form').reset();
        }
    } catch (error) {
        console.error('Error showing payment modal:', error);
        window.utils.showNotification('Error preparing payment form', 'error');
    }
}

async function processReceivablePayment() {
    try {
        const receivableId = document.getElementById('receivableId').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const date = document.getElementById('paymentDate').value;
        const reference = document.getElementById('paymentReference').value;
        const chequeNumber = paymentMethod === 'cheque' ? document.getElementById('chequeNumber').value : null;

        if (!receivableId) {
            window.utils.showNotification('Receivable ID is required', 'error');
            return;
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            window.utils.showNotification('Please enter a valid amount', 'error');
            return;
        }

        if (paymentMethod === 'cheque' && !chequeNumber) {
            window.utils.showNotification('Please enter a cheque number', 'error');
            return;
        }


        const receivables = await window.dbService.getReceivables();
        const receivable = receivables.find(r => r.id === receivableId);

        if (!receivable) {
            window.utils.showNotification('Receivable not found', 'error');
            return;
        }


        const paymentId = `RCP-${Date.now().toString().substring(7)}`;


        if (paymentMethod === 'cash') {

            await window.dbService.addCashTransaction({
                date,
                description: `Receipt from ${receivable.customer}`,
                reference: reference || paymentId,
                cashIn: amount,
                cashOut: 0,
                customerId: receivable.customerId
            });
        } else if (paymentMethod === 'bank' || paymentMethod === 'cheque') {

            await window.dbService.addBankTransaction({
                date,
                description: `Receipt from ${receivable.customer}`,
                reference: reference || paymentId,
                deposit: amount,
                withdrawal: 0,
                customerId: receivable.customerId,
                chequeNumber: chequeNumber
            });
        }


        receivable.status = 'paid';
        receivable.paymentDate = date;
        receivable.paymentMethod = paymentMethod;
        receivable.paymentReference = reference || paymentId;

        if (chequeNumber) {
            receivable.chequeNumber = chequeNumber;
        }

        await window.dbService.updateReceivable(receivableId, receivable);

        if (receivable.customerId) {
            await window.dbService.addCustomerTransaction(receivable.customerId, {
                date,
                description: `Payment received for ${receivable.id}`,
                type: 'Receipt',
                debit: 0,
                credit: amount,
                reference: paymentId,
                balance: 0
            });
        }

        const receiptRecord = {
            id: paymentId,
            date,
            customer: receivable.customer,
            customerId: receivable.customerId,
            title: `Payment for ${receivable.id}`,
            description: `Received payment for invoice ${receivable.id}`,
            amount,
            receiptType: paymentMethod === 'cheque' ? 'bank' : paymentMethod,
            reference: reference || `INV-${receivable.id}`,
            createdAt: new Date().toISOString()
        };

        if (chequeNumber) {
            receiptRecord.chequeNumber = chequeNumber;
        }

        await window.dbService.addReceipt(receiptRecord);

        document.getElementById('payment-modal').classList.add('opacity-0');
        document.getElementById('payment-modal').classList.add('pointer-events-none');

        await loadReceivables();

        window.utils.showNotification('Payment recorded successfully', 'success');
    } catch (error) {
        console.error('Error processing payment:', error);
        window.utils.showNotification('Failed to process payment', 'error');
    }
}


async function loadPayables() {
    try {
        console.log('Loading payables data');
        
        
        const payables = await getCompletePayables();
        console.log(`Total payables loaded: ${payables.length}`);
        
        
        payableFilteredItems = payables;
        payableTotalItems = payableFilteredItems.length;
        
        
        updatePayablesSummary(payables);
        
        
        await setupVendorFilter(payables);
        renderPayablesTable();
        setupPayablePaginationControls();
        
        
        const today = window.utils.getTodayDate();
        const thirtyDaysAgo = window.utils.getDateDaysAgo(30);
        
        const dateFromInput = document.getElementById('date-from-filter');
        const dateToInput = document.getElementById('date-to-filter');
        
        if (dateFromInput && !dateFromInput.value) dateFromInput.value = thirtyDaysAgo;
        if (dateToInput && !dateToInput.value) dateToInput.value = today;
        
        
        setupPayableFilterEvents();
    } catch (error) {
        console.error('Failed to load payables data:', error);
        window.utils.showNotification('Failed to load payables data', 'error');
    }
}




function setupCashLedgerEvents() {
    console.log('Setting up cash ledger filter events');
    
    
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');
    const searchInput = document.getElementById('search-cash');
    const transactionType = document.getElementById('transaction-type');
    const applyFilterBtn = document.getElementById('apply-filter'); 
    const resetFilterBtn = document.getElementById('reset-filter'); 
    
    console.log('Filter elements found:', {
        filterDateStart: !!filterDateStart,
        filterDateEnd: !!filterDateEnd,
        searchInput: !!searchInput,
        transactionType: !!transactionType,
        applyFilterBtn: !!applyFilterBtn,
        resetFilterBtn: !!resetFilterBtn
    });
    
    
    
    const possibleApplyBtnIds = ['apply-filter', 'apply-cash-filter', 'filter-apply-btn'];
    let applyBtnFound = false;
    
    for (const id of possibleApplyBtnIds) {
        const btn = document.getElementById(id);
        if (btn) {
            console.log(`Found apply filter button with ID: ${id}`);
            btn.addEventListener('click', filterCashTransactions);
            applyBtnFound = true;
            break;
        }
    }
    
    if (!applyBtnFound) {
        console.warn('Apply filter button not found. Trying to locate by class or position');
        
        const filterBtn = document.querySelector('.filter-apply-btn, .btn-primary[type="button"]');
        if (filterBtn) {
            console.log('Located apply filter button by class/attribute');
            filterBtn.addEventListener('click', filterCashTransactions);
        }
    }
    
    
    const possibleResetBtnIds = ['reset-filter', 'reset-cash-filter', 'filter-reset-btn'];
    let resetBtnFound = false;
    
    for (const id of possibleResetBtnIds) {
        const btn = document.getElementById(id);
        if (btn) {
            console.log(`Found reset filter button with ID: ${id}`);
            btn.addEventListener('click', resetCashFilters);
            resetBtnFound = true;
            break;
        }
    }
    
    if (!resetBtnFound) {
        console.warn('Reset filter button not found. Trying to locate by class or position');
        const resetBtn = document.querySelector('.filter-reset-btn, .btn-secondary[type="button"]');
        if (resetBtn) {
            console.log('Located reset filter button by class/attribute');
            resetBtn.addEventListener('click', resetCashFilters);
        }
    }
    
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
            }
            
            this.searchTimer = setTimeout(() => {
                filterCashTransactions();
            }, 300);
        });
    } else {
        
        const altSearchInput = document.querySelector('input[placeholder*="Search"], input[type="search"], #search-transactions');
        if (altSearchInput) {
            console.log('Located search input by alternative selector');
            altSearchInput.addEventListener('input', function() {
                if (this.searchTimer) {
                    clearTimeout(this.searchTimer);
                }
                
                this.searchTimer = setTimeout(() => {
                    filterCashTransactions();
                }, 300);
            });
        }
    }
}

function resetCashFilters() {
    console.log('Resetting cash filters');
    
    
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');
    const searchInput = document.getElementById('search-cash') || 
                      document.querySelector('input[placeholder*="Search"], input[type="search"], #search-transactions');
    const transactionType = document.getElementById('transaction-type');
    
    if (filterDateStart) filterDateStart.value = window.utils.getDateDaysAgo(30);
    if (filterDateEnd) filterDateEnd.value = window.utils.getTodayDate();
    if (searchInput) searchInput.value = '';
    if (transactionType) transactionType.value = '';
    
    
    loadCashLedger();
}



function setupBankLedgerEvents() {
    console.log('Setting up bank ledger filter events');
    
    
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');
    const searchInput = document.getElementById('search-bank');
    const transactionType = document.getElementById('transaction-type');
    const applyFilterBtn = document.getElementById('apply-filter'); 
    const resetFilterBtn = document.getElementById('reset-filter'); 
    
    console.log('Bank filter elements found:', {
        filterDateStart: !!filterDateStart,
        filterDateEnd: !!filterDateEnd,
        searchInput: !!searchInput,
        transactionType: !!transactionType,
        applyFilterBtn: !!applyFilterBtn,
        resetFilterBtn: !!resetFilterBtn
    });
    
    
    
    const possibleApplyBtnIds = ['apply-filter', 'apply-bank-filter', 'filter-apply-btn', 'bank-filter-btn'];
    let applyBtnFound = false;
    
    for (const id of possibleApplyBtnIds) {
        const btn = document.getElementById(id);
        if (btn) {
            console.log(`Found bank apply filter button with ID: ${id}`);
            btn.addEventListener('click', filterBankTransactions);
            applyBtnFound = true;
            break;
        }
    }
    
    if (!applyBtnFound) {
        console.warn('Bank apply filter button not found. Trying to locate by class or position');
        
        const filterBtn = document.querySelector('.bank-filter-btn, .filter-apply-btn, .btn-primary[type="button"]');
        if (filterBtn) {
            console.log('Located bank apply filter button by class/attribute');
            filterBtn.addEventListener('click', filterBankTransactions);
        }
    }
    
    
    const possibleResetBtnIds = ['reset-filter', 'reset-bank-filter', 'filter-reset-btn', 'bank-reset-btn'];
    let resetBtnFound = false;
    
    for (const id of possibleResetBtnIds) {
        const btn = document.getElementById(id);
        if (btn) {
            console.log(`Found bank reset filter button with ID: ${id}`);
            btn.addEventListener('click', resetBankFilters);
            resetBtnFound = true;
            break;
        }
    }
    
    if (!resetBtnFound) {
        console.warn('Bank reset filter button not found. Trying to locate by class or position');
        const resetBtn = document.querySelector('.filter-reset-btn, .btn-secondary[type="button"]');
        if (resetBtn) {
            console.log('Located bank reset filter button by class/attribute');
            resetBtn.addEventListener('click', resetBankFilters);
        }
    }
    
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
            }
            
            this.searchTimer = setTimeout(() => {
                filterBankTransactions();
            }, 300);
        });
    } else {
        
        const altSearchInput = document.querySelector('input[placeholder*="Search"], input[type="search"], #search-transactions');
        if (altSearchInput) {
            console.log('Located bank search input by alternative selector');
            altSearchInput.addEventListener('input', function() {
                if (this.searchTimer) {
                    clearTimeout(this.searchTimer);
                }
                
                this.searchTimer = setTimeout(() => {
                    filterBankTransactions();
                }, 300);
            });
        }
    }
}

async function filterBankTransactions() {
    try {
        console.log('Filtering bank transactions');
        
        
        let dateFrom, dateTo, searchTerm, typeFilter;
        
        const filterDateStart = document.getElementById('filter-date-start');
        const filterDateEnd = document.getElementById('filter-date-end');
        const searchInput = document.getElementById('search-bank') || 
                          document.querySelector('input[placeholder*="Search"], input[type="search"], #search-transactions');
        const transactionType = document.getElementById('transaction-type');
        
        dateFrom = filterDateStart ? filterDateStart.value : null;
        dateTo = filterDateEnd ? filterDateEnd.value : null;
        searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        typeFilter = transactionType ? transactionType.value : '';
        
        console.log('Bank filter parameters:', { dateFrom, dateTo, searchTerm, typeFilter });
        
        
        const allTransactions = await window.dbService.getBankTransactions() || [];
        console.log(`Total bank transactions before filtering: ${allTransactions.length}`);
        
        let filtered = [...allTransactions];
        
        
        if (dateFrom || dateTo) {
            filtered = filtered.filter(tx => {
                if (!tx.date) return false;
                
                try {
                    
                    const txDate = new Date(tx.date);
                    if (isNaN(txDate.getTime())) return false; 
                    
                    
                    const txDateStr = txDate.toISOString().split('T')[0];
                    
                    
                    if (dateFrom && dateTo) {
                        return txDateStr >= dateFrom && txDateStr <= dateTo;
                    } else if (dateFrom) {
                        return txDateStr >= dateFrom;
                    } else if (dateTo) {
                        return txDateStr <= dateTo;
                    }
                } catch (e) {
                    console.warn('Error processing transaction date', e);
                    return false;
                }
                
                return true;
            });
        }
        
        
        if (typeFilter) {
            if (typeFilter === 'deposit' || typeFilter === 'in' || typeFilter === 'credit') {
                filtered = filtered.filter(tx => tx.deposit && tx.deposit > 0);
            } else if (typeFilter === 'withdrawal' || typeFilter === 'out' || typeFilter === 'debit') {
                filtered = filtered.filter(tx => tx.withdrawal && tx.withdrawal > 0);
            }
        }
        
        
        if (searchTerm) {
            filtered = filtered.filter(tx => 
                (tx.description && tx.description.toLowerCase().includes(searchTerm)) ||
                (tx.reference && tx.reference.toLowerCase().includes(searchTerm))
            );
        }
        
        console.log(`Filtered bank transactions: ${filtered.length} of ${allTransactions.length}`);
        
        
        bankFilteredTransactions = filtered;
        bankTotalTransactions = filtered.length;
        bankCurrentPage = 1; 
        
        renderBankLedgerTable();
        setupBankPaginationControls();
        
    } catch (error) {
        console.error('Error filtering bank transactions:', error);
        window.utils.showNotification('Error applying filters', 'error');
    }
}

function resetBankFilters() {
    console.log('Resetting bank filters');
    
    
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');
    const searchInput = document.getElementById('search-bank') || 
                      document.querySelector('input[placeholder*="Search"], input[type="search"], #search-transactions');
    const transactionType = document.getElementById('transaction-type');
    
    if (filterDateStart) filterDateStart.value = window.utils.getDateDaysAgo(30);
    if (filterDateEnd) filterDateEnd.value = window.utils.getTodayDate();
    if (searchInput) searchInput.value = '';
    if (transactionType) transactionType.value = '';
    
    
    loadBankLedger();
}

async function filterCashTransactions() {
    try {
        console.log('Filtering cash transactions');
        
        
        let dateFrom, dateTo, searchTerm, typeFilter;
        
        const filterDateStart = document.getElementById('filter-date-start');
        const filterDateEnd = document.getElementById('filter-date-end');
        const searchInput = document.getElementById('search-cash') || 
                          document.querySelector('input[placeholder*="Search"], input[type="search"], #search-transactions');
        const transactionType = document.getElementById('transaction-type');
        
        dateFrom = filterDateStart ? filterDateStart.value : null;
        dateTo = filterDateEnd ? filterDateEnd.value : null;
        searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        typeFilter = transactionType ? transactionType.value : '';
        
        console.log('Filter parameters:', { dateFrom, dateTo, searchTerm, typeFilter });
        
        
        const allTransactions = await window.dbService.getCashTransactions() || [];
        console.log(`Total cash transactions before filtering: ${allTransactions.length}`);
        
        let filtered = [...allTransactions];
        
        
        if (dateFrom || dateTo) {
            filtered = filtered.filter(tx => {
                if (!tx.date) return false;
                
                try {
                    
                    const txDate = new Date(tx.date);
                    if (isNaN(txDate.getTime())) return false; 
                    
                    
                    const txDateStr = txDate.toISOString().split('T')[0];
                    
                    
                    if (dateFrom && dateTo) {
                        return txDateStr >= dateFrom && txDateStr <= dateTo;
                    } else if (dateFrom) {
                        return txDateStr >= dateFrom;
                    } else if (dateTo) {
                        return txDateStr <= dateTo;
                    }
                } catch (e) {
                    console.warn('Error processing transaction date', e);
                    return false;
                }
                
                return true;
            });
        }
        
        
        if (typeFilter) {
            if (typeFilter === 'in' || typeFilter === 'income' || typeFilter === 'deposit') {
                filtered = filtered.filter(tx => tx.cashIn && tx.cashIn > 0);
            } else if (typeFilter === 'out' || typeFilter === 'expense' || typeFilter === 'withdrawal') {
                filtered = filtered.filter(tx => tx.cashOut && tx.cashOut > 0);
            }
        }
        
        
        if (searchTerm) {
            filtered = filtered.filter(tx => 
                (tx.description && tx.description.toLowerCase().includes(searchTerm)) ||
                (tx.reference && tx.reference.toLowerCase().includes(searchTerm))
            );
        }
        
        console.log(`Filtered cash transactions: ${filtered.length} of ${allTransactions.length}`);
        
        
        cashFilteredTransactions = filtered;
        cashTotalTransactions = filtered.length;
        cashCurrentPage = 1; 
        
        renderCashLedgerTable();
        setupCashPaginationControls();
        
    } catch (error) {
        console.error('Error filtering cash transactions:', error);
        window.utils.showNotification('Error applying filters', 'error');
    }
}



function updatePayablesSummary(payables) {
    console.log('Updating payables summary with corrected business logic');
    
    try {
        // Ensure payables is valid
        payables = payables || [];
        
        // 1. Calculate GROSS total of ALL transactions
        const grossTotal = payables.reduce((sum, px) => sum + (parseFloat(px.amount) || 0), 0);
        
        // 2. Calculate total of PAID transactions
        const paidTransactions = payables.filter(px => px.status === 'paid');
        const paidTotal = paidTransactions.reduce((sum, px) => sum + (parseFloat(px.amount) || 0), 0);
        
        // 3. Calculate total of ACTIVE transactions (to pay)
        const activeTransactions = payables.filter(px => px.status !== 'paid' && px.status !== 'reversed');
        const activeTotal = activeTransactions.reduce((sum, px) => sum + (parseFloat(px.amount) || 0), 0);
        
        // 4. Calculate NET balance explicitly
        // If your gross total already includes both paid and unpaid, you need to subtract paid amount twice
        const netBalance = grossTotal - paidTotal - paidTotal;
        
        // Check if the calculation matches expected active total
        if (Math.abs(netBalance - activeTotal) > 1) {
            console.warn(`Balance calculation mismatch! netBalance: ${netBalance} vs activeTotal: ${activeTotal}`);
        }
        
        // 5. Update UI with explicit values
        if (document.getElementById('total-payables')) {
            document.getElementById('total-payables').textContent = window.utils.formatCurrency(activeTotal);
        }
        
        if (document.getElementById('total-paid-payables')) {
            document.getElementById('total-paid-payables').textContent = window.utils.formatCurrency(paidTotal);
        }
        
        if (document.getElementById('balance-payable')) {
            // Use net balance which should now be correct
            document.getElementById('balance-payable').textContent = window.utils.formatCurrency(netBalance);
        }
        
        // Log detailed calculation for verification
        console.log('Detailed payable calculation:');
        console.log(`- Gross Total: ${grossTotal}`);
        console.log(`- Paid Total: ${paidTotal}`);
        console.log(`- Active Total: ${activeTotal}`);
        console.log(`- Net Balance (Gross - Paid - Paid): ${netBalance}`);
        
        return {
            grossTotal,
            paidTotal,
            activeTotal,
            netBalance
        };
    } catch (error) {
        console.error('Error in payables balance calculation:', error);
        return null;
    }
}



function updateReceivablePercentages(totalBillingAmount, totalPaidAmount) {
    const percentCollectedEl = document.getElementById('percent-collected');
    
    if (percentCollectedEl && totalBillingAmount > 0) {
        const percentCollected = (totalPaidAmount / totalBillingAmount) * 100;
        percentCollectedEl.textContent = `${percentCollected.toFixed(1)}%`;
        
        
        if (percentCollected < 50) {
            percentCollectedEl.className = 'text-sm font-medium text-red-600';
        } else if (percentCollected < 80) {
            percentCollectedEl.className = 'text-sm font-medium text-yellow-600';
        } else {
            percentCollectedEl.className = 'text-sm font-medium text-green-600';
        }
    }
    
    
    const recentPaidEl = document.getElementById('recent-paid');
    if (recentPaidEl) {
        calculateRecentPaidAmount('receivables').then(amount => {
            recentPaidEl.textContent = window.utils.formatCurrency(amount);
        });
    }
}


function updatePayablePercentages(totalPurchaseAmount, totalPaidAmount) {
    const percentPaidEl = document.getElementById('percent-paid');
    
    if (percentPaidEl && totalPurchaseAmount > 0) {
        const percentPaid = (totalPaidAmount / totalPurchaseAmount) * 100;
        percentPaidEl.textContent = `${percentPaid.toFixed(1)}%`;
        
        
        if (percentPaid < 50) {
            percentPaidEl.className = 'text-sm font-medium text-red-600';
        } else if (percentPaid < 80) {
            percentPaidEl.className = 'text-sm font-medium text-yellow-600';
        } else {
            percentPaidEl.className = 'text-sm font-medium text-green-600';
        }
    }
    
    
    const recentPaidEl = document.getElementById('recent-paid-payables');
    if (recentPaidEl) {
        calculateRecentPaidAmount('payables').then(amount => {
            recentPaidEl.textContent = window.utils.formatCurrency(amount);
        });
    }
}


async function calculateRecentPaidAmount(type) {
    try {
        
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        let recentPaidAmount = 0;
        
        if (type === 'receivables') {
            
            const receivables = await getCompleteReceivables();
            
            
            recentPaidAmount = receivables
                .filter(rx => 
                    rx.status === 'paid' && 
                    rx.paymentDate && 
                    new Date(rx.paymentDate) >= thirtyDaysAgo
                )
                .reduce((sum, rx) => sum + (parseFloat(rx.amount) || 0), 0);
                
        } else if (type === 'payables') {
            
            const payables = await getCompletePayables();
            
            
            recentPaidAmount = payables
                .filter(px => 
                    px.status === 'paid' && 
                    px.paymentDate && 
                    new Date(px.paymentDate) >= thirtyDaysAgo
                )
                .reduce((sum, px) => sum + (parseFloat(px.amount) || 0), 0);
        }
        
        return recentPaidAmount;
    } catch (error) {
        console.error(`Error calculating recent paid amount for ${type}:`, error);
        return 0;
    }
}


async function setupVendorFilter(payables) {
    const filter = document.getElementById('vendor-filter');
    if (!filter) return;

    filter.innerHTML = '<option value="">All Vendors</option>';

    try {
        const vendorIds = [...new Set(payables
            .filter(px => px.vendorId)
            .map(px => px.vendorId))];

        if (vendorIds.length > 0) {
            console.log(`Found ${vendorIds.length} unique vendors in payables`);

            const vendors = [];
            for (const vendorId of vendorIds) {
                try {
                    const vendor = await window.dbService.getCustomerById(vendorId);
                    if (vendor && vendor.name) {
                        vendors.push(vendor);
                    }
                } catch (error) {
                    console.warn(`Error getting vendor ${vendorId}:`, error);
                }
            }

            vendors.sort((a, b) => a.name.localeCompare(b.name));

            vendors.forEach(vendor => {
                const option = document.createElement('option');
                option.value = vendor._id;
                option.textContent = vendor.name;
                filter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error setting up vendor filter:', error);
    }
}

function renderPayablesTable() {
    const tbody = document.getElementById('payables-body');
    if (!tbody) {
        console.warn('Payables table body not found');
        return;
    }

    tbody.innerHTML = '';

    if (!payableFilteredItems || payableFilteredItems.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="7" class="px-4 py-2 text-center text-gray-500">No payables found</td>
      `;
        tbody.appendChild(row);
        return;
    }

    console.log(`Rendering ${payableFilteredItems.length} payables out of ${payableTotalItems} total`);

    const sortedPayables = [...payableFilteredItems].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        const dateComparison = dateB - dateA;

        if (dateComparison === 0) {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
        }

        return dateComparison;
    });

    const startIndex = (payableCurrentPage - 1) * payablePageSize;
    const endIndex = Math.min(startIndex + payablePageSize, sortedPayables.length);
    const currentPageItems = sortedPayables.slice(startIndex, endIndex);

    console.log(`Displaying payables ${startIndex + 1}-${endIndex} of ${sortedPayables.length}`);

    const today = new Date();

    console.log('All filtered payables:', payableFilteredItems);
    console.log('Current page payables:', currentPageItems);

    currentPageItems.forEach(payable => {
        let status = 'current';
        let statusClass = 'bg-green-100 text-green-800';

        if (payable.status === 'paid') {
            status = 'paid';
            statusClass = 'bg-gray-100 text-gray-800';
        } else if (payable.status === 'reversed') {
            status = 'reversed';
            statusClass = 'bg-gray-100 text-gray-800';
        } else if (payable.dueDate && new Date(payable.dueDate) < today) {
            status = 'overdue';
            statusClass = 'bg-red-100 text-red-800';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2">${payable.id || payable.purchaseId || 'N/A'}</td>
          <td class="px-4 py-2">${payable.date || 'N/A'}</td>
          <td class="px-4 py-2">${payable.vendor || 'N/A'}</td>
          <td class="px-4 py-2">${payable.dueDate || '-'}</td>
          <td class="px-4 py-2">${window.utils.formatCurrency(payable.amount || 0)}</td>
          <td class="px-4 py-2">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                  ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
          </td>
          <td class="px-4 py-2">
              <button class="text-blue-600 hover:text-blue-800 mr-2 view-details" data-id="${payable.id}" title="View Details">
                  <i class="fas fa-eye"></i>
              </button>
              
          </td>
      `;
        tbody.appendChild(row);
    });

    attachPayableActionListeners();
}

function setupPayablePaginationControls() {
    const container = document.getElementById('payable-pagination-controls');
    if (!container) return;

    container.innerHTML = '';

    const totalPages = Math.ceil(payableTotalItems / payablePageSize);
    if (totalPages <= 0) return;

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = `px-3 py-1 rounded ${payableCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    prevButton.disabled = payableCurrentPage === 1;
    if (payableCurrentPage > 1) {
        prevButton.addEventListener('click', () => {
            payableCurrentPage--;
            renderPayablesTable();
            setupPayablePaginationControls();
        });
    }
    container.appendChild(prevButton);

    const maxPageButtons = 5;
    let startPage = Math.max(1, payableCurrentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 mx-1 rounded ${i === payableCurrentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`;
        if (i !== payableCurrentPage) {
            pageButton.addEventListener('click', () => {
                payableCurrentPage = i;
                renderPayablesTable();
                setupPayablePaginationControls();
            });
        }
        container.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = `px-3 py-1 rounded ${payableCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`;
    nextButton.disabled = payableCurrentPage === totalPages;
    if (payableCurrentPage < totalPages) {
        nextButton.addEventListener('click', () => {
            payableCurrentPage++;
            renderPayablesTable();
            setupPayablePaginationControls();
        });
    }
    container.appendChild(nextButton);

    const pageSizeElement = document.getElementById('payable-page-size');
    if (pageSizeElement) {
        pageSizeElement.addEventListener('change', function () {
            payablePageSize = parseInt(this.value);
            payableCurrentPage = 1;
            renderPayablesTable();
            setupPayablePaginationControls();
        });
    }
}

function setupPayableFilterEvents() {
    const applyFilterBtn = document.getElementById('apply-filter');
    const resetFilterBtn = document.getElementById('reset-filter');
    const searchInput = document.getElementById('search-payables');
    const vendorFilter = document.getElementById('vendor-filter');
    const statusFilter = document.getElementById('status-filter');

    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', filterPayables);
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetPayableFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterPayables);
    }

    if (vendorFilter) {
        vendorFilter.addEventListener('change', filterPayables);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterPayables);
    }
}

async function filterPayables() {
    try {
        console.log('Filtering payables');
        const searchTerm = document.getElementById('search-payables')?.value?.toLowerCase();
        const vendorId = document.getElementById('vendor-filter')?.value;
        const status = document.getElementById('status-filter')?.value;
        const dateFrom = document.getElementById('date-from-filter')?.value;
        const dateTo = document.getElementById('date-to-filter')?.value;

        console.log(`Filter criteria - Vendor: ${vendorId}, Status: ${status}, Date range: ${dateFrom} to ${dateTo}, Search: ${searchTerm}`);

        const allPayables = await window.dbService.getPayables() || [];
        let filtered = [...allPayables];

        if (vendorId) {
            filtered = filtered.filter(px => px.vendorId === vendorId);
        }

        if (status) {
            if (status === 'current') {
                filtered = filtered.filter(px => {
                    if (px.status === 'paid' || px.status === 'reversed') return false;
                    return !px.dueDate || new Date(px.dueDate) >= new Date();
                });
            } else if (status === 'overdue') {
                filtered = filtered.filter(px => {
                    if (px.status === 'paid' || px.status === 'reversed') return false;
                    return px.dueDate && new Date(px.dueDate) < new Date();
                });
            } else {
                filtered = filtered.filter(px => px.status === status);
            }
        }

        if (dateFrom && dateTo) {
            filtered = filtered.filter(px => px.date >= dateFrom && px.date <= dateTo);
        } else if (dateFrom) {
            filtered = filtered.filter(px => px.date >= dateFrom);
        } else if (dateTo) {
            filtered = filtered.filter(px => px.date <= dateTo);
        }

        if (searchTerm) {
            filtered = filtered.filter(px =>
                (px.id && px.id.toLowerCase().includes(searchTerm)) ||
                (px.purchaseId && px.purchaseId.toLowerCase().includes(searchTerm)) ||
                (px.vendor && px.vendor.toLowerCase().includes(searchTerm)) ||
                (px.reference && px.reference.toLowerCase().includes(searchTerm))
            );
        }

        console.log(`Filtered payables: ${filtered.length} of ${allPayables.length}`);

        payableFilteredItems = filtered;
        payableTotalItems = payableFilteredItems.length;
        payableCurrentPage = 1;

        renderPayablesTable();
        setupPayablePaginationControls();
    } catch (error) {
        console.error('Error filtering payables:', error);
        window.utils.showNotification('Error applying filters', 'error');
    }
}

function resetPayableFilters() {
    const searchInput = document.getElementById('search-payables');
    const vendorFilter = document.getElementById('vendor-filter');
    const statusFilter = document.getElementById('status-filter');
    const dateFromFilter = document.getElementById('date-from-filter');
    const dateToFilter = document.getElementById('date-to-filter');

    if (searchInput) searchInput.value = '';
    if (vendorFilter) vendorFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (dateFromFilter) dateFromFilter.value = window.utils.getDateDaysAgo(30);
    if (dateToFilter) dateToFilter.value = window.utils.getTodayDate();

    loadPayables();
}

function attachPayableActionListeners() {
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id');
            try {
                const payables = await window.dbService.getPayables();
                const payable = payables.find(p => p.id === id);

                if (payable) {
                    showPayableDetailsModal(payable);
                } else {
                    window.utils.showNotification('Payable not found', 'error');
                }
            } catch (error) {
                console.error(`Error getting payable ${id}:`, error);
                window.utils.showNotification('Error loading payable details', 'error');
            }
        });
    });
}

function showPayableDetailsModal(payable) {
    try {
        const modal = document.getElementById('payable-details-modal');
        const titleElem = document.getElementById('payable-details-title');
        const contentElem = document.getElementById('payable-details-content');
        const paymentBtn = document.getElementById('make-payment-btn');

        if (!modal || !titleElem || !contentElem || !paymentBtn) {
            console.error('Payable details modal elements not found');
            return;
        }

        titleElem.textContent = `Payable Details: ${payable.id || payable.purchaseId || 'Unknown'}`;

        let status = 'Current';
        let statusClass = 'text-green-600';

        if (payable.status === 'paid') {
            status = 'Paid';
            statusClass = 'text-gray-600';
        } else if (payable.status === 'reversed') {
            status = 'Reversed';
            statusClass = 'text-gray-600';
        } else if (payable.dueDate && new Date(payable.dueDate) < new Date()) {
            status = 'Overdue';
            statusClass = 'text-red-600';
        }

        contentElem.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                  <p class="text-sm text-gray-500">Vendor</p>
                  <p class="font-medium">${payable.vendor || 'N/A'}</p>
              </div>
              
              <div>
                  <p class="text-sm text-gray-500">Amount</p>
                  <p class="font-medium">${window.utils.formatCurrency(payable.amount || 0)}</p>
              </div>
              
              <div>
                  <p class="text-sm text-gray-500">Date</p>
                  <p class="font-medium">${payable.date || 'N/A'}</p>
              </div>
              
              <div>
                  <p class="text-sm text-gray-500">Status</p>
                  <p class="font-medium ${statusClass}">${status}</p>
              </div>
              
              ${payable.dueDate ? `
              <div>
                  <p class="text-sm text-gray-500">Due Date</p>
                  <p class="font-medium">${payable.dueDate}</p>
              </div>
              ` : ''}
              
              ${payable.purchaseId ? `
              <div>
                  <p class="text-sm text-gray-500">Purchase Reference</p>
                  <p class="font-medium">${payable.purchaseId}</p>
              </div>
              ` : ''}
              
              ${payable.reference ? `
              <div>
                  <p class="text-sm text-gray-500">Reference</p>
                  <p class="font-medium">${payable.reference}</p>
              </div>
              ` : ''}
              
              ${payable.paymentDate ? `
              <div>
                  <p class="text-sm text-gray-500">Payment Date</p>
                  <p class="font-medium">${payable.paymentDate}</p>
              </div>
              ` : ''}
              
              ${payable.paymentMethod ? `
              <div>
                  <p class="text-sm text-gray-500">Payment Method</p>
                  <p class="font-medium">${payable.paymentMethod}</p>
              </div>
              ` : ''}
              
              ${payable.chequeNumber ? `
              <div>
                  <p class="text-sm text-gray-500">Cheque Number</p>
                  <p class="font-medium">${payable.chequeNumber}</p>
              </div>
              ` : ''}
          </div>
      `;

        modal.classList.remove('opacity-0');
        modal.classList.remove('pointer-events-none');

        document.getElementById('close-details-modal').addEventListener('click', closePayableDetailsModal);
        document.getElementById('close-details-btn').addEventListener('click', closePayableDetailsModal);


        function closePayableDetailsModal() {
            modal.classList.add('opacity-0');
            modal.classList.add('pointer-events-none');
        }
    } catch (error) {
        console.error('Error showing payable details:', error);
        window.utils.showNotification('Error displaying details', 'error');
    }
}

function showPayablePaymentModal(payable) {
    try {
        const modal = document.getElementById('payment-modal');
        const titleElem = document.getElementById('payment-modal-title');
        const vendorElem = document.getElementById('payment-vendor-name');
        const amountDisplayElem = document.getElementById('payment-amount-display');
        const payableIdInput = document.getElementById('payableId');
        const amountInput = document.getElementById('paymentAmount');
        const dateInput = document.getElementById('paymentDate');
        const paymentMethodSelect = document.getElementById('paymentMethod');

        if (!modal || !titleElem || !vendorElem || !amountDisplayElem || !payableIdInput ||
            !amountInput || !dateInput || !paymentMethodSelect) {
            console.error('Payment modal elements not found');
            return;
        }

        titleElem.textContent = `Make Payment for ${payable.id}`;
        vendorElem.textContent = payable.vendor || 'Unknown';
        amountDisplayElem.textContent = window.utils.formatCurrency(payable.amount || 0);
        payableIdInput.value = payable.id;
        amountInput.value = payable.amount || 0;
        dateInput.value = window.utils.getTodayDate();

        paymentMethodSelect.addEventListener('change', function () {
            const chequeField = document.getElementById('cheque-field');
            if (chequeField) {
                chequeField.classList.toggle('hidden', this.value !== 'cheque');
            }
        });

        modal.classList.remove('opacity-0');
        modal.classList.remove('pointer-events-none');

        document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
        document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
        document.getElementById('payment-form').addEventListener('submit', function (e) {
            e.preventDefault();
            processPayablePayment();
        });

        function closePaymentModal() {
            modal.classList.add('opacity-0');
            modal.classList.add('pointer-events-none');
            document.getElementById('payment-form').reset();
        }
    } catch (error) {
        console.error('Error showing payment modal:', error);
        window.utils.showNotification('Error preparing payment form', 'error');
    }
}

async function processPayablePayment() {
    try {
        const payableId = document.getElementById('payableId').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const date = document.getElementById('paymentDate').value;
        const reference = document.getElementById('paymentReference').value;
        const chequeNumber = paymentMethod === 'cheque' ? document.getElementById('chequeNumber').value : null;

        if (!payableId) {
            window.utils.showNotification('Payable ID is required', 'error');
            return;
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            window.utils.showNotification('Please enter a valid amount', 'error');
            return;
        }

        if (paymentMethod === 'cheque' && !chequeNumber) {
            window.utils.showNotification('Please enter a cheque number', 'error');
            return;
        }

        const payables = await window.dbService.getPayables();
        const payable = payables.find(p => p.id === payableId);

        if (!payable) {
            window.utils.showNotification('Payable not found', 'error');
            return;
        }

        const paymentId = `PAY-${Date.now().toString().substring(7)}`;

        if (paymentMethod === 'cash') {
            await window.dbService.addCashTransaction({
                date,
                description: `Payment to ${payable.vendor}`,
                reference: reference || paymentId,
                cashIn: 0,
                cashOut: amount,
                vendorId: payable.vendorId
            });
        } else if (paymentMethod === 'bank' || paymentMethod === 'cheque') {
            await window.dbService.addBankTransaction({
                date,
                description: `Payment to ${payable.vendor}`,
                reference: reference || paymentId,
                deposit: 0,
                withdrawal: amount,
                vendorId: payable.vendorId,
                chequeNumber: chequeNumber
            });
        }

        payable.status = 'paid';
        payable.paymentDate = date;
        payable.paymentMethod = paymentMethod;
        payable.paymentReference = reference || paymentId;

        if (chequeNumber) {
            payable.chequeNumber = chequeNumber;
        }

        await window.dbService.updatePayable(payableId, payable);

        if (payable.vendorId) {
            await window.dbService.addCustomerTransaction(payable.vendorId, {
                date,
                description: `Payment made for ${payable.id}`,
                type: 'Payment',
                debit: 0,
                credit: amount,
                reference: paymentId,
                balance: 0
            });
        }

        const paymentRecord = {
            id: paymentId,
            date,
            vendor: payable.vendor,
            vendorId: payable.vendorId,
            title: `Payment for ${payable.id}`,
            description: `Made payment for invoice ${payable.id}`,
            amount,
            type: paymentMethod === 'cheque' ? 'Bank' : (paymentMethod === 'cash' ? 'Cash' : 'Bank'),
            reference: reference || `INV-${payable.id}`,
            createdAt: new Date().toISOString()
        };

        if (chequeNumber) {
            paymentRecord.chequeNumber = chequeNumber;
        }

        await window.dbService.addPayment(paymentRecord);

        document.getElementById('payment-modal').classList.add('opacity-0');
        document.getElementById('payment-modal').classList.add('pointer-events-none');

        await loadPayables();

        window.utils.showNotification('Payment made successfully', 'success');
    } catch (error) {
        console.error('Error processing payment:', error);
        window.utils.showNotification('Failed to process payment', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    
    if (document.getElementById('cash-ledger-body')) {
        loadCashLedger();
        setupCashLedgerEvents(); 
    }
    
    
    if (document.getElementById('bank-ledger-body')) {
        loadBankLedger();
        setupBankLedgerEvents(); 
    }
    
    
    if (document.getElementById('receivables-body')) {
        loadReceivables();
    }
    
    
    if (document.getElementById('payables-body')) {
        loadPayables();
    }
});


if (!window.utils.getDateDaysAgo) {
    window.utils.getDateDaysAgo = function (days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    };
}

if (!window.dbService.updateReceivable) {
    window.dbService.updateReceivable = async function (id, updates) {
        try {
            const receivables = await window.dbService.getReceivables() || [];
            const index = receivables.findIndex(r => r.id === id);

            if (index !== -1) {
                receivables[index] = { ...receivables[index], ...updates };

                if (window.db && typeof window.db.set === 'function') {
                    await window.db.set('receivables', receivables);
                } else {
                    localStorage.setItem('receivables', JSON.stringify(receivables));
                }

                return receivables[index];
            }
            throw new Error(`Receivable with id ${id} not found`);
        } catch (error) {
            console.error(`Error updating receivable ${id}:`, error);
            throw error;
        }
    };
}

if (!window.dbService.updatePayable) {
    window.dbService.updatePayable = async function (id, updates) {
        try {
            const payables = await window.dbService.getPayables() || [];
            const index = payables.findIndex(p => p.id === id);

            if (index !== -1) {
                payables[index] = { ...payables[index], ...updates };


                if (window.db && typeof window.db.set === 'function') {
                    await window.db.set('payables', payables);
                } else {
                    localStorage.setItem('payables', JSON.stringify(payables));
                }

                return payables[index];
            }
            throw new Error(`Payable with id ${id} not found`);
        } catch (error) {
            console.error(`Error updating payable ${id}:`, error);
            throw error;
        }
    };
}

if (!window.dbService.addReceipt) {
    window.dbService.addReceipt = async function (receipt) {
        try {
            const receipts = await window.dbService.getReceipts() || [];
            receipts.push(receipt);


            if (window.db && typeof window.db.set === 'function') {
                await window.db.set('receipts', receipts);
            } else {
                localStorage.setItem('receipts', JSON.stringify(receipts));
            }

            return receipt;
        } catch (error) {
            console.error('Error adding receipt:', error);
            throw error;
        }
    };
}

if (!window.dbService.getReceipts) {
    window.dbService.getReceipts = async function () {
        try {
            if (window.db && typeof window.db.get === 'function') {
                return await window.db.get('receipts') || [];
            } else {
                const stored = localStorage.getItem('receipts');
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.error('Error getting receipts:', error);
            return [];
        }
    };
}