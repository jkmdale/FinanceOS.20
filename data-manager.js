/**
 * FinanceOS Data Manager
 * Handles CSV processing, data integration, and cross-page data flow
 */

class FinanceOSDataManager {
    constructor() {
        this.storageKeys = {
            CSV_DATA: 'csvData',
            CSV_UPLOAD_DATE: 'csvUploadDate',
            USER_GOALS: 'userGoals',
            PRIVACY_MODE: 'privacyMode',
            PROCESSED_TRANSACTIONS: 'processedTransactions',
            CATEGORIES: 'transactionCategories',
            BUDGET_DATA: 'budgetData',
            ACCOUNT_BALANCES: 'accountBalances'
        };
        
        this.bankFormats = {
            ANZ: {
                name: 'ANZ Bank',
                fields: ['Date', 'Amount', 'Description', 'Balance'],
                dateFormat: 'DD/MM/YYYY',
                identifier: (headers) => headers.includes('Date') && headers.includes('Balance')
            },
            ASB: {
                name: 'ASB Bank',
                fields: ['Date', 'Unique Id', 'Tran Type', 'Cheque Number', 'Payee', 'Memo', 'Amount'],
                dateFormat: 'DD/MM/YYYY',
                identifier: (headers) => headers.includes('Unique Id') || headers.includes('Tran Type')
            },
            BNZ: {
                name: 'BNZ Bank',
                fields: ['Date', 'Amount', 'Payee', 'Description', 'Reference', 'Transaction Type'],
                dateFormat: 'DD/MM/YYYY',
                identifier: (headers) => headers.includes('Payee') && headers.includes('Reference')
            },
            KIWIBANK: {
                name: 'Kiwibank',
                fields: ['Date', 'Memo/Description', 'Amount', 'Balance'],
                dateFormat: 'DD/MM/YYYY',
                identifier: (headers) => headers.includes('Memo/Description') || headers.includes('Memo')
            },
            WESTPAC: {
                name: 'Westpac',
                fields: ['Date', 'Amount', 'Other Party', 'Description', 'Reference', 'Particulars', 'Code', 'Reference', 'Balance'],
                dateFormat: 'DD/MM/YYYY',
                identifier: (headers) => headers.includes('Other Party') || headers.includes('Particulars')
            }
        };
        
        this.categories = {
            'Groceries': ['countdown', 'pak n save', 'new world', 'fresh choice', 'four square', 'woolworths'],
            'Fuel': ['bp ', 'z energy', 'mobil', 'caltex', 'gull', 'challenge'],
            'Dining Out': ['mcdonald', 'burger king', 'kfc', 'subway', 'pizza', 'restaurant', 'cafe', 'bar'],
            'Banking': ['fee', 'interest', 'loan', 'mortgage', 'overdraft'],
            'Housing': ['rent', 'mortgage', 'rates', 'insurance', 'power', 'gas', 'water'],
            'Transportation': ['uber', 'taxi', 'bus', 'train', 'parking', 'registration'],
            'Shopping': ['amazon', 'trademe', 'warehouse', 'farmers', 'kmart', 'briscoes'],
            'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'dentist'],
            'Utilities': ['spark', 'vodafone', '2degrees', 'sky', 'netflix', 'spotify'],
            'Income': ['salary', 'wages', 'refund', 'cashback', 'dividend', 'interest credit']
        };
    }

    // =============================================
    // CSV PROCESSING METHODS
    // =============================================

