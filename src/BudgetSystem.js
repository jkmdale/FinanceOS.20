import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Target, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, DollarSign, Calendar, Edit2, Trash2, Eye, EyeOff,
  PieChart, BarChart3, Zap, Calculator, Bell, ArrowUp, ArrowDown,
  Home, Car, ShoppingCart, Utensils, Wifi, Baby, Shield, Briefcase,
  ArrowLeft, Settings, Download, Filter
} from 'lucide-react';

// Mock data based on your actual budget categories from the documents
const mockBudgetData = {
  income: {
    salary: { budgeted: 6304, actual: 6304, category: 'Income', subcategory: 'Pathway Engineer Salary' }
  },
  expenses: {
    // Housing (Fixed) - $2,427 total
    mortgage1: { budgeted: 1190, actual: 1190, category: 'Housing', subcategory: 'Mortgage 1', type: 'fixed' },
    mortgage2: { budgeted: 880, actual: 880, category: 'Housing', subcategory: 'Mortgage 2', type: 'fixed' },
    rates: { budgeted: 357, actual: 357, category: 'Housing', subcategory: 'Council Rates', type: 'fixed' },
    
    // Insurance (Fixed) - $490 total
    veroInsurance: { budgeted: 350, actual: 350, category: 'Insurance', subcategory: 'Vero Insurance', type: 'fixed' },
    partnersLife: { budgeted: 140, actual: 140, category: 'Insurance', subcategory: 'Partners Life', type: 'fixed' },
    
    // Childcare (Fixed) - $508 total
    daycare: { budgeted: 508, actual: 508, category: 'Childcare', subcategory: 'Grow Active Daycare', type: 'fixed' },
    
    // Food (Variable) - $800 budgeted, $963 actual = $163 OVER
    groceries: { budgeted: 550, actual: 623, category: 'Food', subcategory: 'Groceries', type: 'variable' },
    diningOut: { budgeted: 250, actual: 340, category: 'Food', subcategory: 'Dining Out/Takeaway', type: 'variable' },
    
    // Utilities (Semi-fixed) - $213 budgeted, $223 actual = $10 over
    skyNetwork: { budgeted: 163, actual: 163, category: 'Utilities', subcategory: 'Sky Network', type: 'fixed' },
    mobile: { budgeted: 40, actual: 45, category: 'Utilities', subcategory: 'Mobile Phone', type: 'variable' },
    internet: { budgeted: 10, actual: 15, category: 'Utilities', subcategory: 'Internet/Streaming', type: 'variable' },
    
    // Transportation - $125 budgeted, $156 actual = $31 over
    fuel: { budgeted: 125, actual: 156, category: 'Transportation', subcategory: 'Fuel', type: 'variable' },
    
    // Discretionary - $300 budgeted, $423 actual = $123 OVER
    shopping: { budgeted: 150, actual: 245, category: 'Discretionary', subcategory: 'Shopping/Retail', type: 'variable' },
    entertainment: { budgeted: 50, actual: 78, category: 'Discretionary', subcategory: 'Entertainment', type: 'variable' },
    travelFund: { budgeted: 100, actual: 100, category: 'Discretionary', subcategory: 'Travel Fund', type: 'savings' },
    
    // Savings & Investments - $571 budgeted, $571 actual
    sharesies: { budgeted: 271, actual: 271, category: 'Savings', subcategory: 'Sharesies Investment', type: 'savings' },
    emergencyFund: { budgeted: 0, actual: 0, category: 'Savings', subcategory: 'Emergency Fund', type: 'savings' },
    educationSavings: { budgeted: 300, actual: 300, category: 'Savings', subcategory: 'Private School Fund', type: 'savings' }
  }
};

const categoryIcons = {
  'Housing': Home,
  'Insurance': Shield,
  'Childcare': Baby,
  'Food': Utensils,
  'Utilities': Wifi,
  'Transportation': Car,
  'Discretionary': ShoppingCart,
  'Savings': Target,
  'Income': DollarSign
};

const categoryColors = {
  'Housing': 'from-blue-500 to-blue-600',
  'Insurance': 'from-green-500 to-green-600',
  'Childcare': 'from-pink-500 to-pink-600',
  'Food': 'from-orange-500 to-orange-600',
  'Utilities': 'from-cyan-500 to-cyan-600',
  'Transportation': 'from-yellow-500 to-yellow-600',
  'Discretionary': 'from-purple-500 to-purple-600',
  'Savings': 'from-emerald-500 to-emerald-600',
  'Income': 'from-green-500 to-green-600'
};

