// Dashboard Module
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

function loadDashboardData() {
    const modules = [
        { id: 'change-control', name: 'Change Control', icon: 'bi-arrow-repeat', color: 'primary', link: 'modules/change-control.html' },
        { id: 'capa', name: 'CAPA', icon: 'bi-check-circle', color: 'success', link: 'modules/capa.html' },
        { id: 'deviation', name: 'Deviation', icon: 'bi-exclamation-triangle', color: 'warning', link: 'modules/deviation.html' },
        { id: 'market-complaint', name: 'Market Complaint', icon: 'bi-chat-left-text', color: 'danger', link: 'modules/market-complaint.html' },
        { id: 'lir', name: 'Lab Incident Report', icon: 'bi-flask', color: 'info', link: 'modules/lir.html' },
        { id: 'audit', name: 'Audit Management', icon: 'bi-clipboard-check', color: 'primary', link: 'modules/audit.html' },
        { id: 'vendor-qualification', name: 'Vendor Qualification', icon: 'bi-building', color: 'secondary', link: 'modules/vendor-qualification.html' },
        { id: 'qrm', name: 'Quality Risk Management', icon: 'bi-shield-exclamation', color: 'warning', link: 'modules/qrm.html' },
        { id: 'product-recall', name: 'Product Recall', icon: 'bi-arrow-counterclockwise', color: 'danger', link: 'modules/product-recall.html' },
        { id: 'oos-oot', name: 'OOS/OOT Management', icon: 'bi-graph-up', color: 'info', link: 'modules/oos-oot.html' }
    ];

    // Load statistics
    loadStatistics();
    
    // Load module cards
    loadModuleCards(modules);

    // Show Admin link only for Admin users
    const adminLink = document.getElementById('adminLink');
    if (adminLink && authManager.isAdmin()) {
        adminLink.style.display = 'block';
    }
}

function loadStatistics() {
    const statsContainer = document.getElementById('statsCards');
    if (!statsContainer) return;

    // Get statistics from localStorage
    const stats = {
        totalOpen: 0,
        totalClosed: 0,
        pendingApproval: 0,
        overdue: 0
    };

    // Calculate stats from all modules
    const modules = ['change-control', 'capa', 'deviation', 'market-complaint', 'lir', 'audit', 'vendor-qualification', 'qrm', 'product-recall', 'oos-oot'];
    
    modules.forEach(module => {
        const data = JSON.parse(localStorage.getItem(module + '_data') || '[]');
        data.forEach(item => {
            if (item.status === 'Open' || item.status === 'Pending') {
                stats.totalOpen++;
            } else if (item.status === 'Closed') {
                stats.totalClosed++;
            }
            if (item.status === 'Pending Approval') {
                stats.pendingApproval++;
            }
        });
    });

    statsContainer.innerHTML = `
        <div class="col-md-3 mb-3">
            <div class="card stat-card border-start border-primary border-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-muted mb-1">Total Open</h6>
                            <h3 class="mb-0">${stats.totalOpen}</h3>
                        </div>
                        <div class="stat-icon text-primary">
                            <i class="bi bi-folder-open"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card stat-card border-start border-success border-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-muted mb-1">Total Closed</h6>
                            <h3 class="mb-0">${stats.totalClosed}</h3>
                        </div>
                        <div class="stat-icon text-success">
                            <i class="bi bi-check-circle"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card stat-card border-start border-warning border-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-muted mb-1">Pending Approval</h6>
                            <h3 class="mb-0">${stats.pendingApproval}</h3>
                        </div>
                        <div class="stat-icon text-warning">
                            <i class="bi bi-clock-history"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card stat-card border-start border-danger border-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-muted mb-1">Overdue</h6>
                            <h3 class="mb-0">${stats.overdue}</h3>
                        </div>
                        <div class="stat-icon text-danger">
                            <i class="bi bi-exclamation-triangle"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadModuleCards(modules) {
    const cardsContainer = document.getElementById('moduleCards');
    if (!cardsContainer) return;

    cardsContainer.innerHTML = modules.map(module => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card module-card shadow-sm" onclick="window.location.href='${module.link}'">
                <div class="card-body text-center">
                    <div class="module-icon">
                        <i class="bi ${module.icon}"></i>
                    </div>
                    <h5 class="card-title">${module.name}</h5>
                    <p class="text-muted small">Click to access module</p>
                </div>
            </div>
        </div>
    `).join('');
}

