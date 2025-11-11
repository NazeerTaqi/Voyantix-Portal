// CAPA Module
document.addEventListener('DOMContentLoaded', function() {
    loadCAPAData();
    setupFilters();
});

function loadCAPAData() {
    const data = JSON.parse(localStorage.getItem('capa_data') || '[]');
    const tbody = document.getElementById('capaTableBody');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((capa, index) => `
        <tr>
            <td><strong>${capa.capaNumber}</strong></td>
            <td>${capa.source}</td>
            <td>${capa.description.substring(0, 50)}...</td>
            <td><span class="badge bg-${getStatusColor(capa.status)}">${capa.status}</span></td>
            <td>${capa.initiator}</td>
            <td>${Utils.formatDate(capa.createdDate)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="viewCAPA(${index})"><i class="bi bi-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = { 'Open': 'primary', 'Pending Approval': 'warning', 'Closed': 'success', 'Overdue': 'danger' };
    return colors[status] || 'secondary';
}

function submitCAPA() {
    const form = document.getElementById('capaForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const capaData = {
        capaNumber: Utils.generateNumber('CAPA'),
        source: document.getElementById('capaSource').value,
        description: document.getElementById('capaDescription').value,
        actionPlan: document.getElementById('capaActionPlan').value,
        targetDate: document.getElementById('capaTargetDate').value,
        responsible: document.getElementById('capaResponsible').value,
        status: 'Open',
        workflow: {
            currentStep: 'Initiator',
            steps: [
                { step: 'Initiator', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'HOD', status: 'Pending', user: '', date: null },
                { step: 'QA Manager', status: 'Pending', user: '', date: null },
                { step: 'Head QA', status: 'Pending', user: '', date: null }
            ]
        },
        initiator: authManager.getCurrentUser().name,
        initiatorRole: authManager.getCurrentUser().role,
        createdDate: new Date().toISOString(),
        comments: [],
        delayJustification: '',
        auditTrail: [{ action: 'Created', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() }]
    };
    
    const allData = JSON.parse(localStorage.getItem('capa_data') || '[]');
    allData.push(capaData);
    localStorage.setItem('capa_data', JSON.stringify(allData));
    
    form.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('newCAPAModal'));
    modal.hide();
    Utils.showNotification('CAPA created successfully', 'success');
    loadCAPAData();
}

function viewCAPA(index) {
    const data = JSON.parse(localStorage.getItem('capa_data') || '[]');
    const capa = data[index];
    if (!capa) return;
    
    const content = `
        <div class="row mb-3"><div class="col-md-12"><h6>CAPA Number: <strong>${capa.capaNumber}</strong></h6><p class="mb-0">Status: <span class="badge bg-${getStatusColor(capa.status)}">${capa.status}</span></p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Source</strong></label><p>${capa.source}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Description</strong></label><p>${capa.description}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Action Plan</strong></label><p>${capa.actionPlan}</p></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Target Date</strong></label><p>${Utils.formatDate(capa.targetDate)}</p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Responsible Person</strong></label><p>${capa.responsible}</p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Workflow</strong></label><div class="workflow-steps">${capa.workflow.steps.map((step, i) => `<div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === capa.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}"><div class="step-circle">${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}</div><div class="step-label">${step.step}</div>${step.user ? `<small>${step.user}</small>` : ''}</div>`).join('')}</div></div>
        ${canApproveCAPA(capa) ? `<div class="mt-3"><button class="btn btn-success me-2" onclick="approveCAPA(${index})"><i class="bi bi-check-circle me-2"></i>Approve</button><button class="btn btn-danger me-2" onclick="rejectCAPA(${index})"><i class="bi bi-x-circle me-2"></i>Reject</button></div>` : ''}
        <div class="mt-4"><h6>Comments</h6><div id="capaComments">${capa.comments.length > 0 ? capa.comments.map(c => `<div class="comment-item mb-2"><strong>${c.user}</strong> (${c.date})<br>${c.comment}</div>`).join('') : '<p>No comments yet</p>'}</div><div class="mt-3"><textarea class="form-control" id="newComment" rows="2" placeholder="Add a comment..."></textarea><button class="btn btn-primary mt-2" onclick="addCAPAComment(${index})">Add Comment</button></div></div>
    `;
    
    document.getElementById('viewCAPAContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewCAPAModal')).show();
}

function canApproveCAPA(capa) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    const currentStep = capa.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    const roleMap = { 'HOD': ['HOD'], 'QA Manager': ['QA Manager'], 'Head QA': ['Head QA'] };
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveCAPA(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this CAPA?')) return;
    const data = JSON.parse(localStorage.getItem('capa_data') || '[]');
    const capa = data[index];
    const currentStepIndex = capa.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        capa.workflow.steps[currentStepIndex].status = 'Completed';
        capa.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        capa.workflow.steps[currentStepIndex].date = new Date().toISOString();
        if (currentStepIndex < capa.workflow.steps.length - 1) {
            capa.workflow.steps[currentStepIndex + 1].status = 'Pending';
            capa.status = 'Pending Approval';
        } else { capa.status = 'Approved'; }
    }
    capa.auditTrail.push({ action: 'Approved', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('capa_data', JSON.stringify(data));
    Utils.showNotification('CAPA approved successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('viewCAPAModal')).hide();
    loadCAPAData();
}

function rejectCAPA(index) {
    if (!Utils.confirmAction('Are you sure you want to reject this CAPA?')) return;
    const data = JSON.parse(localStorage.getItem('capa_data') || '[]');
    const capa = data[index];
    capa.status = 'Rejected';
    capa.auditTrail.push({ action: 'Rejected', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('capa_data', JSON.stringify(data));
    Utils.showNotification('CAPA rejected', 'info');
    bootstrap.Modal.getInstance(document.getElementById('viewCAPAModal')).hide();
    loadCAPAData();
}

function addCAPAComment(index) {
    const comment = document.getElementById('newComment').value.trim();
    if (!comment) return;
    const data = JSON.parse(localStorage.getItem('capa_data') || '[]');
    const capa = data[index];
    capa.comments.push({ user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, comment: comment, date: Utils.formatDate(new Date()) });
    localStorage.setItem('capa_data', JSON.stringify(data));
    document.getElementById('newComment').value = '';
    viewCAPA(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchCAPA');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.addEventListener('input', filterCAPATable);
    if (statusFilter) statusFilter.addEventListener('change', filterCAPATable);
}

function filterCAPATable() {
    const searchTerm = document.getElementById('searchCAPA').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('capa_data') || '[]');
    const filtered = data.filter(capa => {
        const matchesSearch = !searchTerm || capa.capaNumber.toLowerCase().includes(searchTerm) || capa.description.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || capa.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const tbody = document.getElementById('capaTableBody');
    if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>'; return; }
    tbody.innerHTML = filtered.map((capa, index) => {
        const originalIndex = data.indexOf(capa);
        return `<tr><td><strong>${capa.capaNumber}</strong></td><td>${capa.source}</td><td>${capa.description.substring(0, 50)}...</td><td><span class="badge bg-${getStatusColor(capa.status)}">${capa.status}</span></td><td>${capa.initiator}</td><td>${Utils.formatDate(capa.createdDate)}</td><td><button class="btn btn-sm btn-primary" onclick="viewCAPA(${originalIndex})"><i class="bi bi-eye"></i></button></td></tr>`;
    }).join('');
}

function generateCAPAReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const status = document.getElementById('reportStatus').value;
    let data = JSON.parse(localStorage.getItem('capa_data') || '[]');
    if (fromDate) data = data.filter(capa => new Date(capa.createdDate) >= new Date(fromDate));
    if (toDate) data = data.filter(capa => new Date(capa.createdDate) <= new Date(toDate));
    if (status) data = data.filter(capa => capa.status === status);
    const reportContent = `<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>CAPA Number</th><th>Source</th><th>Status</th><th>Initiator</th><th>Created Date</th></tr></thead><tbody>${data.map(capa => `<tr><td>${capa.capaNumber}</td><td>${capa.source}</td><td>${capa.status}</td><td>${capa.initiator}</td><td>${Utils.formatDate(capa.createdDate)}</td></tr>`).join('')}</tbody></table></div><div class="mt-3"><button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(capa => ({ 'CAPA Number': capa.capaNumber, 'Source': capa.source, 'Status': capa.status, 'Initiator': capa.initiator, 'Created Date': Utils.formatDate(capa.createdDate) })))}, 'capa-report.csv')"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV</button></div>`;
    document.getElementById('reportContent').innerHTML = reportContent;
}