const BudgetSystem = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', subcategory: '', budgeted: '', type: 'variable' });

  // Calculate totals and variances
  const calculateBudgetSummary = () => {
    const totalIncome = Object.values(mockBudgetData.income).reduce((sum, item) => sum + item.actual, 0);
    const totalBudgeted = Object.values(mockBudgetData.expenses).reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = Object.values(mockBudgetData.expenses).reduce((sum, item) => sum + item.actual, 0);
    const variance = totalBudgeted - totalActual;
    const netIncome = totalIncome - totalActual;
    
    return {
      totalIncome,
      totalBudgeted,
      totalActual,
      variance,
      netIncome,
      percentSpent: (totalActual / totalIncome) * 100
    };
  };

  // Group expenses by category
  const groupByCategory = () => {
    const categories = {};
    Object.entries(mockBudgetData.expenses).forEach(([key, expense]) => {
      if (!categories[expense.category]) {
        categories[expense.category] = {
          budgeted: 0,
          actual: 0,
          items: []
        };
      }
      categories[expense.category].budgeted += expense.budgeted;
      categories[expense.category].actual += expense.actual;
      categories[expense.category].items.push({ key, ...expense });
    });
    return categories;
  };

  const summary = calculateBudgetSummary();
  const categories = groupByCategory();

  // Format currency for display
  const formatCurrency = (amount) => {
    if (privacyMode) return '****';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Get status color based on performance
  const getStatusColor = (budgeted, actual) => {
    const variance = actual - budgeted;
    const percentVariance = budgeted > 0 ? (variance / budgeted) * 100 : 0;
    
    if (percentVariance <= -5) return 'text-green-400'; // Under budget
    if (percentVariance <= 5) return 'text-yellow-400'; // On track
    return 'text-red-400'; // Over budget
  };

  const getStatusIcon = (budgeted, actual) => {
    const variance = actual - budgeted;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-green-400" />;
    if (budgeted > 0 && variance > budgeted * 0.1) return <AlertTriangle className="h-4 w-4 text-red-400" />;
    return <CheckCircle className="h-4 w-4 text-yellow-400" />;
  };

  const handleAddExpense = () => {
    if (newExpense.category && newExpense.subcategory && newExpense.budgeted) {
      // Add to mockBudgetData - in real app this would be an API call
      const key = newExpense.subcategory.toLowerCase().replace(/\s+/g, '');
      mockBudgetData.expenses[key] = {
        budgeted: parseFloat(newExpense.budgeted),
        actual: 0,
        category: newExpense.category,
        subcategory: newExpense.subcategory,
        type: newExpense.type
      };
      
      setNewExpense({ category: '', subcategory: '', budgeted: '', type: 'variable' });
      setShowAddExpense(false);
      // Force re-render by updating state
      setActiveTab(activeTab);
    }
  };

  const BudgetOverview = () => (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      <div className="glass rounded-2xl p-6 border-2 border-red-400/30 bg-gradient-to-r from-red-500/20 to-red-600/20 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div>
            <h3 className="text-xl font-bold text-red-400">🚨 Budget Deficit Crisis</h3>
            <p className="text-red-300">You're spending {formatCurrency(Math.abs(summary.netIncome))} more than you earn monthly</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAICoach(true)}
          className="gradient-red rounded-lg px-6 py-3 text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Zap className="h-5 w-5" />
          Get AI Coaching to Fix This Crisis
        </button>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-premium rounded-2xl p-6 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Monthly Income</h3>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400">{formatCurrency(summary.totalIncome)}</div>
          <p className="text-sm text-gray-300 mt-1">Pathway Engineer (after tax)</p>
          <div className="mt-3 flex items-center text-green-400 text-sm">
            <ArrowUp className="h-4 w-4 mr-1" />
            Stable monthly income
          </div>
        </div>

        <div className="glass-premium rounded-2xl p-6 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Total Expenses</h3>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400">{formatCurrency(summary.totalActual)}</div>
          <p className="text-sm text-gray-300 mt-1">
            {formatCurrency(Math.abs(summary.variance))} {summary.variance < 0 ? 'over' : 'under'} budget
          </p>
          <div className="mt-3 flex items-center text-red-400 text-sm">
            <ArrowUp className="h-4 w-4 mr-1" />
            {((summary.totalActual / summary.totalBudgeted - 1) * 100).toFixed(1)}% over budget
          </div>
        </div>

        <div className="glass-premium rounded-2xl p-6 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Net Position</h3>
            <div className={`w-12 h-12 bg-gradient-to-br ${summary.netIncome < 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'} rounded-xl flex items-center justify-center`}>
              {summary.netIncome < 0 ? 
                <TrendingDown className="h-6 w-6 text-white" /> : 
                <TrendingUp className="h-6 w-6 text-white" />
              }
            </div>
          </div>
          <div className={`text-3xl font-bold ${summary.netIncome < 0 ? 'text-red-400' : 'text-green-400'}`}>
            {summary.netIncome < 0 ? '-' : ''}{formatCurrency(summary.netIncome)}
          </div>
          <p className="text-sm text-gray-300 mt-1">
            {summary.percentSpent.toFixed(1)}% of income spent
          </p>
          <div className={`mt-3 flex items-center ${summary.netIncome < 0 ? 'text-red-400' : 'text-green-400'} text-sm`}>
            {summary.netIncome < 0 ? <ArrowDown className="h-4 w-4 mr-1" /> : <ArrowUp className="h-4 w-4 mr-1" />}
            {summary.netIncome < 0 ? 'Deficit spending' : 'Surplus available'}
          </div>
        </div>
      </div>

      {/* Category Performance Grid */}
      <div className="glass-premium rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Category Performance</h3>
            <p className="text-gray-300">Click any category to see detailed breakdown</p>
          </div>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1"
          >
            View All Details <ArrowLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories).map(([categoryName, data]) => {
            const Icon = categoryIcons[categoryName] || Target;
            const variance = data.actual - data.budgeted;
            const isOverBudget = variance > 0;
            const percentUsed = data.budgeted > 0 ? (data.actual / data.budgeted) * 100 : 0;
            
            return (
              <div key={categoryName} className="glass rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer group hover:scale-105"
                   onClick={() => setSelectedCategory(categoryName)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${categoryColors[categoryName] || 'from-gray-500 to-gray-600'}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm group-hover:text-purple-400 transition-colors">{categoryName}</h4>
                    <p className="text-xs text-gray-300">{data.items.length} budget items</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Spent:</span>
                    <span className={getStatusColor(data.budgeted, data.actual)}>
                      {formatCurrency(data.actual)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Budget:</span>
                    <span className="text-white">{formatCurrency(data.budgeted)}</span>
                  </div>
                  
                  {/* Enhanced Progress bar */}
                  <div className="relative">
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          isOverBudget 
                            ? 'bg-gradient-to-r from-red-500 to-red-600' 
                            : percentUsed > 80 
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                              : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      ></div>
                    </div>
                    {percentUsed > 100 && (
                      <div className="absolute -top-1 right-0 text-xs text-red-400 font-bold">
                        {percentUsed.toFixed(0)}%
                      </div>
                    )}
                  </div>
                  
                  {variance !== 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Variance:</span>
                      <div className="flex items-center gap-1">
                        {isOverBudget ? <ArrowUp className="h-3 w-3 text-red-400" /> : <ArrowDown className="h-3 w-3 text-green-400" />}
                        <span className={isOverBudget ? 'text-red-400' : 'text-green-400'}>
                          {formatCurrency(variance)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowAddExpense(true)}
          className="glass-premium rounded-2xl p-6 hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Add New Budget Item</h3>
              <p className="text-sm text-gray-300">Create a new expense category</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowAICoach(true)}
          className="glass-premium rounded-2xl p-6 hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">AI Budget Optimization</h3>
              <p className="text-sm text-gray-300">Get personalized advice</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const CategoryDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Budget Categories</h2>
          <p className="text-gray-300">Detailed breakdown of all spending categories</p>
        </div>
        <button 
          onClick={() => setShowAddExpense(true)}
          className="gradient-purple rounded-lg px-4 py-2 text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Add Category
        </button>
      </div>

      {Object.entries(categories).map(([categoryName, data]) => {
        const Icon = categoryIcons[categoryName] || Target;
        const variance = data.actual - data.budgeted;
        const isOverBudget = variance > 0;
        const percentUsed = data.budgeted > 0 ? (data.actual / data.budgeted) * 100 : 0;
        
        return (
          <div key={categoryName} className="glass-premium rounded-2xl p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${categoryColors[categoryName] || 'from-gray-500 to-gray-600'}`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{categoryName}</h3>
                  <p className="text-gray-300">{data.items.length} budget items • {data.items.filter(item => item.type === 'fixed').length} fixed, {data.items.filter(item => item.type === 'variable').length} variable</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${getStatusColor(data.budgeted, data.actual)}`}>
                  {formatCurrency(data.actual)}
                </div>
                <div className="text-sm text-gray-300">
                  of {formatCurrency(data.budgeted)} budgeted
                </div>
        