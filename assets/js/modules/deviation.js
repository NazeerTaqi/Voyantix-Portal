// Deviation Module
document.addEventListener('DOMContentLoaded', function() {
    loadDeviationData();
    setupFilters();
});

function loadDeviationData() {
    const data = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    const tbody = document.getElementById('deviationTableBody');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((dev, index) => `
        <tr>
            <td><strong>${dev.deviationNumber}</strong></td>
            <td>${dev.description.substring(0, 50)}...</td>
            <td>${dev.relatedTo}</td>
            <td><span class="badge bg-${getStatusColor(dev.status)}">${dev.status}</span></td>
            <td>${dev.initiator}</td>
            <td>${Utils.formatDate(dev.createdDate)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="viewDeviation(${index})"><i class="bi bi-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = { 'Open': 'primary', 'Under Investigation': 'warning', 'Closed': 'success', 'Overdue': 'danger' };
    return colors[status] || 'secondary';
}

function submitDeviation() {
    const form = document.getElementById('deviationForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const deviationData = {
        deviationNumber: Utils.generateNumber('DEV'),
        description: document.getElementById('deviationDescription').value,
        relatedTo: document.getElementById('deviationRelatedTo').value,
        impactOn: document.getElementById('deviationImpact').value,
        actionsTaken: document.getElementById('deviationActions').value,
        department: document.getElementById('deviationDepartment').value,
        status: 'Open',
        investigation: '',
        riskAssessment: '',
        targetCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        workflow: {
            currentStep: 'Initiator',
            steps: [
                { step: 'Initiator', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'HOD', status: 'Pending', user: '', date: null },
                { step: 'QA Manager', status: 'Pending', user: '', date: null },
                { step: 'Plant Head', status: 'Pending', user: '', date: null },
                { step: 'Head QA', status: 'Pending', user: '', date: null },
                { step: 'Investigator', status: 'Pending', user: '', date: null }
            ]
        },
        initiator: authManager.getCurrentUser().name,
        initiatorRole: authManager.getCurrentUser().role,
        createdDate: new Date().toISOString(),
        comments: [],
        auditTrail: [{ action: 'Created', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() }]
    };
    
    const allData = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    allData.push(deviationData);
    localStorage.setItem('deviation_data', JSON.stringify(allData));
    
    form.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('newDeviationModal'));
    modal.hide();
    Utils.showNotification('Deviation created successfully', 'success');
    loadDeviationData();
}

function viewDeviation(index) {
    const data = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    const dev = data[index];
    if (!dev) return;
    
    const content = `
        <div class="row mb-3"><div class="col-md-12"><h6>Deviation Number: <strong>${dev.deviationNumber}</strong></h6><p class="mb-0">Status: <span class="badge bg-${getStatusColor(dev.status)}">${dev.status}</span></p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Description</strong></label><p>${dev.description}</p></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Related To</strong></label><p>${dev.relatedTo}</p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Impact On</strong></label><p>${dev.impactOn}</p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Actions Taken</strong></label><p>${dev.actionsTaken}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Department</strong></label><p>${dev.department}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Target Close Date</strong></label><p>${Utils.formatDate(dev.targetCloseDate)}</p></div>
        ${dev.investigation ? `<div class="mb-3"><label class="form-label"><strong>Investigation</strong></label><p>${dev.investigation}</p></div>` : ''}
        ${dev.riskAssessment ? `<div class="mb-3"><label class="form-label"><strong>Risk Assessment</strong></label><p>${dev.riskAssessment}</p></div>` : ''}
        <div class="mb-3"><label class="form-label"><strong>Workflow</strong></label><div class="workflow-steps">${dev.workflow.steps.map((step, i) => `<div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === dev.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}"><div class="step-circle">${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}</div><div class="step-label">${step.step}</div>${step.user ? `<small>${step.user}</small>` : ''}</div>`).join('')}</div></div>
        ${canApproveDeviation(dev) ? `<div class="mt-3"><button class="btn btn-success me-2" onclick="approveDeviation(${index})"><i class="bi bi-check-circle me-2"></i>Approve</button><button class="btn btn-warning me-2" onclick="assignInvestigator(${index})"><i class="bi bi-person-plus me-2"></i>Assign Investigator</button></div>` : ''}
        <div class="mt-4"><h6>Comments</h6><div id="deviationComments">${dev.comments.length > 0 ? dev.comments.map(c => `<div class="comment-item mb-2"><strong>${c.user}</strong> (${c.date})<br>${c.comment}</div>`).join('') : '<p>No comments yet</p>'}</div><div class="mt-3"><textarea class="form-control" id="newComment" rows="2" placeholder="Add a comment..."></textarea><button class="btn btn-primary mt-2" onclick="addDeviationComment(${index})">Add Comment</button></div></div>
    `;
    
    document.getElementById('viewDeviationContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewDeviationModal')).show();
}

function canApproveDeviation(dev) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    const currentStep = dev.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    const roleMap = { 'HOD': ['HOD'], 'QA Manager': ['QA Manager'], 'Plant Head': ['Plant Head'], 'Head QA': ['Head QA'] };
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveDeviation(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this Deviation?')) return;
    const data = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    const dev = data[index];
    const currentStepIndex = dev.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        dev.workflow.steps[currentStepIndex].status = 'Completed';
        dev.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        dev.workflow.steps[currentStepIndex].date = new Date().toISOString();
        if (currentStepIndex < dev.workflow.steps.length - 1) {
            dev.workflow.steps[currentStepIndex + 1].status = 'Pending';
            dev.status = 'Under Investigation';
        } else { dev.status = 'Closed'; }
    }
    dev.auditTrail.push({ action: 'Approved', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('deviation_data', JSON.stringify(data));
    Utils.showNotification('Deviation approved successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('viewDeviationModal')).hide();
    loadDeviationData();
}

function assignInvestigator(index) {
    const investigator = prompt('Enter investigator name:');
    if (!investigator) return;
    const data = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    const dev = data[index];
    const investigatorStep = dev.workflow.steps.find(s => s.step === 'Investigator');
    if (investigatorStep) {
        investigatorStep.status = 'Pending';
        investigatorStep.user = investigator;
    }
    dev.status = 'Under Investigation';
    localStorage.setItem('deviation_data', JSON.stringify(data));
    Utils.showNotification('Investigator assigned', 'success');
    viewDeviation(index);
}

function addDeviationComment(index) {
    const comment = document.getElementById('newComment').value.trim();
    if (!comment) return;
    const data = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    const dev = data[index];
    dev.comments.push({ user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, comment: comment, date: Utils.formatDate(new Date()) });
    localStorage.setItem('deviation_data', JSON.stringify(data));
    document.getElementById('newComment').value = '';
    viewDeviation(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchDeviation');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.addEventListener('input', filterDeviationTable);
    if (statusFilter) statusFilter.addEventListener('change', filterDeviationTable);
}

function filterDeviationTable() {
    const searchTerm = document.getElementById('searchDeviation').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    const filtered = data.filter(dev => {
        const matchesSearch = !searchTerm || dev.deviationNumber.toLowerCase().includes(searchTerm) || dev.description.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || dev.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const tbody = document.getElementById('deviationTableBody');
    if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>'; return; }
    tbody.innerHTML = filtered.map((dev, index) => {
        const originalIndex = data.indexOf(dev);
        return `<tr><td><strong>${dev.deviationNumber}</strong></td><td>${dev.description.substring(0, 50)}...</td><td>${dev.relatedTo}</td><td><span class="badge bg-${getStatusColor(dev.status)}">${dev.status}</span></td><td>${dev.initiator}</td><td>${Utils.formatDate(dev.createdDate)}</td><td><button class="btn btn-sm btn-primary" onclick="viewDeviation(${originalIndex})"><i class="bi bi-eye"></i></button></td></tr>`;
    }).join('');
}

function generateDeviationReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const department = document.getElementById('reportDepartment').value;
    let data = JSON.parse(localStorage.getItem('deviation_data') || '[]');
    if (fromDate) data = data.filter(dev => new Date(dev.createdDate) >= new Date(fromDate));
    if (toDate) data = data.filter(dev => new Date(dev.createdDate) <= new Date(toDate));
    if (department) data = data.filter(dev => dev.department === department);
    const reportContent = `<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Deviation Number</th><th>Description</th><th>Department</th><th>Status</th><th>Created Date</th></tr></thead><tbody>${data.map(dev => `<tr><td>${dev.deviationNumber}</td><td>${dev.description.substring(0, 50)}...</td><td>${dev.department}</td><td>${dev.status}</td><td>${Utils.formatDate(dev.createdDate)}</td></tr>`).join('')}</tbody></table></div><div class="mt-3"><button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(dev => ({ 'Deviation Number': dev.deviationNumber, 'Description': dev.description, 'Department': dev.department, 'Status': dev.status, 'Created Date': Utils.formatDate(dev.createdDate) })))}, 'deviation-report.csv')"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV</button></div>`;
    document.getElementById('reportContent').innerHTML = reportContent;
}

