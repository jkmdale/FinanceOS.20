typescript
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Upload, 
  PieChart, 
  Target, 
  TrendingUp, 
  Fingerprint,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Download,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Wallet,
  BarChart3,
  Settings,
  CheckCircle,
  FileText,
  Sparkles
} from 'lucide-react';

// Types
interface User {
  id: string;
  username: string;
  biometricEnabled: boolean;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

interface BudgetCategory {
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
}

// Login Screen Component
const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (username === 'demo' && password === 'demo123') {
        onLogin({ id: '1', username, biometricEnabled: true });
      } else {
        alert('Invalid credentials. Use demo/demo123');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-purple-500 to-blue-600 p-4 rounded-3xl mb-4">
            <DollarSign className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">FinanceOS</h1>
          <p className="text-gray-300">Your Personal Finance Operating System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <div className="space-y-6">
            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">Username</div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter username (demo)"
              />
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-300 mb-2">Password</div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter password (demo123)"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl py-3 px-4 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock size={20} />
                  Sign In
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Demo credentials: demo / demo123
          </p>
        </div>
      </div>
    </div>
  );
};

// Welcome Screen Component
const WelcomeScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12">
          <div className="inline-block bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-3xl mb-8">
            <Sparkles className="h-16 w-16 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to FinanceOS!
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Let's get your financial life organized. We'll start by importing your bank statements 
            to understand your spending patterns and help you achieve your goals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6">
              <Upload className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">1. Upload Statements</h3>
              <p className="text-gray-400 text-sm">Import your CSV bank statements to get started</p>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6">
              <BarChart3 className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">2. Analyze Spending</h3>
              <p className="text-gray-400 text-sm">We'll categorize and analyze your transactions</p>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6">
              <Target className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">3. Set Goals</h3>
              <p className="text-gray-400 text-sm">Create budgets and financial goals based on your data</p>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Let's Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasData, setHasData] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Sample data for when uploaded
  const sampleAccounts: Account[] = [
    { id: '1', name: 'My Checking Account', balance: 2350.75, type: 'checking' },
    { id: '2', name: 'Savings Account', balance: 8500.00, type: 'savings' },
    { id: '3', name: 'Credit Card', balance: -1250.30, type: 'credit' }
  ];

  const sampleTransactions: Transaction[] = [
    { id: '1', date: '2025-05-28', description: 'COUNTDOWN SUPERMARKET', amount: -125.50, category: 'Groceries', type: 'expense' },
    { id: '2', date: '2025-05-27', description: 'SALARY DEPOSIT', amount: 2500.00, category: 'Income', type: 'income' },
    { id: '3', date: '2025-05-26', description: 'BP FUEL STATION', amount: -65.20, category: 'Transportation', type: 'expense' },
    { id: '4', date: '2025-05-25', description: 'SKY NETWORK', amount: -163.00, category: 'Entertainment', type: 'expense' },
    { id: '5', date: '2025-05-24', description: 'MCDONALD\'S', amount: -18.50, category: 'Dining Out', type: 'expense' }
  ];

  const sampleBudget: BudgetCategory[] = [
    { name: 'Groceries', budgeted: 600, spent: 450, remaining: 150, percentage: 75 },
    { name: 'Transportation', budgeted: 200, spent: 180, remaining: 20, percentage: 90 },
    { name: 'Entertainment', budgeted: 150, spent: 163, remaining: -13, percentage: 109 },
    { name: 'Dining Out', budgeted: 100, spent: 85, remaining: 15, percentage: 85 }
  ];

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setHasData(true);
      setIsUploading(false);
      setActiveTab('dashboard');
    }, 2000);
  };

  const renderEmptyDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
        <Upload className="h-16 w-16 text-purple-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Import Your Financial Data</h2>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
          Upload your bank statement CSV files to get started. We'll automatically categorize your transactions, 
          analyze your spending patterns, and help you create budgets and goals.
        </p>
        
        <button
          onClick={() => setActiveTab('upload')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          Upload Bank Statements
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
          <PieChart className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Smart Categorization</h3>
          <p className="text-gray-400 text-sm">
            We'll automatically categorize your transactions into budgets like groceries, dining, utilities, and more.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
          <BarChart3 className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Spending Analysis</h3>
          <p className="text-gray-400 text-sm">
            Get insights into your spending patterns and identify areas where you can save money.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
          <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Goal Tracking</h3>
          <p className="text-gray-400 text-sm">
            Set and track financial goals like emergency funds, debt payoff, and savings targets.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPopulatedDashboard = () => {
    const totalAssets = sampleAccounts.filter(acc => acc.balance > 0).reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = Math.abs(sampleAccounts.filter(acc => acc.balance < 0).reduce((sum, acc) => sum + acc.balance, 0));
    const netWorth = totalAssets - totalLiabilities;
    const totalIncome = sampleTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(sampleTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
    const cashFlow = totalIncome - totalExpenses;

    return (
      <div className="space-y-6">
        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Net Worth</h3>
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">${netWorth.toLocaleString()}</div>
            <p className="text-gray-300 text-sm mt-2">Assets - Liabilities</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Cash Flow</h3>
              <ArrowUpRight className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">
              +${cashFlow.toLocaleString()}
            </div>
            <p className="text-gray-300 text-sm mt-2">Income - Expenses</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Transactions</h3>
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{sampleTransactions.length}</div>
            <p className="text-gray-300 text-sm mt-2">This month</p>
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Accounts</h3>
          <div className="space-y-3">
            {sampleAccounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{account.name}</p>
                    <p className="text-gray-400 text-sm">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    account.balance >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${Math.abs(account.balance).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {sampleTransactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {transaction.type === 'income' ? 
                      <ArrowUpRight className="h-4 w-4 text-green-400" /> :
                      <ArrowDownRight className="h-4 w-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{transaction.description}</p>
                    <p className="text-gray-400 text-xs">{transaction.category} • {transaction.date}</p>
                  </div>
                </div>
                <div className={`text-sm font-semibold ${
                  transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBudget = () => {
    if (!hasData) {
      return (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
          <PieChart className="h-16 w-16 text-purple-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">No Budget Data Yet</h2>
          <p className="text-gray-300 mb-8">
            Upload your bank statements first, and we'll automatically create budget categories based on your spending patterns.
          </p>
          <button
            onClick={() => setActiveTab('upload')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Upload Statements
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Budget Categories</h3>
          <div className="space-y-4">
            {sampleBudget.map(category => (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{category.name}</span>
                  <span className={`font-semibold ${
                    category.percentage > 100 ? 'text-red-400' : 
                    category.percentage > 90 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {category.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      category.percentage > 100 ? 'bg-red-500' : 
                      category.percentage > 90 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Spent: ${category.spent}</span>
                  <span>Budget: ${category.budgeted}</span>
                  <span className={category.remaining >= 0 ? 'text-green-400' : 'text-red-400'}>
                    Remaining: ${category.remaining}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderUpload = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
        <div 
          className="border-2 border-dashed border-purple-400/50 rounded-2xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
          onClick={handleUpload}
        >
          {isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
              <h3 className="text-2xl font-semibold text-white">Processing Bank Statement...</h3>
              <p className="text-gray-300">
                Analyzing transactions and categorizing expenses
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-16 w-16 text-purple-400 mx-auto" />
              <h3 className="text-2xl font-semibold text-white">Upload Bank Statement</h3>
              <p className="text-gray-300">
                Click here to simulate uploading your CSV bank statement
              </p>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                Simulate Upload
              </button>
            </div>
          )}
        </div>
      </div>

      {hasData && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 p-4 bg-green-500/20 rounded-xl">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-white font-medium">Bank Statement Processed Successfully!</p>
              <p className="text-green-300 text-sm">
                Found {sampleTransactions.length} transactions and created {sampleBudget.length} budget categories
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Supported Bank Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">ANZ Bank</h4>
            <p className="text-gray-400 text-sm">Date, Amount, Description, Balance</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">ASB Bank</h4>
            <p className="text-gray-400 text-sm">Date, Amount, Payee, Description</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">BNZ Bank</h4>
            <p className="text-gray-400 text-sm">Date, Amount, Payee, Reference</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Kiwibank</h4>
            <p className="text-gray-400 text-sm">Date, Description, Amount, Balance</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
        <Target className="h-16 w-16 text-purple-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Set Your Financial Goals</h2>
        <p className="text-gray-300 mb-8">
          Once you've uploaded your statements and we understand your spending patterns, 
          you can set goals like emergency funds, debt payoff, and savings targets.
        </p>
        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
          Create Your First Goal
        </button>
      </div>
    </div>
  );

  const renderAI = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
      {
        type: 'ai' as const,
        content: hasData ? 
          `Great! I can see you've imported ${sampleTransactions.length} transactions. I'm analyzing your spending patterns and can help you with:

• Budget optimization based on your actual spending
• Identifying savings opportunities  
• Creating realistic financial goals
• Tracking spending trends

What would you like to know about your finances?` :
          `Hi! I'm your AI Financial Coach. Once you upload your bank statements, I'll be able to provide personalized advice about:

• Your spending patterns and trends
• Budget optimization opportunities  
• Debt reduction strategies
• Savings and investment recommendations

Upload your statements first, then ask me anything about your finances!`
      }
    ]);

    const sendMessage = () => {
      if (!query.trim()) return;
      
      const newMessages = [...messages, { type: 'user' as const, content: query }];
      setMessages(newMessages);
      
      setTimeout(() => {
        let response = '';
        
        if (!hasData) {
          response = `I'd love to help, but I need to see your financial data first! Please upload your bank statement CSV files so I can analyze your spending patterns and give you personalized advice.

Once you upload your statements, I'll be able to answer questions about:
• Your spending habits and trends
• Budget recommendations
• Savings opportunities
• Goal setting strategies`;
        } else if (query.toLowerCase().includes('spending') || query.toLowerCase().includes('budget')) {
          response = `Based on your ${sampleTransactions.length} transactions, here's your spending analysis:

**Top Spending Categories:**
• Groceries: $450 (75% of budget)
• Entertainment: $163 (109% of budget - over!)
• Transportation: $180 (90% of budget)

**Insights:**
• Your Entertainment spending is 9% over budget
• Groceries are well under control at 75%
• Consider reducing entertainment expenses by $20/month

Would you like specific suggestions for any category?`;
        } else {
          response = `I can help you with many aspects of your finances! Here are some things you can ask me:

• "How much am I spending on groceries?"
• "What are my biggest expenses?"
• "How can I save more money?"
• "Show me my spending trends"
• "Help me create a budget"

What would you like to explore first?`;
        }
        
        setMessages(prev => [...prev, { type: 'ai' as const, content: response }]);
      }, 1000);
      
      setQuery('');
    };

    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <MessageSquare className="h-6 w-6 text-purple-400 mr-2" />
            <h3 className="text-xl font-semibold text-white">AI Financial Coach</h3>
          </div>
          
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className={`p-4 rounded-xl ${
                message.type === 'user' 
                  ? 'bg-purple-500/20 ml-8' 
                  : 'bg-blue-500/20 mr-8'
              }`}>
                <p className="text-white whitespace-pre-line">{message.content}</p>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your spending, budget, or goals..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl px-6 py-3 text-white hover:opacity-90 transition-opacity"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (showWelcome) {
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FinanceOS</h1>
                <p className="text-gray-400 text-sm">Welcome back, {user.username}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'budget', label: 'Budget', icon: PieChart },
              { id: 'goals', label: 'Goals', icon: Target },
              { id: 'ai', label: 'AI Coach', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (hasData ? renderPopulatedDashboard() : renderEmptyDashboard())}
        {activeTab === 'budget' && renderBudget()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'upload' && renderUpload()}
        {activeTab === 'ai' && renderAI()}
      </main>
    </div>
  );
};

// Main App Component
const FinanceOS: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Dashboard user={user!} onLogout={handleLogout} />
      )}
    </>
  );
};

export default FinanceOS;
