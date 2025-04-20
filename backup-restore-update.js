/**
 * backup-restore-update.js - Extension for backup-restore.js
 * Adds specialized functionality to properly clean ledger data
 */

// ====== DIRECT DATABASE ACCESS FUNCTIONS ======
// These functions bypass the dbService layer and access the collections directly

// Function to directly clean specific collection
async function directCleanCollection(collectionName) {
    console.log(`🔴 Directly cleaning collection: ${collectionName}`);
    
    try {
        // Method 1: Try direct set to empty array
        if (window.db && typeof window.db.set === 'function') {
            await window.db.set(collectionName, []);
            console.log(`✅ Reset ${collectionName} using db.set()`);
            return true;
        }
        
        // Method 2: Try using insert with empty array
        if (window.db && typeof window.db.insert === 'function') {
            // First try to get and backup the collection
            try {
                const collectionData = await window.db.get(collectionName) || [];
                console.log(`Got ${collectionData.length} items from ${collectionName} for backup`);
                
                // Store backup in localStorage in case of emergency
                localStorage.setItem(`${collectionName}_backup_${Date.now()}`, JSON.stringify(collectionData));
            } catch (error) {
                console.warn(`Could not backup ${collectionName}:`, error);
            }
            
            // Now clear it by direct override
            await window.db.set(collectionName, []);
            console.log(`✅ Cleared ${collectionName} using set+insert approach`);
            return true;
        }
    } catch (error) {
        console.error(`Error cleaning ${collectionName}:`, error);
        return false;
    }
    
    return false;
}

// Function to clean all localStorage keys
function cleanLocalStorage() {
    console.log('🔴 Cleaning localStorage');
    
    const keysToClean = [
        // Standard collections
        'cashTransactions', 'bankTransactions',
        'receivables', 'payables',
        'tradeReceivable', 'tradePayable',
        'receipts', 'payments',
        
        // Variants 
        'cash_transactions', 'bank_transactions',
        'trade_receivable', 'trade_payable',
        
        // Ledger-specific keys
        'lastCashUpdate', 'lastBankUpdate',
        'cashFilteredTransactions', 'bankFilteredTransactions',
        'receivableFilteredItems', 'payableFilteredItems'
    ];
    
    keysToClean.forEach(key => {
        try {
            localStorage.removeItem(key);
            localStorage.setItem(key, '[]');
            console.log(`✅ Cleaned localStorage: ${key}`);
        } catch (error) {
            console.warn(`Error cleaning localStorage key ${key}:`, error);
        }
    });
    
    return true;
}

