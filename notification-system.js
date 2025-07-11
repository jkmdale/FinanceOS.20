<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Budget - FinanceOS</title>
    <meta name="theme-color" content="#8b5cf6">
    <link rel="manifest" href="manifest.json">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e1b4b 75%, #0f172a 100%);
            background-attachment: fixed;
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* CSS Variables for Design System */
        :root {
            --glass-bg: rgba(255, 255, 255, 0.08);
            --glass-border: rgba(255, 255, 255, 0.15);
            --glass-premium-bg: linear-gradient(135deg, 
                rgba(139, 92, 246, 0.15) 0%, 
                rgba(59, 130, 246, 0.15) 50%, 
                rgba(147, 51, 234, 0.15) 100%);
            --glass-premium-border: rgba(255, 255, 255, 0.2);
            --gradient-purple: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #9333ea 100%);
            --gradient-blue: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
            --gradient-green: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
            --gradient-red: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
            --text-white: rgba(255, 255, 255, 0.9);
            --text-gray: rgba(255, 255, 255, 0.7);
            --text-light: rgba(255, 255, 255, 0.5);
        }

        /* Glass Effects */
        .glass {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .glass-premium {
            background: var(--glass-premium-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-premium-border);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        /* Navigation Bar - BIGGER UNIFIED STYLE */
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--glass-border);
            padding: 20px 0;
            transition: all 0.3s ease;
        }

        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
        }

        .nav-logo {
            display: flex;
            align-items: center;
            text-decoration: none;
            color: white;
            font-weight: 700;
        }

        .logo-icon {
            width: 48px;
            height: 48px;
            margin-right: 12px;
            border-radius: 12px;
            background: var(--gradient-green);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 32px;
            list-style: none;
        }

        .nav-links a {
            color: var(--text-gray);
            text-decoration: none;
            font-weight: 500;
            font-size: 1rem;
            padding: 12px 20px;
            border-radius: 8px;
            transition: all 0.3s ease;
            position: relative;
        }

        .nav-links a:hover {
            color: white;
            background: rgba(255, 255, 255, 0.1);
        }

        .nav-links a.active {
            color: #8b5cf6;
            background: rgba(139, 92, 246, 0.1);
        }

        .nav-links a.active::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            background: #8b5cf6;
            border-radius: 50%;
        }

        .nav-actions {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .privacy-toggle {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .privacy-toggle:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .logout-btn {
            background: var(--gradient-red);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .logout-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        /* Mobile Menu */
        .mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 8px;
        }

        /* Main Content */
        .main-content {
            margin-top: 100px;
            padding: 24px;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }

        /* Page Header */
        .page-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .page-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .page-subtitle {
            color: var(--text-gray);
            font-size: 1.125rem;
        }

        /* Budget Sync Status */
        .budget-sync-status {
            background: var(--glass-bg);
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 2rem;
            border: 1px solid var(--glass-border);
            text-align: center;
        }

        .sync-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #10b981;
            font-weight: 500;
        }

        .sync-indicator.outdated {
            color: #f59e0b;
        }

        /* Budget Summary Cards */
        .budget-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }

        .summary-card {
            background: var(--glass-premium-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-premium-border);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            transition: all 0.3s ease;
        }

        .summary-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 48px rgba(139, 92, 246, 0.3);
        }

        .summary-card h3 {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-gray);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-card .amount {
            font-size: 1.875rem;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .summary-card .change {
            font-size: 0.875rem;
            font-weight: 500;
        }

        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .neutral { color: var(--text-gray); }

        /* Budget Table */
        .budget-table-container {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
            overflow-x: auto;
        }

        .budget-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }

        .budget-table th,
        .budget-table td {
            text-align: left;
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .budget-table th {
            font-weight: 600;
            color: var(--text-gray);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.75rem;
        }

        .budget-table tr:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .category-main {
            font-weight: 600;
            color: white;
        }

        .category-sub {
            padding-left: 32px;
            color: var(--text-gray);
        }

        .amount {
            font-weight: 600;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }

        .variance-positive {
            color: #10b981;
        }

        .variance-negative {
            color: #ef4444;
        }

        /* Charts Section */
        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }

        .chart-card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 24px;
        }

        .chart-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }

        .chart-container {
            position: relative;
            height: 300px;
        }

        /* Critical Alerts */
        .alert {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(239, 68, 68, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
            animation: pulse 2s infinite;
        }

        .alert-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #ef4444;
            margin-bottom: 8px;
        }

        .alert-message {
            color: var(--text-gray);
            line-height: 1.5;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }

        /* AI Coach Styles */
        .ai-coach-container {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1000;
        }

        .ai-coach-toggle {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #9333ea 100%);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ai-coach-toggle:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
        }

        .ai-coach-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #10b981;
            color: white;
            font-size: 0.625rem;
            font-weight: 700;
            padding: 0.125rem 0.375rem;
            border-radius: 0.5rem;
            border: 2px solid white;
            animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .ai-coach-panel {
            position: absolute;
            bottom: 72px;
            right: 0;
            width: 380px;
            max-width: 90vw;
            max-height: 600px;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 1.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            overflow: hidden;
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .ai-coach-panel.hidden {
            display: none;
        }

        .ai-coach-header {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
            padding: 1rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .ai-coach-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            color: white;
            font-size: 0.9rem;
        }

        .ai-status-indicator {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse-status 2s infinite;
        }

        @keyframes pulse-status {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        .ai-coach-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 0.375rem;
            transition: all 0.2s ease;
        }

        .ai-coach-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .ai-coach-content {
            display: flex;
            flex-direction: column;
            height: 500px;
        }

        .ai-quick-actions {
            padding: 1rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quick-action-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            padding: 0.5rem;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.75rem;
            text-align: center;
        }

        .quick-action-btn:hover {
            background: rgba(139, 92, 246, 0.2);
            border-color: rgba(139, 92, 246, 0.3);
            color: white;
            transform: translateY(-1px);
        }

        .ai-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .ai-message {
            display: flex;
            gap: 0.75rem;
            animation: messageSlideIn 0.3s ease-out;
        }

        .ai-message-user {
            flex-direction: row-reverse;
        }

        @keyframes messageSlideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .ai-message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .ai-message-assistant .ai-message-avatar {
            background: linear-gradient(135deg, #8b5cf6, #9333ea);
            color: white;
        }

        .ai-message-user .ai-message-avatar {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
        }

        .ai-message-content {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            padding: 0.75rem 1rem;
            max-width: 280px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.875rem;
            line-height: 1.4;
        }

        .ai-message-user .ai-message-content {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(147, 51, 234, 0.2));
            border-color: rgba(139, 92, 246, 0.3);
        }

        .ai-message-content p {
            margin: 0 0 0.5rem 0;
        }

        .ai-message-content p:last-child {
            margin-bottom: 0;
        }

        .ai-financial-data {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 0.375rem;
            padding: 0.25rem 0.5rem;
            color: #10b981;
            font-weight: 600;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }

        .ai-warning-data {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 0.375rem;
            padding: 0.25rem 0.5rem;
            color: #ef4444;
            font-weight: 600;
        }

        .ai-insight-highlight {
            background: rgba(59, 130, 246, 0.1);
            border-left: 3px solid #3b82f6;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-radius: 0 0.375rem 0.375rem 0;
            font-style: italic;
        }

        .ai-chat-input {
            padding: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .ai-chat-input input {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            padding: 0.75rem 1rem;
            color: white;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s ease;
        }

        .ai-chat-input input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .ai-chat-input input:focus {
            border-color: rgba(139, 92, 246, 0.5);
            background: rgba(139, 92, 246, 0.1);
        }

        .ai-chat-send-btn {
            background: linear-gradient(135deg, #8b5cf6, #9333ea);
            border: none;
            border-radius: 0.75rem;
            width: 40px;
            height: 40px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .ai-chat-send-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .ai-chat-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        /* Privacy Mode */
        .privacy-mode .amount,
        .privacy-mode .budget-table td:nth-child(3),
        .privacy-mode .budget-table td:nth-child(4),
        .privacy-mode .budget-table td:nth-child(5) {
            filter: blur(4px);
            transition: filter 0.3s ease;
        }

        /* Budget Alert Styles */
        .alert.alert-success {
            background: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.3);
            color: #10b981;
        }

        .alert.alert-warning {
            background: rgba(245, 158, 11, 0.1);
            border-color: rgba(245, 158, 11, 0.3);
            color: #f59e0b;
        }

        .alert.alert-info {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.3);
            color: #3b82f6;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .nav-links {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border-top: 1px solid var(--glass-border);
                flex-direction: column;
                padding: 1rem;
                gap: 0.5rem;
            }

            .nav-links.active {
                display: flex;
            }

            .mobile-menu-btn {
                display: block;
            }

            .main-content {
                padding: 16px;
                margin-top: 88px;
            }

            .page-title {
                font-size: 2rem;
            }

            .budget-summary {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
            }

            .charts-section {
                grid-template-columns: 1fr;
                gap: 16px;
            }

            .chart-container {
                height: 250px;
            }

            .budget-table-container {
                padding: 16px;
            }

            .budget-table {
                font-size: 0.75rem;
            }

            .budget-table th,
            .budget-table td {
                padding: 8px 12px;
            }

            .ai-coach-container {
                bottom: 1rem;
                right: 1rem;
            }

            .ai-coach-panel {
                width: calc(100vw - 2rem);
                bottom: 68px;
                right: -1rem;
            }

            .ai-quick-actions {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 480px) {
            .nav-container {
                padding: 0 16px;
            }

            .logo-icon {
                width: 40px;
                height: 40px;
                font-size: 20px;
            }

            .page-title {
                font-size: 1.75rem;
            }

            .summary-card .amount {
                font-size: 1.5rem;
            }
        }

        /* Utilities */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <a href="index.html" class="nav-logo">
                <div class="logo-icon">$</div>
                <span>FinanceOS</span>
            </a>
            
            <ul class="nav-links" id="navLinks">
                <li><a href="index.html">Dashboard</a></li>
                <li><a href="budget.html" class="active">Budget</a></li>
                <li><a href="goals.html">Goals</a></li>
                <li><a href="csv-upload.html">Upload</a></li>
                <li><a href="transactions.html">Transactions</a></li>
            </ul>
            
            <div class="nav-actions">
                <button class="privacy-toggle" id="privacyToggle">🔒 Privacy</button>
                <button class="logout-btn" onclick="logout()">Logout</button>
                <button class="mobile-menu-btn" id="mobileMenuBtn">☰</button>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Budget Sync Status -->
        <div class="budget-sync-status" id="budgetSyncStatus">
            <div class="sync-indicator">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                </svg>
                Budget synced with transaction data
                <span style="opacity: 0.7; font-size: 0.875rem;" id="lastUpdateTime">
                    (Updated: Never)
                </span>
            </div>
        </div>

        <!-- Critical Alert -->
        <div class="alert">
            <div class="alert-title">🚨 Critical Budget Deficit Alert</div>
            <div class="alert-message">
                You're spending <strong>$3,607 more than you earn monthly</strong>. Your emergency fund of $0.17 cannot cover this deficit. 
                <strong>Immediate action required</strong> to reduce expenses and build emergency savings.
            </div>
        </div>

        <!-- Page Header -->
        <div class="page-header">
            <h1 class="page-title">Monthly Budget</h1>
            <p class="page-subtitle">Track your income and expenses with intelligent insights</p>
        </div>

        <!-- Budget Summary Cards -->
        <div class="budget-summary">
            <div class="summary-card">
                <h3>Monthly Income</h3>
                <div class="amount positive">$6,304</div>
                <div class="change neutral">Pathway Engineering</div>
            </div>
            
            <div class="summary-card">
                <h3>Total Expenses</h3>
                <div class="amount negative">$9,911</div>
                <div class="change negative">157% of income</div>
            </div>
            
            <div class="summary-card">
                <h3>Net Cash Flow</h3>
                <div class="amount negative">-$3,607</div>
                <div class="change negative">Critical deficit</div>
            </div>
            
            <div class="summary-card">
                <h3>Budget Adherence</h3>
                <div class="amount negative">43%</div>
                <div class="change negative">Needs improvement</div>
            </div>
        </div>

        <!-- Budget Table -->
        <div class="budget-table-container">
            <table class="budget-table" id="budgetTable">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Budgeted</th>
                        <th>Actual</th>
                        <th>Difference</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="category-main">Income</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Salary</td>
                        <td class="amount">$6,304</td>
                        <td class="amount positive">$6,304</td>
                        <td class="amount neutral">$0</td>
                        <td>Pathway Engineer wages (after tax)</td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Housing</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Mortgage 1</td>
                        <td class="amount">$1,190</td>
                        <td class="amount negative">$1,190</td>
                        <td class="amount neutral">$0</td>
                        <td>4.99% interest</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Mortgage 2</td>
                        <td class="amount">$880</td>
                        <td class="amount negative">$880</td>
                        <td class="amount neutral">$0</td>
                        <td>4.99% interest</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Rates</td>
                        <td class="amount">$357</td>
                        <td class="amount negative">$357</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Food</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Groceries</td>
                        <td class="amount">$550</td>
                        <td class="amount negative">$627</td>
                        <td class="amount variance-negative">-$77</td>
                        <td>14% over budget</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Dining Out/Takeaway</td>
                        <td class="amount">$250</td>
                        <td class="amount negative">$337</td>
                        <td class="amount variance-negative">-$87</td>
                        <td>35% over budget</td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Utilities</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Sky Network</td>
                        <td class="amount">$163</td>
                        <td class="amount negative">$163</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Mobile Phone</td>
                        <td class="amount">$40</td>
                        <td class="amount negative">$45</td>
                        <td class="amount variance-negative">-$5</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Internet/Streaming</td>
                        <td class="amount">$10</td>
                        <td class="amount negative">$15</td>
                        <td class="amount variance-negative">-$5</td>
                        <td></td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Insurance</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Vero Insurance</td>
                        <td class="amount">$350</td>
                        <td class="amount negative">$350</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Partners Life</td>
                        <td class="amount">$140</td>
                        <td class="amount negative">$140</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Childcare</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Grow Active Daycare</td>
                        <td class="amount">$508</td>
                        <td class="amount negative">$508</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Transportation</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Fuel</td>
                        <td class="amount">$125</td>
                        <td class="amount negative">$143</td>
                        <td class="amount variance-negative">-$18</td>
                        <td>14% over budget</td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Savings & Investments</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Sharesies</td>
                        <td class="amount">$271</td>
                        <td class="amount negative">$271</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Emergency Fund</td>
                        <td class="amount">$0</td>
                        <td class="amount negative">$0</td>
                        <td class="amount neutral">$0</td>
                        <td>CRITICAL: Need to start</td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Private School Fund</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Education Savings</td>
                        <td class="amount">$300</td>
                        <td class="amount negative">$300</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    
                    <tr>
                        <td class="category-main">Discretionary</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Shopping/Retail</td>
                        <td class="amount">$150</td>
                        <td class="amount negative">$198</td>
                        <td class="amount variance-negative">-$48</td>
                        <td>32% over budget</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Entertainment</td>
                        <td class="amount">$50</td>
                        <td class="amount negative">$73</td>
                        <td class="amount variance-negative">-$23</td>
                        <td>46% over budget</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="category-sub">Travel Fund</td>
                        <td class="amount">$100</td>
                        <td class="amount negative">$100</td>
                        <td class="amount neutral">$0</td>
                        <td></td>
                    </tr>
                    
                    <tr style="border-top: 2px solid rgba(255, 255, 255, 0.2); font-weight: 600;">
                        <td class="category-main">Totals</td>
                        <td></td>
                        <td class="amount">$9,911</td>
                        <td class="amount negative">$9,911</td>
                        <td class="amount variance-negative">-$263</td>
                        <td></td>
                    </tr>
                    <tr style="font-weight: 600;">
                        <td class="category-main">Net Income</td>
                        <td></td>
                        <td class="amount">-$3,607</td>
                        <td class="amount negative">-$3,607</td>
                        <td class="amount variance-negative">-$263</td>
                        <td>CRITICAL DEFICIT</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
            <div class="chart-card">
                <h3 class="chart-title">Budget Variance by Category</h3>
                <div class="chart-container">
                    <canvas id="varianceChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <h3 class="chart-title">Expense Breakdown</h3>
                <div class="chart-container">
                    <canvas id="expenseChart"></canvas>
                </div>
            </div>
        </div>
    </main>

    <!-- AI Financial Coach Component -->
    <div id="aiCoachContainer" class="ai-coach-container">
        <!-- AI Coach Toggle Button -->
        <button id="aiCoachToggle" class="ai-coach-toggle" title="Ask AI Coach">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16,16.5C16,17.11 15.61,17.5 15,17.5H9C8.39,17.5 8,17.11 8,16.5V15.5C8,14.89 8.39,14.5 9,14.5H15C15.61,14.5 16,14.89 16,15.5V16.5M9,13A1,1 0 0,1 8,12A1,1 0 0,1 9,11A1,1 0 0,1 10,12A1,1 0 0,1 9,13M15,13A1,1 0 0,1 14,12A1,1 0 0,1 15,11A1,1 0 0,1 16,12A1,1 0 0,1 15,13Z" />
            </svg>
            <span class="ai-coach-badge" id="aiCoachBadge">AI</span>
        </button>

        <!-- AI Coach Panel -->
        <div id="aiCoachPanel" class="ai-coach-panel hidden">
            <div class="ai-coach-header">
                <div class="ai-coach-title">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16,16.5C16,17.11 15.61,17.5 15,17.5H9C8.39,17.5 8,17.11 8,16.5V15.5C8,14.89 8.39,14.5 9,14.5H15C15.61,14.5 16,14.89 16,15.5V16.5M9,13A1,1 0 0,1 8,12A1,1 0 0,1 9,11A1,1 0 0,1 10,12A1,1 0 0,1 9,13M15,13A1,1 0 0,1 14,12A1,1 0 0,1 15,11A1,1 0 0,1 16,12A1,1 0 0,1 15,13Z" />
                    </svg>
                    <span>AI Financial Coach</span>
                    <div class="ai-status-indicator"></div>
                </div>
                <button id="aiCoachClose" class="ai-coach-close">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                    </svg>
                </button>
            </div>

            <div class="ai-coach-content">
                <!-- Quick Action Buttons -->
                <div class="ai-quick-actions" id="aiQuickActions">
                    <button class="quick-action-btn" onclick="askAI('How can I fix my budget deficit?')">
                        🚨 Fix Deficit
                    </button>
                    <button class="quick-action-btn" onclick="askAI('Which categories am I overspending on?')">
                        📊 Overspending
                    </button>
                    <button class="quick-action-btn" onclick="askAI('How to start an emergency fund?')">
                        🎯 Emergency Fund
                    </button>
                    <button class="quick-action-btn" onclick="askAI('Suggest ways to reduce expenses')">
                        💰 Cut Expenses
                    </button>
                </div>

                <!-- Chat Messages -->
                <div class="ai-chat-messages" id="aiChatMessages">
                    <div class="ai-message ai-message-assistant">
                        <div class="ai-message-avatar">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16,16.5C16,17.11 15.61,17.5 15,17.5H9C8.39,17.5 8,17.11 8,16.5V15.5C8,14.89 8.39,14.5 9,14.5H15C15.61,14.5 16,14.89 16,15.5V16.5M9,13A1,1 0 0,1 8,12A1,1 0 0,1 9,11A1,1 0 0,1 10,12A1,1 0 0,1 9,13M15,13A1,1 0 0,1 14,12A1,1 0 0,1 15,11A1,1 0 0,1 16,12A1,1 0 0,1 15,13Z" />
                            </svg>
                        </div>
                        <div class="ai-message-content">
                            <p>🚨 I can see your budget has a critical <span class="ai-warning-data">$3,607 deficit</span>! This needs immediate attention.</p>
                            <p>I can help you identify overspending areas and create an action plan to balance your budget. What would you like to tackle first?</p>
                        </div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="ai-chat-input">
                    <input 
                        type="text" 
                        id="aiChatInput" 
                        placeholder="Ask me about your budget..."
                        maxlength="200"
                    >
                    <button id="aiChatSend" class="ai-chat-send-btn">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Budget Integration with CSV Upload Data
        function loadBudgetActuals() {
            const transactions = JSON.parse(localStorage.getItem('financeos_transactions') || '[]');
            const categoryActuals = {};
            
            transactions.forEach(transaction => {
                if (transaction.amount < 0) {
                    const category = transaction.category;
                    const amount = Math.abs(transaction.amount);
                    const budgetCategory = mapToBudgetCategory(category);
                    
                    if (budgetCategory) {
                        if (!categoryActuals[budgetCategory]) {
                            categoryActuals[budgetCategory] = 0;
                        }
                        categoryActuals[budgetCategory] += amount;
                    }
                }
            });
            
            return categoryActuals;
        }

        function mapToBudgetCategory(transactionCategory) {
            const categoryMapping = {
                'Groceries': 'Groceries',
                'Dining Out': 'Dining Out/Takeaway',
                'Fuel': 'Fuel',
                'Shopping': 'Shopping/Retail',
                'Entertainment': 'Entertainment',
                'Utilities': 'Sky Network'
            };
            
            return categoryMapping[transactionCategory] || null;
        }

        function updateBudgetTable() {
            const actuals = loadBudgetActuals();
            const lastUpdate = localStorage.getItem('financeos_last_update');
            
            // Update sync status
            const syncStatus = document.getElementById('budgetSyncStatus');
            const lastUpdateTime = document.getElementById('lastUpdateTime');
            
            if (Object.keys(actuals).length > 0) {
                syncStatus.querySelector('.sync-indicator').classList.remove('outdated');
                lastUpdateTime.textContent = lastUpdate ? 
                    `(Updated: ${new Date(lastUpdate).toLocaleDateString()})` : 
                    '(Updated: Today)';
            } else {
                syncStatus.querySelector('.sync-indicator').classList.add('outdated');
                syncStatus.innerHTML = `
                    <div class="sync-indicator outdated">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                        No transaction data found
                        <a href="csv-upload.html" style="color: #8b5cf6; text-decoration: none; margin-left: 0.5rem;">
                            Upload statements →
                        </a>
                    </div>
                `;
            }
        }

        // Chart Configuration
        Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        Chart.defaults.backgroundColor = 'rgba(255, 255, 255, 0.05)';

        // Budget Variance Chart
        const varianceCtx = document.getElementById('varianceChart').getContext('2d');
        new Chart(varianceCtx, {
            type: 'bar',
            data: {
                labels: ['Groceries', 'Dining Out', 'Fuel', 'Shopping', 'Entertainment', 'Mobile', 'Internet'],
                datasets: [{
                    label: 'Budget Variance ($)',
                    data: [-77, -87, -18, -48, -23, -5, -5],
                    backgroundColor: function(context) {
                        const value = context.parsed.y;
                        return value < 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';
                    },
                    borderColor: function(context) {
                        const value = context.parsed.y;
                        return value < 0 ? '#ef4444' : '#10b981';
                    },
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Expense Breakdown Chart
        const expenseCtx = document.getElementById('expenseChart').getContext('2d');
        new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: ['Housing', 'Food', 'Insurance', 'Childcare', 'Savings', 'Discretionary', 'Other'],
                datasets: [{
                    data: [2427, 964, 490, 508, 571, 323, 628],
                    backgroundColor: [
                        '#8b5cf6',
                        '#3b82f6', 
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#06d6a0',
                        '#6366f1'
                    ],
                    borderWidth: 2,
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        // AI Coach Functionality
        class AIFinancialCoach {
            constructor() {
                this.isOpen = false;
                this.initialize();
            }

            initialize() {
                this.bindEvents();
                this.loadFinancialContext();
            }

            bindEvents() {
                const toggle = document.getElementById('aiCoachToggle');
                const close = document.getElementById('aiCoachClose');
                const input = document.getElementById('aiChatInput');
                const send = document.getElementById('aiChatSend');

                if (toggle) {
                    toggle.addEventListener('click', () => this.togglePanel());
                }

                if (close) {
                    close.addEventListener('click', () => this.closePanel());
                }

                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            this.sendMessage();
                        }
                    });
                }

                if (send) {
                    send.addEventListener('click', () => this.sendMessage());
                }
            }

            loadFinancialContext() {
                const transactions = JSON.parse(localStorage.getItem('financeos_transactions') || '[]');
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const categorySpending = {};
                transactions.forEach(t => {
                    const transactionDate = new Date(t.date);
                    if (transactionDate.getMonth() === currentMonth && 
                        transactionDate.getFullYear() === currentYear && 
                        t.amount < 0) {
                        
                        const category = t.category;
                        if (!categorySpending[category]) {
                            categorySpending[category] = 0;
                        }
                        categorySpending[category] += Math.abs(t.amount);
                    }
                });

                this.context = {
                    transactions,
                    categorySpending,
                    monthlyIncome: 6304,
                    monthlyExpenses: 9911,
                    monthlyDeficit: -3607,
                    emergencyFund: 0.17
                };
            }

            togglePanel() {
                const panel = document.getElementById('aiCoachPanel');
                if (this.isOpen) {
                    this.closePanel();
                } else {
                    this.openPanel();
                }
            }

            openPanel() {
                const panel = document.getElementById('aiCoachPanel');
                const input = document.getElementById('aiChatInput');
                
                panel.classList.remove('hidden');
                this.isOpen = true;
                
                setTimeout(() => {
                    if (input) input.focus();
                }, 100);
            }

            closePanel() {
                const panel = document.getElementById('aiCoachPanel');
                panel.classList.add('hidden');
                this.isOpen = false;
            }

            async sendMessage() {
                const input = document.getElementById('aiChatInput');
                const message = input.value.trim();
                
                if (!message) return;

                input.value = '';
                this.disableSendButton(true);

                this.addMessage('user', message);

                try {
                    const response = await this.generateResponse(message);
                    this.addMessage('assistant', response);
                } catch (error) {
                    this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
                }

                this.disableSendButton(false);
            }

            addMessage(type, content) {
                const messagesContainer = document.getElementById('aiChatMessages');
                
                const messageElement = document.createElement('div');
                messageElement.className = `ai-message ai-message-${type}`;
                
                const avatar = document.createElement('div');
                avatar.className = 'ai-message-avatar';
                
                if (type === 'assistant') {
                    avatar.innerHTML = `
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16,16.5C16,17.11 15.61,17.5 15,17.5H9C8.39,17.5 8,17.11 8,16.5V15.5C8,14.89 8.39,14.5 9,14.5H15C15.61,14.5 16,14.89 16,15.5V16.5M9,13A1,1 0 0,1 8,12A1,1 0 0,1 9,11A1,1 0 0,1 10,12A1,1 0 0,1 9,13M15,13A1,1 0 0,1 14,12A1,1 0 0,1 15,11A1,1 0 0,1 16,12A1,1 0 0,1 15,13Z" />
                        </svg>
                    `;
                } else {
                    avatar.innerHTML = `
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                        </svg>
                    `;
                }

                const contentElement = document.createElement('div');
                contentElement.className = 'ai-message-content';
                contentElement.innerHTML = content;

                messageElement.appendChild(avatar);
                messageElement.appendChild(contentElement);

                messagesContainer.appendChild(messageElement);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            async generateResponse(query) {
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                return this.parseQuery(query.toLowerCase());
            }

            parseQuery(query) {
                if (query.includes('deficit') || query.includes('fix')) {
                    return `Your <span class="ai-warning-data">$3,607 deficit</span> is critical. Priority actions:
                    
                    <div class="ai-insight-highlight">💡 Immediate fixes: 1) Cut dining out by 50% (-$168), 2) Reduce shopping by 30% (-$59), 3) Review subscriptions. This could reduce deficit by ~$227/month.</div>`;
                }

                if (query.includes('overspend') || query.includes('over')) {
                    return `You're overspending most on:
                    
                    • **Dining Out**: <span class="ai-warning-data">+35% ($87 over)</span>
                    • **Entertainment**: <span class="ai-warning-data">+46% ($23 over)</span>  
                    • **Shopping**: <span class="ai-warning-data">+32% ($48 over)</span>
                    
                    These three categories cost you an extra <span class="ai-warning-data">$158/month</span>.`;
                }

                if (query.includes('emergency')) {
                    return `🚨 Your emergency fund is critically low at <span class="ai-warning-data">$0.17</span>.
                    
                    <div class="ai-insight-highlight">🎯 Start with $50/week transfers from House Kitty ($65K) to build emergency fund. Goal: $15,000. At $200/month, you'll reach this in 6 years - but start NOW!</div>`;
                }

                if (query.includes('expenses') || query.includes('reduce')) {
                    return `Top expense reduction opportunities:
                    
                    1. **Meal prep** instead of dining out (-$100/month)
                    2. **Review Sky Network** subscription (-$50/month)  
                    3. **Shop sales** for groceries (-$50/month)
                    4. **Set entertainment limit** to $30/month (-$43/month)
                    
                    <div class="ai-insight-highlight">💰 Total potential savings: $243/month</div>`;
                }

                return 'I can help you fix your budget deficit, identify overspending, or start an emergency fund. What specific area would you like to focus on?';
            }

            disableSendButton(disabled) {
                const sendButton = document.getElementById('aiChatSend');
                if (sendButton) {
                    sendButton.disabled = disabled;
                }
            }
        }

        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize AI Coach
            window.aiCoach = new AIFinancialCoach();
            
            // Update budget with CSV data
            updateBudgetTable();
            
            // Mobile menu toggle
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const navLinks = document.getElementById('navLinks');

            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', () => {
                    navLinks.classList.toggle('active');
                });
            }

            // Privacy toggle
            const privacyToggle = document.getElementById('privacyToggle');
            if (privacyToggle) {
                privacyToggle.addEventListener('click', function() {
                    document.body.classList.toggle('privacy-mode');
                    this.textContent = document.body.classList.contains('privacy-mode') ? '🔓 Show' : '🔒 Privacy';
                });
            }
        });

        // Global function for quick actions
        function askAI(question) {
            const input = document.getElementById('aiChatInput');
            if (input) {
                input.value = question;
                if (window.aiCoach) {
                    window.aiCoach.sendMessage();
                }
            }
        }

        // Logout function
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('financeos_session');
                window.location.href = 'login.html';
            }
        }
    </script>
</body>
</html>