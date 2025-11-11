// Audit Management Module
document.addEventListener('DOMContentLoaded', function() {
    loadAuditData();
    setupFilters();
});

function loadAuditData() {
    const data = JSON.parse(localStorage.getItem('audit_data') || '[]');
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No records found</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((audit, index) => `
        <tr>
            <td><strong>${audit.auditNumber}</strong></td>
            <td><span class="badge bg-info">${audit.auditType}</span></td>
            <td>${Utils.formatDate(audit.auditDate)}</td>
            <td>${audit.findings ? audit.findings.length : 0}</td>
            <td><span class="badge bg-${getStatusColor(audit.status)}">${audit.status}</span></td>
            <td><button class="btn btn-sm btn-primary" onclick="viewAudit(${index})"><i class="bi bi-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = { 'Scheduled': 'primary', 'In Progress': 'warning', 'Completed': 'success' };
    return colors[status] || 'secondary';
}

function submitAudit() {
    const form = document.getElementById('auditForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const auditData = {
        auditNumber: Utils.generateNumber('AUD'),
        auditType: document.getElementById('auditType').value,
        auditDate: document.getElementById('auditDate').value,
        auditors: document.getElementById('auditors').value.split(',').map(a => a.trim()),
        scope: document.getElementById('auditScope').value,
        status: 'Scheduled',
        findings: [],
        actionItems: [],
        complianceStatus: 'Pending',
        createdBy: authManager.getCurrentUser().name,
        createdDate: new Date().toISOString(),
        auditTrail: [{ action: 'Created', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() }]
    };
    
    const allData = JSON.parse(localStorage.getItem('audit_data') || '[]');
    allData.push(auditData);
    localStorage.setItem('audit_data', JSON.stringify(allData));
    
    form.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('newAuditModal'));
    modal.hide();
    Utils.showNotification('Audit created successfully', 'success');
    loadAuditData();
}

function viewAudit(index) {
    const data = JSON.parse(localStorage.getItem('audit_data') || '[]');
    const audit = data[index];
    if (!audit) return;
    
    const content = `
        <div class="row mb-3"><div class="col-md-12"><h6>Audit Number: <strong>${audit.auditNumber}</strong></h6><p class="mb-0">Status: <span class="badge bg-${getStatusColor(audit.status)}">${audit.status}</span></p></div></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Audit Type</strong></label><p><span class="badge bg-info">${audit.auditType}</span></p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Audit Date</strong></label><p>${Utils.formatDate(audit.auditDate)}</p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Auditors</strong></label><p>${audit.auditors.join(', ')}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Scope</strong></label><p>${audit.scope}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Findings</strong></label>${audit.findings.length > 0 ? `<ul>${audit.findings.map(f => `<li>${f}</li>`).join('')}</ul>` : '<p>No findings recorded yet</p>'}</div>
        <div class="mb-3"><label class="form-label"><strong>Action Items</strong></label>${audit.actionItems.length > 0 ? `<ul>${audit.actionItems.map(a => `<li>${a}</li>`).join('')}</ul>` : '<p>No action items yet</p>'}</div>
        ${canManageAudit(audit) ? `<div class="mt-3"><button class="btn btn-success me-2" onclick="completeAudit(${index})"><i class="bi bi-check-circle me-2"></i>Complete Audit</button><button class="btn btn-info me-2" onclick="addFinding(${index})"><i class="bi bi-plus-circle me-2"></i>Add Finding</button></div>` : ''}
    `;
    
    document.getElementById('viewAuditContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewAuditModal')).show();
}

function canManageAudit(audit) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    return ['QA Manager', 'Head QA'].includes(user.role);
}

function completeAudit(index) {
    if (!Utils.confirmAction('Are you sure you want to mark this audit as completed?')) return;
    const data = JSON.parse(localStorage.getItem('audit_data') || '[]');
    const audit = data[index];
    audit.status = 'Completed';
    audit.complianceStatus = 'Compliant';
    audit.auditTrail.push({ action: 'Completed', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('audit_data', JSON.stringify(data));
    Utils.showNotification('Audit marked as completed', 'success');
    bootstrap.Modal.getInstance(document.getElementById('viewAuditModal')).hide();
    loadAuditData();
}

function addFinding(index) {
    const finding = prompt('Enter audit finding:');
    if (!finding) return;
    const data = JSON.parse(localStorage.getItem('audit_data') || '[]');
    const audit = data[index];
    audit.findings.push(finding);
    audit.status = 'In Progress';
    localStorage.setItem('audit_data', JSON.stringify(data));
    Utils.showNotification('Finding added', 'success');
    viewAudit(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchAudit');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.addEventListener('input', filterAuditTable);
    if (statusFilter) statusFilter.addEventListener('change', filterAuditTable);
}

function filterAuditTable() {
    const searchTerm = document.getElementById('searchAudit').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('audit_data') || '[]');
    const filtered = data.filter(audit => {
        const matchesSearch = !searchTerm || audit.auditNumber.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || audit.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const tbody = document.getElementById('auditTableBody');
    if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">No records found</td></tr>'; return; }
    tbody.innerHTML = filtered.map((audit, index) => {
        const originalIndex = data.indexOf(audit);
        return `<tr><td><strong>${audit.auditNumber}</strong></td><td><span class="badge bg-info">${audit.auditType}</span></td><td>${Utils.formatDate(audit.auditDate)}</td><td>${audit.findings ? audit.findings.length : 0}</td><td><span class="badge bg-${getStatusColor(audit.status)}">${audit.status}</span></td><td><button class="btn btn-sm btn-primary" onclick="viewAudit(${originalIndex})"><i class="bi bi-eye"></i></button></td></tr>`;
    }).join('');
}

function generateAuditReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const type = document.getElementById('reportType').value;
    let data = JSON.parse(localStorage.getItem('audit_data') || '[]');
    if (fromDate) data = data.filter(audit => new Date(audit.auditDate) >= new Date(fromDate));
    if (toDate) data = data.filter(audit => new Date(audit.auditDate) <= new Date(toDate));
    if (type) data = data.filter(audit => audit.auditType === type);
    const reportContent = `<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Audit Number</th><th>Type</th><th>Date</th><th>Status</th><th>Findings</th></tr></thead><tbody>${data.map(audit => `<tr><td>${audit.auditNumber}</td><td>${audit.auditType}</td><td>${Utils.formatDate(audit.auditDate)}</td><td>${audit.status}</td><td>${audit.findings ? audit.findings.length : 0}</td></tr>`).join('')}</tbody></table></div><div class="mt-3"><button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(audit => ({ 'Audit Number': audit.auditNumber, 'Type': audit.auditType, 'Date': Utils.formatDate(audit.auditDate), 'Status': audit.status, 'Findings': audit.findings ? audit.findings.length : 0 })))}, 'audit-report.csv')"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV</button></div>`;
    document.getElementById('reportContent').innerHTML = reportContent;
}