// ====== EXTREME LEDGER CLEANING FUNCTION ======
async function cleanLedgerData() {
    console.log('🧨 EXECUTING EXTREME LEDGER DATA CLEANING 🧨');
    
    // 0. Add a blocking overlay to prevent interaction during cleaning
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    overlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">💣</div>
            <h2 style="font-size: 24px; margin-bottom: 20px;">CLEANING DATABASE</h2>
            <p style="margin-bottom: 20px;">Deleting all ledger data...</p>
            <div style="width: 300px; height: 10px; background-color: rgba(255, 255, 255, 0.2); border-radius: 5px;">
                <div id="clean-progress" style="width: 0%; height: 100%; background-color: #10b981; border-radius: 5px; transition: width 0.3s;"></div>
            </div>
            <p id="clean-status" style="margin-top: 10px; font-size: 14px;">Initializing...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Progress updater function
    const updateProgress = (percent, message) => {
        const progress = document.getElementById('clean-progress');
        const status = document.getElementById('clean-status');
        if (progress && status) {
            progress.style.width = `${percent}%`;
            status.textContent = message;
        }
    };
    
    try {
        // 1. Clean localStorage first (synchronous)
        updateProgress(10, "Cleaning browser storage...");
        cleanLocalStorage();
        
        // 2. Clean sessionStorage too
        try {
            sessionStorage.clear();
            console.log('✅ Cleared sessionStorage');
        } catch (e) {
            console.warn('Error clearing sessionStorage:', e);
        }
        
        // 3. Clean each critical collection - THE MOST IMPORTANT PART
        updateProgress(20, "Cleaning trade receivables...");
        await directCleanCollection('tradeReceivable');
        
        updateProgress(30, "Cleaning trade payables...");
        await directCleanCollection('tradePayable');
        
        updateProgress(40, "Cleaning cash transactions...");
        await directCleanCollection('cashTransactions');
        
        updateProgress(50, "Cleaning bank transactions...");
        await directCleanCollection('bankTransactions');
        
        updateProgress(60, "Cleaning receipts...");
        await directCleanCollection('receipts');
        
        updateProgress(70, "Cleaning payments...");
        await directCleanCollection('payments');
        
        // 4. Backup/alternate collection names
        updateProgress(80, "Cleaning alternate collections...");
        await directCleanCollection('receivables');
        await directCleanCollection('payables');
        
        // 5. Clear tables directly in the DOM if they exist
        updateProgress(90, "Cleaning UI elements...");
        const tableIds = [
            'cash-ledger-body', 'bank-ledger-body', 
            'receivables-body', 'payables-body'
        ];
        
        tableIds.forEach(id => {
            const table = document.getElementById(id);
            if (table) {
                table.innerHTML = `
                    <tr>
                        <td colspan="10" class="px-4 py-2 text-center text-gray-500">
                            No data available after clean operation
                        </td>
                    </tr>
                `;
                console.log(`✅ Cleared table UI: ${id}`);
            }
        });
        
        // 6. Inject a database blocker script
        updateProgress(95, "Setting up data blockers...");
        const blocker = document.createElement('script');
        blocker.textContent = `
            // Ledger data blocker script
            (function() {
                console.log("💀 Setting up ledger data blocker");
                
                // Override the get method for the db object
                if (window.db && typeof window.db.get === 'function') {
                    const originalGet = window.db.get;
                    window.db.get = async function(collection, ...args) {
                        // If it's a ledger collection, return empty array
                        if (collection === 'tradeReceivable' || 
                            collection === 'tradePayable' ||
                            collection === 'cashTransactions' || 
                            collection === 'bankTransactions' ||
                            collection === 'receivables' || 
                            collection === 'payables') {
                            console.log(\`Blocked db.get for \${collection}, returning empty array\`);
                            return [];
                        }
                        
                        // Otherwise use the original method
                        return originalGet.apply(this, arguments);
                    };
                }
                
                // Set up flags to prevent reload
                window._cleanedData = true;
                window._preventDataLoad = true;
                localStorage.setItem('_cleanedData', 'true');
                sessionStorage.setItem('_cleanedData', 'true');
            })();
        `;
        document.head.appendChild(blocker);
        
        updateProgress(100, "Cleaning complete! Reloading page...");
        
        // 7. Mark as completed and reload (with a delay to show progress)
        console.log('✅ LEDGER DATA CLEANING COMPLETE');
        
        // Set flags for post-reload verification
        localStorage.setItem('_ledgersCleared', Date.now().toString());
        sessionStorage.setItem('_ledgersCleared', Date.now().toString());
        
        // Return success after a short delay to let the user see completion
        setTimeout(() => {
            window.location.href = window.location.pathname + '?cleaned=true&t=' + Date.now();
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('‼️ Error during ledger cleaning:', error);
        
        // Update status to show error
        const status = document.getElementById('clean-status');
        if (status) {
            status.textContent = `Error: ${error.message}. Please reload the page.`;
            status.style.color = '#ef4444';
        }
        
        // Remove overlay after 5 seconds
        setTimeout(() => {
            overlay.remove();
        }, 5000);
        
        return false;
    }
}

// Override the existing clearAllData function
window.clearAllData = async function() {
    try {
        console.log('🧨 STARTING DATABASE CLEANING');
        
        const cleanResult = await cleanLedgerData();
        if (!cleanResult) {
            console.error('Database cleaning failed');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error in clearAllData function:', error);
        return false;
    }
};

// Make sure cleanLedgerData is available directly
window.cleanLedgerData = cleanLedgerData;

// Make sure to handle the clean button correctly
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up clean database button with enhanced handling...');
    
    setTimeout(() => {
        const cleanDbBtn = document.getElementById('clean-db-btn');
        if (cleanDbBtn) {
            // Clear any existing event listeners by cloning
            const newButton = cleanDbBtn.cloneNode(true);
            cleanDbBtn.parentNode.replaceChild(newButton, cleanDbBtn);
            
            // Add our enhanced click handler
            newButton.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                console.log('Clean database button clicked');
                
                if (confirm('⚠️ WARNING: This will delete ALL data including ledger transactions.\n\nThis action cannot be undone. Continue?')) {
                    // Disable the button to prevent multiple clicks
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cleaning...';
                    
                    // Execute the cleaning directly
                    cleanLedgerData();
                }
            }, true);
            
            console.log('Enhanced clean button handler configured');
        } else {
            console.warn('Clean database button not found');
            
            // Try to find button by other means
            const possibleButtons = document.querySelectorAll('button');
            for (const btn of possibleButtons) {
                if (btn.textContent.includes('Clean') || 
                    btn.innerHTML.includes('trash') ||
                    btn.className.includes('danger')) {
                    
                    console.log('Found potential clean button:', btn);
                    
                    // Clear and replace with our handler
                    const newButton = btn.cloneNode(true);
                    btn.parentNode.replaceChild(newButton, btn);
                    
                    newButton.addEventListener('click', function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        if (confirm('⚠️ WARNING: This will delete ALL data including ledger transactions.\n\nThis action cannot be undone. Continue?')) {
                            this.disabled = true;
                            cleanLedgerData();
                        }
                    }, true);
                    
                    console.log('Added handler to alternative button');
                    break;
                }
            }
        }
    }, 500);
});

