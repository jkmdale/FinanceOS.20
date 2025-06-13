<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinanceOS - CSV Upload</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
    
    <!-- Include the Data Sync Manager -->
    <script>
        /**
         * FinanceOS Data Sync Manager
         * Enables automatic updates across all pages when CSV data is uploaded
         */
        class FinanceOSDataSync {
            constructor() {
                this.updateCallbacks = [];
                this.lastUpdateCheck = 0;
                this.setupUpdateListeners();
                console.log('FinanceOS Data Sync Manager initialized');
            }

            onDataUpdate(callback) {
                this.updateCallbacks.push(callback);
            }

            setupUpdateListeners() {
                // BroadcastChannel for cross-tab updates
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('financeos_updates');
                    bc.addEventListener('message', (event) => {
                        if (event.data.type === 'DATA_UPDATED') {
                            this.handleDataUpdate(event.data);
                        }
                    });
                }

                // Storage events for cross-tab updates
                window.addEventListener('storage', (event) => {
                    if (event.key === 'financeos_data_updated') {
                        this.handleDataUpdate({ source: 'storage' });
                    }
                });

                // Custom events for same-page updates
                window.addEventListener('financeos_data_updated', (event) => {
                    this.handleDataUpdate(event.detail);
                });

                // Polling fallback
                setInterval(() => this.checkForUpdates(), 5000);
                window.addEventListener('focus', () => this.checkForUpdates());
            }

            checkForUpdates() {
                const lastUpdate = parseInt(localStorage.getItem('financeos_data_updated') || '0');
                if (lastUpdate > this.lastUpdateCheck) {
                    this.lastUpdateCheck = lastUpdate;
                    this.handleDataUpdate({ source: 'polling', timestamp: lastUpdate });
                }
            }

            handleDataUpdate(data) {
                console.log('Handling data update:', data);
                this.updateCallbacks.forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('Error in update callback:', error);
                    }
                });
            }

            showUpdateNotification(message = 'Financial data updated!') {
                let notification = document.getElementById('data-update-notification');
                
                if (!notification) {
                    notification = document.createElement('div');
                    notification.id = 'data-update-notification';
                    notification.style.cssText = `
                        position: fixed; top: 20px; right: 20px; z-index: 10000;
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white; padding: 15px 20px; border-radius: 12px;
                        box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-weight: 600; backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        transform: translateX(400px); transition: transform 0.3s ease;
                    `;
                    document.body.appendChild(notification);
                }

                notification.textContent = message;
                setTimeout(() => notification.style.transform = 'translateX(0)', 100);
                setTimeout(() => {
                    notification.style.transform = 'translateX(400px)';
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }
        }

        // Initialize global sync manager
        window.FinanceOSSync = new FinanceOSDataSync();
    <style>
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
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .title {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }

        .subtitle {
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
        }

        .upload-area {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 2px dashed rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            padding: 60px 40px;
            text-align: center;
            margin-bottom: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .upload-area:hover {
            border-color: #8b5cf6;
            background: rgba(139, 92, 246, 0.1);
        }

        .upload-area.dragover {
            border-color: #8b5cf6;
            background: rgba(139, 92, 246, 0.2);
            transform: scale(1.02);
        }

        .upload-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }

        .upload-text {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .upload-subtext {
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 20px;
        }

        .file-input {
            display: none;
        }

        .upload-btn {
            background: linear-gradient(135deg, #8b5cf6, #9333ea);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .upload-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
        }

        .file-list {
            margin-bottom: 20px;
        }

        .file-item {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 12px;
            padding: 15px 20px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .file-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .file-icon {
            font-size: 24px;
        }

        .file-details h4 {
            margin-bottom: 5px;
        }

        .file-details p {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .file-status {
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }

        .status-pending {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
        }

        .status-processing {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
        }

        .status-success {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }

        .status-error {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }

        .process-btn {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin-top: 20px;
            width: 100%;
        }

        .process-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .results {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 20px;
            margin-top: 20px;
            display: none;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }

        .transactions-preview {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
        }

        .transaction-item {
            padding: 10px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
        }

        .transaction-item:last-child {
            border-bottom: none;
        }

        .transaction-desc {
            font-weight: 500;
        }

        .transaction-date {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .transaction-amount {
            font-weight: bold;
        }

        .amount-positive { color: #10b981; }
        .amount-negative { color: #ef4444; }

        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid #8b5cf6;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .nav-link {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s ease;
            display: inline-block;
            margin-right: 10px;
            margin-bottom: 20px;
        }

        .nav-link:hover {
            color: white;
            background: rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Navigation -->
        <div style="margin-bottom: 30px;">
            <a href="index.html" class="nav-link">← Back to Dashboard</a>
            <a href="budget.html" class="nav-link">Budget</a>
            <a href="goals.html" class="nav-link">Goals</a>
        </div>

        <!-- Header -->
        <div class="header">
            <h1 class="title">Upload CSV Files</h1>
            <p class="subtitle">Import your bank statements to update all financial data</p>
        </div>

        <!-- Upload Area -->
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📤</div>
            <div class="upload-text">Drop CSV files here</div>
            <div class="upload-subtext">or click to select multiple files</div>
            <button class="upload-btn" onclick="selectFiles()">Choose Files</button>
            <input type="file" id="fileInput" class="file-input" multiple accept=".csv,.xlsx,.xls">
        </div>

        <!-- File List -->
        <div class="file-list" id="fileList"></div>

        <!-- Process Button -->
        <button class="process-btn" id="processBtn" onclick="processAllFiles()" style="display: none;">
            Process All Files
        </button>

        <!-- Results -->
        <div class="results" id="results">
            <h3 style="margin-bottom: 15px;">Import Results</h3>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="totalCount">0</div>
                    <div class="stat-label">Transactions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value amount-positive" id="totalIncome">$0</div>
                    <div class="stat-label">Income</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value amount-negative" id="totalExpenses">$0</div>
                    <div class="stat-label">Expenses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="netAmount">$0</div>
                    <div class="stat-label">Net Change</div>
                </div>
            </div>

            <h4 style="margin-bottom: 10px;">Recent Transactions</h4>
            <div class="transactions-preview" id="transactionsPreview"></div>
        </div>
    </div>

    <script>
        // Global variables
        let selectedFiles = [];
        let allTransactions = [];

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            console.log('CSV Upload initialized');
            setupEventListeners();
            loadExistingData();
        });

        function setupEventListeners() {
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');

            // Drag and drop
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files);
                handleFiles(files);
            });

            // Click to select
            uploadArea.addEventListener('click', function() {
                selectFiles();
            });

            // File input change
            fileInput.addEventListener('change', function(e) {
                const files = Array.from(e.target.files);
                handleFiles(files);
            });
        }

        function selectFiles() {
            document.getElementById('fileInput').click();
        }

        function handleFiles(files) {
            console.log('Files selected:', files.length);
            
            // Filter valid files
            const validFiles = files.filter(file => {
                const ext = file.name.toLowerCase().split('.').pop();
                return ['csv', 'xlsx', 'xls'].includes(ext);
            });

            if (validFiles.length === 0) {
                alert('Please select CSV or Excel files only.');
                return;
            }

            // Add to selected files
            validFiles.forEach(file => {
                selectedFiles.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    status: 'pending',
                    transactions: []
                });
            });

            renderFileList();
            showProcessButton();
        }

        function renderFileList() {
            const fileList = document.getElementById('fileList');
            
            if (selectedFiles.length === 0) {
                fileList.innerHTML = '';
                return;
            }

            fileList.innerHTML = selectedFiles.map((fileObj, index) => `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-icon">📄</div>
                        <div class="file-details">
                            <h4>${fileObj.name}</h4>
                            <p>${formatFileSize(fileObj.size)}</p>
                        </div>
                    </div>
                    <div class="file-status status-${fileObj.status}">
                        ${fileObj.status === 'processing' ? '<div class="spinner"></div>' : ''}
                        ${fileObj.status === 'pending' ? 'Ready' : 
                          fileObj.status === 'processing' ? 'Processing' :
                          fileObj.status === 'success' ? `✓ ${fileObj.transactions.length} rows` :
                          'Error'}
                    </div>
                </div>
            `).join('');
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function showProcessButton() {
            const processBtn = document.getElementById('processBtn');
            processBtn.style.display = selectedFiles.length > 0 ? 'block' : 'none';
        }

        async function processAllFiles() {
            const processBtn = document.getElementById('processBtn');
            processBtn.disabled = true;
            processBtn.innerHTML = '<div class="spinner"></div> Processing...';

            console.log('Starting to process all files...');

            for (let i = 0; i < selectedFiles.length; i++) {
                if (selectedFiles[i].status === 'pending') {
                    await processFile(i);
                }
            }

            processBtn.innerHTML = 'Process Complete!';
            setTimeout(() => {
                processBtn.innerHTML = 'Process All Files';
                processBtn.disabled = false;
            }, 2000);

            updateResults();
            saveData();
        }

        async function processFile(index) {
            const fileObj = selectedFiles[index];
            
            console.log(`Processing file: ${fileObj.name}`);
            fileObj.status = 'processing';
            renderFileList();

            try {
                const csvData = await parseCSV(fileObj.file);
                console.log(`Parsed ${csvData.length} rows`);
                
                const transactions = csvData.map(row => processRow(row)).filter(t => t !== null);
                console.log(`Processed ${transactions.length} valid transactions`);
                
                fileObj.transactions = transactions;
                fileObj.status = 'success';
                
                // Add to global transactions
                allTransactions.push(...transactions);
                
            } catch (error) {
                console.error('Error processing file:', error);
                fileObj.status = 'error';
            }

            renderFileList();
        }

        function parseCSV(file) {
            return new Promise((resolve, reject) => {
                Papa.parse(