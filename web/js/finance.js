/**
 * Finance Management System for AquaAlert
 * Handles invoicing, mutual aid scheme, and financial reporting
 */
class FinanceManager {
    constructor() {
        this.invoices = [];
        this.mutualAidTransactions = [];
        this.partners = [];
        this.initializeData();
        this.initializeEventListeners();
    }

    initializeData() {
        // Load mock data for testing
        this.partners = [
            { id: 1, name: 'Thames Water', balance: 2500 },
            { id: 2, name: 'Severn Trent', balance: -1200 },
            { id: 3, name: 'Yorkshire Water', balance: 850 },
            { id: 4, name: 'United Utilities', balance: 1300 }
        ];

        this.invoices = [
            {
                id: 'INV-2025-001',
                client: 'Local Council',
                serviceType: 'deployment',
                amount: 4500,
                issueDate: '2025-03-15',
                dueDate: '2025-04-14',
                status: 'pending'
            },
            {
                id: 'INV-2025-002',
                client: 'NHS Hospital',
                serviceType: 'maintenance',
                amount: 2800,
                issueDate: '2025-03-10',
                dueDate: '2025-04-09',
                status: 'paid'
            }
        ];

        this.mutualAidTransactions = [
            {
                id: 'MA-2025-001',
                partner: 'Thames Water',
                type: 'lend',
                resources: '2 Bowsers',
                amount: 1500,
                date: '2025-03-18',
                status: 'active'
            },
            {
                id: 'MA-2025-002',
                partner: 'Severn Trent',
                type: 'borrow',
                resources: 'Personnel (3)',
                amount: 1200,
                date: '2025-03-15',
                status: 'completed'
            }
        ];

        this.updateDisplay();
    }

    initializeEventListeners() {
        // Financial month change
        document.getElementById('financialMonth').addEventListener('change', () => {
            this.updateFinancialOverview();
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
        });

        // Window click for modal close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    updateDisplay() {
        this.updateFinancialOverview();
        this.updateInvoicesList();
        this.updatePartnersList();
        this.updateTransactionsList();
    }

    updateFinancialOverview() {
        // In a real application, this would fetch data from the server
        // Currently using mock data for demonstration
        const month = document.getElementById('financialMonth').value;
        // Update would be based on the selected month
    }

    updateInvoicesList() {
        const tbody = document.getElementById('invoicesList');
        tbody.innerHTML = '';

        this.invoices.forEach(invoice => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${invoice.id}</td>
                <td>${invoice.client}</td>
                <td>${this.formatServiceType(invoice.serviceType)}</td>
                <td>£${invoice.amount.toLocaleString()}</td>
                <td>${this.formatDate(invoice.issueDate)}</td>
                <td>${this.formatDate(invoice.dueDate)}</td>
                <td><span class="status-badge status-${invoice.status}">${invoice.status}</span></td>
                <td>
                    <button class="secondary-btn" onclick="financeManager.viewInvoice('${invoice.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="secondary-btn" onclick="financeManager.downloadInvoice('${invoice.id}')">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    updatePartnersList() {
        const container = document.getElementById('partnersList');
        container.innerHTML = '';

        this.partners.forEach(partner => {
            const card = document.createElement('div');
            card.className = 'partner-card';
            card.innerHTML = `
                <h4>${partner.name}</h4>
                <div class="partner-balance ${partner.balance >= 0 ? 'positive' : 'negative'}">
                    Balance: £${partner.balance.toLocaleString()}
                </div>
            `;
            container.appendChild(card);
        });

        // Update partner select in mutual aid form
        const select = document.getElementById('partnerCompany');
        if (select) {
            select.innerHTML = '<option value="">Select partner company</option>';
            this.partners.forEach(partner => {
                select.innerHTML += `<option value="${partner.id}">${partner.name}</option>`;
            });
        }
    }

    updateTransactionsList() {
        const tbody = document.getElementById('transactionsList');
        tbody.innerHTML = '';

        this.mutualAidTransactions.forEach(transaction => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${this.formatDate(transaction.date)}</td>
                <td>${transaction.partner}</td>
                <td>${this.formatTransactionType(transaction.type)}</td>
                <td>${transaction.resources}</td>
                <td>£${transaction.amount.toLocaleString()}</td>
                <td><span class="status-badge status-${transaction.status}">${transaction.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    createInvoice() {
        document.getElementById('invoiceForm').reset();
        document.getElementById('invoiceModal').style.display = 'block';
    }

    recordMutualAid() {
        document.getElementById('mutualAidForm').reset();
        document.getElementById('mutualAidModal').style.display = 'block';
    }

    submitInvoice() {
        const form = document.getElementById('invoiceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // In a real application, this would be sent to the server
        const invoice = {
            id: `INV-2025-${String(this.invoices.length + 1).padStart(3, '0')}`,
            client: document.getElementById('clientName').value,
            serviceType: document.getElementById('serviceType').value,
            amount: parseFloat(document.getElementById('amount').value),
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: document.getElementById('dueDate').value,
            status: 'pending'
        };

        this.invoices.push(invoice);
        this.updateInvoicesList();
        this.closeModal('invoiceModal');
        this.showNotification('Invoice created successfully');
    }

    submitMutualAid() {
        const form = document.getElementById('mutualAidForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // In a real application, this would be sent to the server
        const transaction = {
            id: `MA-2025-${String(this.mutualAidTransactions.length + 1).padStart(3, '0')}`,
            partner: this.partners.find(p => p.id === parseInt(document.getElementById('partnerCompany').value)).name,
            type: document.getElementById('transactionType').value,
            resources: `${document.getElementById('resourceType').value} (${document.getElementById('quantity').value})`,
            amount: parseFloat(document.getElementById('estimatedCost').value),
            date: new Date().toISOString().split('T')[0],
            status: 'active'
        };

        this.mutualAidTransactions.push(transaction);
        this.updateTransactionsList();
        this.closeModal('mutualAidModal');
        this.showNotification('Mutual aid transaction recorded successfully');
    }

    exportInvoices() {
        // In a real application, this would generate a CSV/Excel file
        this.showNotification('Exporting invoices...');
    }

    viewInvoice(id) {
        const invoice = this.invoices.find(i => i.id === id);
        if (invoice) {
            // In a real application, this would open a detailed view
            this.showNotification('Viewing invoice details...');
        }
    }

    downloadInvoice(id) {
        // In a real application, this would download a PDF
        this.showNotification('Downloading invoice...');
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    formatServiceType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    formatTransactionType(type) {
        return type === 'lend' ? 'Lending' : 'Borrowing';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-GB');
    }

    showNotification(message) {
        // In a real application, this would use a proper notification system
        alert(message);
    }
}

// Initialize finance manager when the page loads
let financeManager;
document.addEventListener('DOMContentLoaded', () => {
    financeManager = new FinanceManager();
});