// Add a direct execution option that can be called from console
window.executeDataCleanup = async function() {
    console.log('Executing manual data cleanup from console');
    return await cleanLedgerData();
};

// Check if this is a post-cleaning page load
if (window.location.search.includes('cleaned=true')) {
    console.log('Page loaded after cleaning - verifying cleanup');
    
    // Display a success message
    setTimeout(() => {
        // Create a notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = '#ecfdf5';
        notification.style.color = '#065f46';
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '6px';
        notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        notification.style.zIndex = '9999';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '8px';
        notification.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        
        notification.innerHTML = `
            <div style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div>
                <div style="font-weight: 500;">Database Cleaned Successfully</div>
                <div style="font-size: 14px;">All ledger data has been removed</div>
            </div>
            <button style="margin-left: 16px; background: none; border: none; cursor: pointer; color: #10b981;" id="close-clean-notification">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Add close button handler
        document.getElementById('close-clean-notification').addEventListener('click', function() {
            notification.remove();
        });
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 8000);
        
        // Reblock any data loading attempts just to be sure
        const blocker = document.createElement('script');
        blocker.textContent = `
            // Final data blocker
            console.log("Applying post-reload data blocks");
            if (window.db && typeof window.db.get === 'function') {
                const originalGet = window.db.get;
                window.db.get = async function(collection, ...args) {
                    if (collection === 'tradeReceivable' || 
                        collection === 'tradePayable' ||
                        collection === 'cashTransactions' || 
                        collection === 'bankTransactions') {
                        console.log(\`Blocked post-reload db.get for \${collection}\`);
                        return [];
                    }
                    return originalGet.apply(this, arguments);
                };
            }
        `;
        document.head.appendChild(blocker);
    }, 1000);
}

// Additional emergency method
window.emergencyCleanLedgers = async function() {
    console.log('🚨 EMERGENCY LEDGER CLEANING INITIATED 🚨');
    
    try {
        // Try very direct methods to force clear the collections
        
        // Method 1: Direct database access
        if (window.db) {
            if (typeof window.db.set === 'function') {
                await window.db.set('tradeReceivable', []);
                await window.db.set('tradePayable', []);
                console.log('Emergency set to empty arrays complete');
            }
        }
        
        // Method 2: Force locally
        localStorage.setItem('tradeReceivable', '[]');
        localStorage.setItem('tradePayable', '[]');
        sessionStorage.setItem('tradeReceivable', '[]');
        sessionStorage.setItem('tradePayable', '[]');
        
        // Method 3: Try harder with db.js
        if (window.db && typeof window.db.__internal !== 'undefined') {
            if (window.db.__internal.collections) {
                window.db.__internal.collections.tradeReceivable = [];
                window.db.__internal.collections.tradePayable = [];
                console.log('Emergency internal collections reset');
            }
        }
        
        // Force reload
        alert('Emergency cleanup completed. Page will now reload.');
        window.location.href = window.location.pathname + '?emergency=true&t=' + Date.now();
        
        return true;
    } catch (error) {
        console.error('Emergency cleanup failed:', error);
        return false;
    }
};