    /**
     * Process CSV files and return structured transaction data
     */
    async processCSVFiles(files) {
        const results = {
            transactions: [],
            errors: [],
            summary: {
                totalFiles: files.length,
                totalTransactions: 0,
                newTransactions: 0,
                duplicates: 0,
                categorized: 0,
                dateRange: null
            }
        };

        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const fileResults = this.parseCSVContent(content, file.name);
                
                results.transactions.push(...fileResults.transactions);
                results.errors.push(...fileResults.errors);
                
            } catch (error) {
                results.errors.push({
                    file: file.name,
                    error: `Failed to read file: ${error.message}`
                });
            }
        }

        // Process transactions
        const existingData = this.getStoredData(this.storageKeys.CSV_DATA) || [];
        const processedResults = this.processTransactions(results.transactions, existingData);
        
        results.summary.totalTransactions = results.transactions.length;
        results.summary.newTransactions = processedResults.newTransactions.length;
        results.summary.duplicates = processedResults.duplicates.length;
        results.summary.categorized = processedResults.newTransactions.filter(t => t.category !== 'Uncategorized').length;
        results.summary.dateRange = this.getDateRange(processedResults.newTransactions);

        return {
            ...results,
            newTransactions: processedResults.newTransactions,
            duplicates: processedResults.duplicates
        };
    }

    /**
     * Parse CSV content and return transactions
     */
    parseCSVContent(content, filename) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return { transactions: [], errors: [{ file: filename, error: 'File appears to be empty or invalid' }] };
        }

        const headers = this.parseCSVLine(lines[0]);
        const bankFormat = this.detectBankFormat(headers);
        
        const transactions = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);
                const transaction = this.mapToStandardFormat(values, headers, bankFormat);
                
                if (transaction) {
                    transaction.sourceFile = filename;
                    transaction.bankFormat = bankFormat;
                    transaction.rawData = values;
                    transactions.push(transaction);
                }
            } catch (error) {
                errors.push({
                    file: filename,
                    line: i + 1,
                    error: error.message
                });
            }
        }

        return { transactions, errors };
    }

    /**
     * Parse a single CSV line handling quotes and commas
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result.map(field => field.replace(/^"|"$/g, ''));
    }

    /**
     * Detect bank format from headers
     */
    detectBankFormat(headers) {
        const headerStr = headers.join(',').toLowerCase();
        
        for (const [format, config] of Object.entries(this.bankFormats)) {
            if (config.identifier(headerStr.split(','))) {
                return format;
            }
        }
        
        return 'GENERIC';
    }

    /**
     * Map CSV values to standard transaction format
     */
    mapToStandardFormat(values, headers, bankFormat) {
        const transaction = {
            id: this.generateTransactionId(),
            date: null,
            amount: 0,
            description: '',
            category: 'Uncategorized',
            balance: null,
            reference: '',
            otherParty: '',
            processedDate: new Date().toISOString()
        };

        // Generic field mapping
        const fieldMappings = {
            date: ['date', 'transaction date', 'value date'],
            amount: ['amount', 'transaction amount', 'debit amount', 'credit amount'],
            description: ['description', 'memo', 'memo/description', 'particulars', 'narrative'],
            balance: ['balance', 'running balance', 'account balance'],
            reference: ['reference', 'your reference', 'customer reference'],
            otherParty: ['payee', 'other party', 'counterparty']
        };

        // Map fields based on headers
        headers.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase().trim();
            const value = values[index] ? values[index].trim() : '';

            // Date field
            if (fieldMappings.date.some(field => normalizedHeader.includes(field))) {
                transaction.date = this.parseDate(value);
            }
            
            // Amount field
            else if (fieldMappings.amount.some(field => normalizedHeader.includes(field))) {
                transaction.amount = this.parseAmount(value);
            }
            
            // Description field
            else if (fieldMappings.description.some(field => normalizedHeader.includes(field))) {
                if (!transaction.description || value.length > transaction.description.length) {
                    transaction.description = value;
                }
            }
            
            // Balance field
            else if (fieldMappings.balance.some(field => normalizedHeader.includes(field))) {
                transaction.balance = this.parseAmount(value);
            }
            
            // Reference field
            else if (fieldMappings.reference.some(field => normalizedHeader.includes(field))) {
                transaction.reference = value;
            }
            
            // Other party field
            else if (fieldMappings.otherParty.some(field => normalizedHeader.includes(field))) {
                transaction.otherParty = value;
            }
        });

        // Validate essential fields
        if (!transaction.date || transaction.amount === 0) {
            return null;
        }

        // Auto-categorize
        transaction.category = this.categorizeTransaction(transaction.description);

        return transaction;
    }

    /**
     * Parse date from various formats
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Try different date formats common in NZ banks
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,     // DD/MM/YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/,       // YYYY-MM-DD
            /(\d{1,2})-(\d{1,2})-(\d{4})/,       // DD-MM-YYYY
            /(\d{1,2})\.(\d{1,2})\.(\d{4})/      // DD.MM.YYYY
        ];

        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let day, month, year;
                
                if (format === formats[1]) { // YYYY-MM-DD
                    [, year, month, day] = match;
                } else { // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
                    [, day, month, year] = match;
                }
                
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }

        // Fallback to Date constructor
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
    }

    /**
     * Parse amount handling various currency formats
     */
    parseAmount(amountStr) {
        if (!amountStr) return 0;
        
        // Remove currency symbols, spaces, and handle negatives
        let cleanAmount = amountStr.toString()
            .replace(/[$,\s]/g, '')
            .replace(/[()]/g, '')  // Remove parentheses
            .trim();
        
        // Handle negative indicators
        const isNegative = amountStr.includes('(') || amountStr.includes('-') || 
                          amountStr.toLowerCase().includes('dr') ||
                          amountStr.toLowerCase().includes('debit');
        
        // Extract numeric value
        const numericMatch = cleanAmount.match(/\d+\.?\d*/);
        if (!numericMatch) return 0;
        
        let amount = parseFloat(numericMatch[0]);
        return isNegative ? -Math.abs(amount) : amount;
    }

    /**
     * Automatically categorize transaction based on description
     */
    categorizeTransaction(description) {
        if (!description) return 'Uncategorized';
        
        const desc = description.toLowerCase();
        
        for (const [category, keywords] of Object.entries(this.categories)) {
            if (keywords.some(keyword => desc.includes(keyword))) {
                return category;
            }
        }
        
        // Special patterns
        if (desc.includes('eftpos') || desc.includes('atm')) {
            return 'Cash Withdrawal';
        }
        
        if (desc.includes('transfer') || desc.includes('tfr')) {
            return 'Transfer';
        }
        
        if (desc.includes('fee') && !desc.includes('coffee')) {
            return 'Bank Fees';
        }
        
        return 'Uncategorized';
    }

    // =============================================
    // TRANSACTION PROCESSING
    // =============================================

    /**
     * Process transactions to identify duplicates and new entries
     */
    processTransactions(newTransactions, existingTransactions) {
        const duplicates = [];
        const uniqueTransactions = [];
        
        for (const transaction of newTransactions) {
            const isDuplicate = existingTransactions.some(existing => 
                this.areTransactionsSimilar(transaction, existing)
            );
            
            if (isDuplicate) {
                duplicates.push(transaction);
            } else {
                uniqueTransactions.push(transaction);
            }
        }
        
        return {
            newTransactions: uniqueTransactions,
            duplicates: duplicates
        };
    }

    /**
     * Check if two transactions are similar (potential duplicates)
     */
    areTransactionsSimilar(t1, t2) {
        return t1.date === t2.date &&
               Math.abs(t1.amount - t2.amount) < 0.01 &&
               this.normalizeDescription(t1.description) === this.normalizeDescription(t2.description);
    }

    /**
     * Normalize description for comparison
     */
    normalizeDescription(description) {
        return description.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim();
    }

    /**
     * Generate unique transaction ID
     */
    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get date range from transactions
     */
    getDateRange(transactions) {
        if (!transactions.length) return null;
        
        const dates = transactions.map(t => new Date(t.date)).sort();
        return {
            start: dates[0].toISOString().split('T')[0],
            end: dates[dates.length - 1].toISOString().split('T')[0],
            startFormatted: dates[0].toLocaleDateString(),
            endFormatted: dates[dates.length - 1].toLocaleDateString()
        };
    }

    // =============================================
    // DATA STORAGE AND RETRIEVAL
    // =============================================

    /**
     * Store processed CSV data
     */
    storeCSVData(transactions) {
        const existingData = this.getStoredData(this.storageKeys.CSV_DATA) || [];
        const mergedData = [...existingData, ...transactions];
        
        this.setStoredData(this.storageKeys.CSV_DATA, mergedData);
        this.setStoredData(this.storageKeys.CSV_UPLOAD_DATE, new Date().toISOString());
        
        // Update derived data
        this.updateAccountBalances(mergedData);
        this.updateBudgetData(mergedData);
        
        return mergedData;
    }

    /**
     * Get stored data with fallback
     */
    getStoredData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error retrieving ${key}:`, error);
            return null;
        }
    }

    /**
     * Set stored data with error handling
     */
    setStoredData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error storing ${key}:`, error);
            return false;
        }
    }

    /**
     * Get CSV data status for display across pages
     */
    getCSVStatus() {
        const csvData = this.getStoredData(this.storageKeys.CSV_DATA);
        const uploadDate = this.getStoredData(this.storageKeys.CSV_UPLOAD_DATE);
        
        if (!csvData || !csvData.length) {
            return {
                hasData: false,
                message: 'No recent CSV data found.',
                transactions: 0,
                lastUpdate: null
            };
        }
        
        return {
            hasData: true,
            transactions: csvData.length,
            lastUpdate: uploadDate,
            lastUpdateFormatted: new Date(uploadDate).toLocaleDateString(),
            dateRange: this.getDateRange(csvData)
        };
    }

    // =============================================
    // BUDGET AND ANALYSIS METHODS
    // =============================================

    /**
     * Update account balances based on transaction data
     */
    updateAccountBalances(transactions) {
        const balances = {};
        
        // Calculate running balances per account
        transactions.forEach(transaction => {
            if (transaction.balance !== null) {
                const account = this.inferAccountFromTransaction(transaction);
                balances[account] = transaction.balance;
            }
        });
        
        this.setStoredData(this.storageKeys.ACCOUNT_BALANCES, balances);
        return balances;
    }

    /**
     * Update budget data based on spending patterns
     */
    updateBudgetData(transactions) {
        const budgetData = {
            categories: {},
            monthlyTotals: {},
            trends: {}
        };
        
        // Group transactions by category and month
        transactions.forEach(transaction => {
            const month = transaction.date.substring(0, 7); // YYYY-MM
            const category = transaction.category;
            
            if (!budgetData.categories[category]) {
                budgetData.categories[category] = { total: 0, count: 0, months: {} };
            }
            
            if (!budgetData.categories[category].months[month]) {
                budgetData.categories[category].months[month] = 0;
            }
            
            budgetData.categories[category].total += Math.abs(transaction.amount);
            budgetData.categories[category].count += 1;
            budgetData.categories[category].months[month] += Math.abs(transaction.amount);
            
            if (!budgetData.monthlyTotals[month]) {
                budgetData.monthlyTotals[month] = 0;
            }
            budgetData.monthlyTotals[month] += Math.abs(transaction.amount);
        });
        
        this.setStoredData(this.storageKeys.BUDGET_DATA, budgetData);
        return budgetData;
    }

    /**
     * Infer account from transaction data
     */
    inferAccountFromTransaction(transaction) {
        // This would be more sophisticated in a real implementation
        // For now, use source file or other indicators
        if (transaction.sourceFile) {
            return transaction.sourceFile.replace(/\.[^/.]+$/, '');
        }
        return 'Unknown Account';
    }

    /**
     * Generate spending insights for goals page
     */
    generateSpendingInsights() {
        const csvData = this.getStoredData(this.storageKeys.CSV_DATA);
        if (!csvData || !csvData.length) {
            return {
                monthlySpending: 0,
                topCategories: [],
                trends: [],
                goalImpact: 'No data available for analysis'
            };
        }
        
        const recentMonth = this.getRecentMonthData(csvData);
        const topCategories = this.getTopSpendingCategories(recentMonth);
        const monthlyAverage = this.calculateMonthlyAverage(csvData);
        
        return {
            monthlySpending: monthlyAverage,
            topCategories: topCategories,
            trends: this.calculateSpendingTrends(csvData),
            goalImpact: this.calculateGoalImpact(monthlyAverage)
        };
    }

    /**
     * Get recent month transaction data
     */
    getRecentMonthData(transactions) {
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        
        return transactions.filter(t => t.date.startsWith(currentMonth));
    }

    /**
     * Get top spending categories
     */
    getTopSpendingCategories(transactions) {
        const categoryTotals = {};
        
        transactions.forEach(t => {
            if (t.amount < 0) { // Expenses only
                if (!categoryTotals[t.category]) {
                    categoryTotals[t.category] = 0;
                }
                categoryTotals[t.category] += Math.abs(t.amount);
            }
        });
        
        return Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, amount]) => ({ category, amount }));
    }

    /**
     * Calculate monthly spending average
     */
    calculateMonthlyAverage(transactions) {
        if (!transactions.length) return 0;
        
        const expenses = transactions.filter(t => t.amount < 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Estimate months covered
        const dateRange = this.getDateRange(transactions);
        if (!dateRange) return 0;
        
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth()) + 1;
        
        return totalExpenses / monthsDiff;
    }

    /**
     * Calculate spending trends
     */
    calculateSpendingTrends(transactions) {
        // Implementation for trend analysis
        return [];
    }

    /**
     * Calculate goal impact based on spending
     */
    calculateGoalImpact(monthlySpending) {
        const emergencyFundTarget = 15000;
        const savingsRate = 0.1; // 10%
        
        const monthlySavings = monthlySpending * savingsRate;
        const monthsToEmergencyFund = Math.ceil(emergencyFundTarget / monthlySavings);
        
        return `Based on 10% savings rate from your $${monthlySpending.toFixed(0)} monthly spending, ` +
               `you could build your emergency fund in ${monthsToEmergencyFund} months.`;
    }

    // =============================================
    // UTILITY METHODS
    // =============================================

    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Export data as CSV
     */
    exportToCSV(data, filename = 'financeos-export.csv') {
        if (!data || !data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');
        
        this.downloadCSV(csvContent, filename);
    }

    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Clear all stored data
     */
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

// =============================================
// GLOBAL INSTANCE AND HELPERS
// =============================================

// Create global instance
window.FinanceOSData = new FinanceOSDataManager();

// Helper functions for cross-page integration
window.FinanceOSHelpers = {
    // Update CSV status across all pages
    updateCSVStatus: function() {
        const statusElements = document.querySelectorAll('[id*="csvStatus"], [id*="csvAlert"]');
        const status = window.FinanceOSData.getCSVStatus();
        
        statusElements.forEach(element => {
            if (status.hasData) {
                element.className = element.className.replace('no-data', '');
                element.innerHTML = `✅ CSV data loaded: ${status.transactions} transactions. Last updated: ${status.lastUpdateFormatted}`;
            } else {
                element.className += ' no-data';
                element.innerHTML = '📊 No recent CSV data found. <a href="csv-upload.html" style="color: #f59e0b;">Upload bank statements</a> to see transaction analysis.';
            }
        });
    },

    // Update goal insights with CSV data
    updateGoalInsights: function() {
        const insights = window.FinanceOSData.generateSpendingInsights();
        const insightElement = document.getElementById('csvInsight');
        
        if (insightElement && insights.monthlySpending > 0) {
            insightElement.innerHTML = insights.goalImpact;
        }
    },

    // Privacy mode management
    updatePrivacyMode: function(privacyMode) {
        const mainContent = document.getElementById('mainContent');
        const privacyToggle = document.getElementById('privacyToggle');
        
        if (mainContent && privacyToggle) {
            if (privacyMode) {
                mainContent.classList.add('privacy-mode');
                privacyToggle.textContent = '🔓 Show Data';
                privacyToggle.classList.add('active');
            } else {
                mainContent.classList.remove('privacy-mode');
                privacyToggle.textContent = '🔒 Privacy Mode';
                privacyToggle.classList.remove('active');
            }
        }
    },

    // Initialize page with data
    initializePage: function() {
        this.updateCSVStatus();
        this.updateGoalInsights();
        
        // Setup privacy mode
        const privacyMode = localStorage.getItem('privacyMode') === 'true';
        this.updatePrivacyMode(privacyMode);
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.FinanceOSHelpers.initializePage();
    });
} else {
    window.FinanceOSHelpers.initializePage();
}

console.log('FinanceOS Data Manager loaded successfully');