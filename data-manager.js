// FinanceOS Data Manager
// Handles CSV processing, transaction management, and financial calculations

class FinanceOSDataManager {
    constructor() {
        this.csvData = [];
        this.transactions = [];
        this.accounts = this.getDefaultAccounts();
        this.budgetCategories = this.getDefaultBudgetCategories();
        this.goals = this.getDefaultGoals();
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupEventListeners();
    }

    // Default account data based on user's real financial situation
    getDefaultAccounts() {
        return [
            {
                id: 'spending',
                name: 'My Spending',
                type: 'checking',
                balance: 25.92,
                available: 25.92,
                isJoint: false,
                icon: '💳',
                gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
            },
            {
                id: 'savings',
                name: 'My Savings',
                type: 'savings',
                balance: 0.17,
                available: 0.17,
                isJoint: false,
                icon: '💰',
                gradient: 'linear-gradient(135deg, #10b981, #059669)'
            },
            {
                id: 'house-kitty',
                name: 'House Kitty',
                type: 'savings',
                balance: 65357.00,
                available: 65357.00,
                isJoint: true,
                icon: '🏠',
                gradient: 'linear-gradient(135deg, #8b5cf6, #9333ea)'
            },
            {
                id: 'mortgage-billing',
                name: 'Mortgage And Billing',
                type: 'checking',
                balance: 126.35,
                available: 126.35,
                isJoint: true,
                icon: '🧾',
                gradient: 'linear-gradient(135deg, #f97316, #ea580c)'
            },
            {
                id: 'holding',
                name: 'Holding',
                type: 'savings',
                balance: 240.40,
                available: 240.40,
                isJoint: true,
                icon: '⏳',
                gradient: 'linear-gradient(135deg, #eab308, #ca8a04)'
            },
            {
                id: 'visa',
                name: 'Low Rate Visa',
                type: 'credit',
                balance: -3251.30,
                available: 6748.70,
                isJoint: false,
                icon: '💳',
                gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
            },
            {
                id: 'home-loan',
                name: 'Home Loans',
                type: 'loan',
                balance: -271600.02,
                available: 0,
                isJoint: true,
                icon: '🏠',
                gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)'
            },
            {
                id: 'kiwisaver',
                name: 'ANZ KiwiSaver Scheme',
                type: 'investment',
                balance: 48733.44,
                available: 48733.44,
                isJoint: false,
                icon: '📈',
                gradient: 'linear-gradient(135deg, #10b981, #047857)'
            }
        ];
    }

    getDefaultBudgetCategories() {
        return [
            { name: 'Housing', budgeted: 3117, actual: 3200, icon: '🏠' },
            { name: 'Food', budgeted: 800, actual: 650, icon: '🍽️' },
            { name: 'Utilities', budgeted: 213, actual: 195, icon: '⚡' },
            { name: 'Insurance', budgeted: 490, actual: 490, icon: '🛡️' },
            { name: 'Childcare', budgeted: 508, actual: 508, icon: '👶' },
            { name: 'Transportation', budgeted: 125, actual: 180, icon: '🚗' },
            { name: 'Savings', budgeted: 571, actual: 200, icon: '💰' },
            { name: 'Discretionary', budgeted: 300, actual: 450, icon: '🛍️' }
        ];
    }

    getDefaultGoals() {
        return [
            {
                id: 'emergency-fund',
                title: 'Emergency Fund',
                target: 15000,
                current: 0.17,
                deadline: '2025-12-31',
                priority: 'critical',
                icon: '🚨'
            },
            {
                id: 'budget-deficit',
                title: 'Fix Budget Deficit',
                target: 3607,
                current: 0,
                deadline: '2025-09-01',
                priority: 'critical',
                icon: '📊'
            },
            {
                id: 'visa-debt',
                title: 'Pay Off Visa Debt',
                target: 3251.30,
                current: 0,
                deadline: '2025-10-31',
                priority: 'high',
                icon: '💳'
            }
        ];
    }

    // CSV Processing Functions
    processCSV(csvText, filename) {
        try {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                throw new Error('CSV file appears to be empty or invalid');
            }

            const headers = this.parseCSVLine(lines[0]);
            const bankFormat = this.detectBankFormat(headers);
            
            const transactions = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length >= headers.length - 1) { // Allow for slight variation
                    const transaction = this.parseTransaction(headers, values, bankFormat, filename);
                    if (transaction) {
                        transactions.push(transaction);
                    }
                }
            }

            this.csvData = [...this.csvData, ...transactions];
            this.saveCsvData();
            
            return {
                success: true,
                transactions: transactions.length,
                filename: filename,
                bankFormat: bankFormat
            };
        } catch (error) {
            console.error('CSV processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    detectBankFormat(headers) {
        const headerStr = headers.join('|').toLowerCase();
        
        if (headerStr.includes('unique id') || headerStr.includes('tran type')) {
            return 'ASB';
        } else if (headerStr.includes('other party') || headerStr.includes('particulars')) {
            return 'WESTPAC';
        } else if (headerStr.includes('reference') && headerStr.includes('payee')) {
            return 'BNZ';
        } else if (headerStr.includes('memo') || headerStr.includes('description')) {
            return 'KIWIBANK';
        } else {
            return 'ANZ'; // Default format
        }
    }

    parseTransaction(headers, values, bankFormat, filename) {
        try {
            let transaction = {
                id: this.generateTransactionId(),
                source: filename,
                bankFormat: bankFormat,
                rawData: values
            };

            // Parse based on detected bank format
            switch (bankFormat) {
                case 'ASB':
                    transaction = this.parseASBTransaction(headers, values, transaction);
                    break;
                case 'ANZ':
                    transaction = this.parseANZTransaction(headers, values, transaction);
                    break;
                case 'BNZ':
                    transaction = this.parseBNZTransaction(headers, values, transaction);
                    break;
                case 'WESTPAC':
                    transaction = this.parseWestpacTransaction(headers, values, transaction);
                    break;
                case 'KIWIBANK':
                    transaction = this.parseKiwibankTransaction(headers, values, transaction);
                    break;
                default:
                    transaction = this.parseGenericTransaction(headers, values, transaction);
            }

            // Auto-categorize transaction
            transaction.category = this.categorizeTransaction(transaction);
            
            return transaction;
        } catch (error) {
            console.error('Transaction parsing error:', error);
            return null;
        }
    }

    parseANZTransaction(headers, values, transaction) {
        // ANZ format: Date, Amount, Description, Balance
        const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
        const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount'));
        const descIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
        const balanceIndex = headers.findIndex(h => h.toLowerCase().includes('balance'));

        transaction.date = this.parseDate(values[dateIndex]);
        transaction.amount = this.parseAmount(values[amountIndex]);
        transaction.description = values[descIndex] || 'Unknown Transaction';
        transaction.balance = this.parseAmount(values[balanceIndex]);
        transaction.type = transaction.amount >= 0 ? 'income' : 'expense';

        return transaction;
    }

    parseASBTransaction(headers, values, transaction) {
        // ASB format: Date, Unique Id, Tran Type, Cheque Number, Payee, Memo, Amount
        const dateIndex = 0;
        const payeeIndex = headers.findIndex(h => h.toLowerCase().includes('payee'));
        const memoIndex = headers.findIndex(h => h.toLowerCase().includes('memo'));
        const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount'));

        transaction.date = this.parseDate(values[dateIndex]);
        transaction.amount = this.parseAmount(values[amountIndex]);
        transaction.description = `${values[payeeIndex]} - ${values[memoIndex]}`.trim();
        transaction.type = transaction.amount >= 0 ? 'income' : 'expense';

        return transaction;
    }

    parseBNZTransaction(headers, values, transaction) {
        // BNZ format: Date, Amount, Payee, Description, Reference, Transaction Type
        const dateIndex = 0;
        const amountIndex = 1;
        const payeeIndex = 2;
        const descIndex = 3;

        transaction.date = this.parseDate(values[dateIndex]);
        transaction.amount = this.parseAmount(values[amountIndex]);
        transaction.description = `${values[payeeIndex]} - ${values[descIndex]}`.trim();
        transaction.type = transaction.amount >= 0 ? 'income' : 'expense';

        return transaction;
    }

    parseWestpacTransaction(headers, values, transaction) {
        // Westpac format: Date, Amount, Other Party, Description, Reference, etc.
        const dateIndex = 0;
        const amountIndex = 1;
        const partyIndex = 2;
        const descIndex = 3;

        transaction.date = this.parseDate(values[dateIndex]);
        transaction.amount = this.parseAmount(values[amountIndex]);
        transaction.description = `${values[partyIndex]} - ${values[descIndex]}`.trim();
        transaction.type = transaction.amount >= 0 ? 'income' : 'expense';

        return transaction;
    }

    parseKiwibankTransaction(headers, values, transaction) {
        // Kiwibank format: Date, Memo/Description, Amount, Balance
        const dateIndex = 0;
        const descIndex = 1;
        const amountIndex = 2;
        const balanceIndex = 3;

        transaction.date = this.parseDate(values[dateIndex]);
        transaction.amount = this.parseAmount(values[amountIndex]);
        transaction.description = values[descIndex] || 'Unknown Transaction';
        transaction.balance = this.parseAmount(values[balanceIndex]);
        transaction.type = transaction.amount >= 0 ? 'income' : 'expense';

        return transaction;
    }

    parseGenericTransaction(headers, values, transaction) {
        // Generic fallback parser
        transaction.date = new Date().toISOString().split('T')[0];
        transaction.amount = 0;
        transaction.description = 'Generic Transaction';
        transaction.type = 'expense';
        
        return transaction;
    }

    parseDate(dateStr) {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        
        // Try different date formats
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // dd/mm/yyyy or mm/dd/yyyy
            /(\d{4})-(\d{1,2})-(\d{1,2})/, // yyyy-mm-dd
            /(\d{1,2})-(\d{1,2})-(\d{4})/, // dd-mm-yyyy
        ];

        for (let format of formats) {
            const match = dateStr.match(format);
            if (match) {
                // Assume dd/mm/yyyy for NZ banks
                const day = match[1];
                const month = match[2];
                const year = match[3];
                
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }
        
        return new Date().toISOString().split('T')[0];
    }

    parseAmount(amountStr) {
        if (!amountStr) return 0;
        
        // Remove currency symbols, commas, and spaces
        const cleanAmount = amountStr.replace(/[$,\s]/g, '');
        
        // Handle parentheses as negative (some banks use this)
        if (cleanAmount.includes('(') && cleanAmount.includes(')')) {
            const number = parseFloat(cleanAmount.replace(/[()]/g, ''));
            return -Math.abs(number);
        }
        
        return parseFloat(cleanAmount) || 0;
    }

    categorizeTransaction(transaction) {
        const description = transaction.description.toLowerCase();
        
        // Income categories
        if (description.includes('salary') || description.includes('wages') || description.includes('pay')) {
            return 'Salary';
        }
        
        // Expense categories
        if (description.includes('countdown') || description.includes('pak n save') || description.includes('new world')) {
            return 'Groceries';
        }
        
        if (description.includes('z energy') || description.includes('bp') || description.includes('mobil')) {
            return 'Fuel';
        }
        
        if (description.includes('mortgage') || description.includes('rent')) {
            return 'Housing';
        }
        
        if (description.includes('restaurant') || description.includes('cafe') || description.includes('takeaway')) {
            return 'Dining Out';
        }
        
        if (description.includes('power') || description.includes('gas') || description.includes('internet')) {
            return 'Utilities';
        }
        
        if (description.includes('insurance')) {
            return 'Insurance';
        }
        
        if (description.includes('daycare') || description.includes('childcare')) {
            return 'Childcare';
        }
        
        return 'Other';
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Financial Calculations
    calculateNetWorth() {
        const assets = this.accounts
            .filter(acc => acc.balance > 0)
            .reduce((sum, acc) => sum + acc.balance, 0);
            
        const liabilities = this.accounts
            .filter(acc => acc.balance < 0)
            .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
            
        return assets - liabilities;
    }

    calculateMonthlyFlow() {
        const monthlyIncome = 6304; // From budget data
        const monthlyExpenses = 9911; // From budget data
        return monthlyIncome - monthlyExpenses;
    }

    getBudgetStatus() {
        return this.budgetCategories.map(category => ({
            ...category,
            remaining: category.budgeted - category.actual,
            percentage: (category.actual / category.budgeted) * 100,
            status: category.actual > category.budgeted ? 'over' : 
                    category.actual < category.budgeted * 0.9 ? 'under' : 'on-track'
        }));
    }

    getGoalProgress() {
        return this.goals.map(goal => ({
            ...goal,
            percentage: (goal.current / goal.target) * 100,
            remaining: goal.target - goal.current,
            daysUntilDeadline: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        }));
    }

    // AI Coaching Responses
    getAICoachingAdvice(query) {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('budget') || lowerQuery.includes('deficit')) {
            return {
                type: 'critical',
                title: 'Budget Deficit Action Plan',
                message: `Your $3,607 monthly deficit is critical. Here's your action plan:

1. **Immediate cuts**: Reduce discretionary spending by $200/month
2. **Negotiate bills**: Contact Sky about a cheaper plan (-$50/month potential)
3. **Grocery optimization**: You're under budget by $150 - reallocate this
4. **Income boost**: Consider side work or ask for raise

Priority: Emergency fund first, then debt payoff. Even $50/week saved = $2,600/year!`,
                actions: ['Start Emergency Fund', 'Review Expenses', 'Income Planning']
            };
        }
        
        if (lowerQuery.includes('emergency') || lowerQuery.includes('fund')) {
            return {
                type: 'critical',
                title: 'Emergency Fund Crisis Plan',
                message: `Your $0.17 emergency fund is extremely dangerous. Here's the plan:

1. **Immediate goal**: Save $50/week = $200/month
2. **Target milestones**: 
   - $1,000 in 5 weeks (basic security)
   - $3,000 in 15 weeks (breathing room)
   - $15,000 in 18 months (full emergency fund)
3. **Funding sources**: Tax refunds, bonuses, expense cuts
4. **Account**: Use your "My Savings" account

Every dollar helps! Even $20/week is $1,040/year.`,
                actions: ['Set Auto-Transfer', 'Find Extra Income', 'Cut One Expense']
            };
        }
        
        if (lowerQuery.includes('debt') || lowerQuery.includes('visa')) {
            return {
                type: 'high',
                title: 'Visa Debt Strategy',
                message: `Your $3,251 Visa debt strategy:

1. **Current cost**: ~$25/month in interest (assuming 18% APR)
2. **Strategy**: Minimum payments while building $1,000 emergency buffer
3. **Payoff plan**: After emergency buffer, pay $300/month extra
4. **Timeline**: Clear debt in 12 months, save $200+ in interest
5. **Prevention**: Use House Kitty for true emergencies

The debt is manageable, but the emergency fund is the real crisis!`,
                actions: ['Calculate Interest', 'Plan Extra Payments', 'Prevent New Debt']
            };
        }
        
        return {
            type: 'info',
            title: 'FinanceOS AI Coach',
            message: `I can help you with:

• **Budget deficit solutions** - Fix your $3,607 monthly shortfall
• **Emergency fund building** - Build security from $0.17
• **Debt payoff strategies** - Optimize your Visa payments
• **Expense analysis** - Find areas to cut spending
• **Goal planning** - Create achievable financial milestones

What specific area would you like to tackle first? Your situation is serious but absolutely fixable with the right plan!`,
            actions: ['Fix Budget', 'Build Emergency Fund', 'Analyze Spending']
        };
    }

    // Storage Functions
    loadStoredData() {
        try {
            const storedCsv = localStorage.getItem('csvData');
            if (storedCsv) {
                this.csvData = JSON.parse(storedCsv);
            }
            
            const storedTransactions = localStorage.getItem('transactions');
            if (storedTransactions) {
                this.transactions = JSON.parse(storedTransactions);
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    saveCsvData() {
        try {
            localStorage.setItem('csvData', JSON.stringify(this.csvData));
            localStorage.setItem('csvUploadDate', new Date().toISOString());
        } catch (error) {
            console.error('Error saving CSV data:', error);
        }
    }

    saveTransactions() {
        try {
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Error saving transactions:', error);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Listen for storage changes (multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'csvData' || e.key === 'transactions') {
                this.loadStoredData();
                this.updateUI();
            }
        });
    }

    updateUI() {
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('financeDataUpdated', {
            detail: {
                csvData: this.csvData,
                transactions: this.transactions,
                accounts: this.accounts
            }
        }));
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-NZ', {
            style: 'currency',
            currency: 'NZD'
        }).format(amount);
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-NZ');
    }

    // Public API Methods
    initializePage() {
        console.log('FinanceOS Data Manager initialized');
        this.updateUI();
    }

    getAccountSummary() {
        return {
            totalAssets: this.accounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0),
            totalLiabilities: this.accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0),
            netWorth: this.calculateNetWorth(),
            monthlyFlow: this.calculateMonthlyFlow()
        };
    }

    getRecentTransactions(limit = 10) {
        return this.csvData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    searchTransactions(query, category = null, dateFrom = null, dateTo = null) {
        return this.csvData.filter(transaction => {
            const matchesQuery = !query || transaction.description.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = !category || transaction.category === category;
            const matchesDateFrom = !dateFrom || new Date(transaction.date) >= new Date(dateFrom);
            const matchesDateTo = !dateTo || new Date(transaction.date) <= new Date(dateTo);
            
            return matchesQuery && matchesCategory && matchesDateFrom && matchesDateTo;
        });
    }
}

// Initialize global data manager
window.FinanceOSDataManager = new FinanceOSDataManager();

// Legacy support for existing code
window.FinanceOSHelpers = {
    initializePage: () => window.FinanceOSDataManager.initializePage(),
    processCSV: (csvText, filename) => window.FinanceOSDataManager.processCSV(csvText, filename),
    getAccountSummary: () => window.FinanceOSDataManager.getAccountSummary(),
    formatCurrency: (amount) => window.FinanceOSDataManager.formatCurrency(amount)
};

console.log('FinanceOS Data Manager loaded successfully');