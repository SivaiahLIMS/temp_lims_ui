import api, { withBranch } from './client';

// ─── AUTH ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { username: string; password: string; branchId?: number }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: (branchId: number) => api.get('/dashboard/summary', withBranch(branchId)),
  getWidgets: (branchId: number) => api.get('/dashboard/widgets', withBranch(branchId)),
};

// ─── WORKSHEETS ──────────────────────────────────────────────────────────────
export const worksheetsApi = {
  list: (branchId: number) => api.get('/worksheets', withBranch(branchId)),
  search: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/worksheets/search', { ...withBranch(branchId), params }),
  byStatus: (branchId: number, status: string) =>
    api.get('/worksheets/by-status', { ...withBranch(branchId), params: { status } }),
  archived: (branchId: number) => api.get('/worksheets/archived', withBranch(branchId)),
  assignedTo: (userId: number, branchId: number) =>
    api.get(`/worksheets/assigned-to/${userId}`, withBranch(branchId)),
  getById: (id: number, branchId: number) => api.get(`/worksheets/${id}`, withBranch(branchId)),
  create: (data: unknown, branchId: number) =>
    api.post('/worksheets', data, withBranch(branchId)),
  update: (id: number, data: unknown, branchId: number) =>
    api.put(`/worksheets/${id}`, data, withBranch(branchId)),
  submit: (id: number, branchId: number) =>
    api.post(`/worksheets/${id}/submit`, {}, withBranch(branchId)),
  approve: (id: number, data: unknown, branchId: number) =>
    api.post(`/worksheets/${id}/approve`, data, withBranch(branchId)),
  reject: (id: number, data: unknown, branchId: number) =>
    api.post(`/worksheets/${id}/reject`, data, withBranch(branchId)),
  startReview: (id: number, branchId: number) =>
    api.post(`/worksheets/${id}/start-review`, {}, withBranch(branchId)),
  close: (id: number, data: unknown, branchId: number) =>
    api.post(`/worksheets/${id}/close`, data, withBranch(branchId)),
  archive: (id: number, branchId: number) =>
    api.post(`/worksheets/${id}/archive`, {}, withBranch(branchId)),
  unarchive: (id: number, branchId: number) =>
    api.post(`/worksheets/${id}/unarchive`, {}, withBranch(branchId)),
  assign: (id: number, data: unknown, branchId: number) =>
    api.post(`/worksheets/${id}/assign`, data, withBranch(branchId)),
  getTemplate: (id: number, branchId: number) =>
    api.get(`/worksheets/${id}/template`, withBranch(branchId)),
  getReviewHistory: (id: number, branchId: number) =>
    api.get(`/worksheets/${id}/review-history`, withBranch(branchId)),
  getExecutionData: (id: number, branchId: number) =>
    api.get(`/worksheets/${id}/execution-data`, withBranch(branchId)),
  saveFieldValue: (worksheetId: number, slotId: number, data: unknown, branchId: number) =>
    api.put(`/worksheets/${worksheetId}/fields/${slotId}`, data, withBranch(branchId)),
  replaceExecutionData: (id: number, data: unknown, branchId: number) =>
    api.put(`/worksheets/${id}/execution-data`, data, withBranch(branchId)),
  addExecutionData: (id: number, data: unknown, branchId: number) =>
    api.post(`/worksheets/${id}/execution-data`, data, withBranch(branchId)),
  reviewTestCaseResult: (id: number, tcId: number, data: unknown, branchId: number) =>
    api.post(`/worksheets/${id}/test-cases/${tcId}/review`, data, withBranch(branchId)),
  computeTestCaseResult: (id: number, tcId: number, branchId: number) =>
    api.post(`/worksheets/${id}/test-cases/${tcId}/compute`, {}, withBranch(branchId)),
  getValidationEvents: (id: number, branchId: number) =>
    api.get(`/worksheets/${id}/validation-events`, withBranch(branchId)),
  getFieldValidationRule: (id: number, slotId: number, branchId: number) =>
    api.get(`/worksheets/${id}/fields/${slotId}/validation-rule`, withBranch(branchId)),
  validateField: (id: number, slotId: number, data: unknown, branchId: number) =>
    api.post(`/worksheets/${id}/fields/${slotId}/validate`, data, withBranch(branchId)),
};

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documentsApi = {
  list: () => api.get('/documents'),
  getById: (id: number) => api.get(`/documents/${id}`),
  create: (data: unknown) => api.post('/documents', data),
  update: (id: number, data: unknown) => api.put(`/documents/${id}`, data),
  getVersions: (id: number) => api.get(`/documents/${id}/versions`),
  getVersion: (id: number, v: number) => api.get(`/documents/${id}/versions/${v}`),
  uploadDocx: (id: number, file: File, branchId: number) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/documents/${id}/versions`, form, {
      ...withBranch(branchId),
      headers: { ...withBranch(branchId).headers, 'Content-Type': 'multipart/form-data' },
    });
  },
  submitForReview: (id: number, v: number) =>
    api.post(`/documents/${id}/versions/${v}/submit-review`),
  approve: (id: number, v: number, data: unknown) =>
    api.post(`/documents/${id}/versions/${v}/approve`, data),
  reject: (id: number, v: number, data: unknown) =>
    api.post(`/documents/${id}/versions/${v}/reject`, data),
  publish: (id: number, v: number) => api.post(`/documents/${id}/versions/${v}/publish`),
  retire: (id: number, v: number) => api.post(`/documents/${id}/versions/${v}/retire`),
  getParsed: (id: number, v: number) => api.get(`/documents/${id}/versions/${v}/parsed`),
  getFields: (id: number, v: number) => api.get(`/documents/${id}/versions/${v}/fields`),
  underReview: () => api.get('/documents/lists/under-review'),
  approvedForTesting: () => api.get('/documents/lists/approved-for-testing'),
  assignedToMe: () => api.get('/documents/lists/assigned-to-me'),
  unassignedReviewQueue: () => api.get('/documents/lists/unassigned-review-queue'),
  // ── Document Field CRUD (GET /documents/{id}/fields) ──────────────────────
  // GET    /documents/{id}/fields                   → list all fields
  // POST   /documents/{id}/fields                   → create field
  // PUT    /documents/{id}/fields/{fieldId}         → update field
  // DELETE /documents/{id}/fields/{fieldId}/deactivate → audit-safe deactivate
  listFields: (documentId: number) =>
    api.get(`/documents/${documentId}/fields`),
  createField: (documentId: number, data: unknown) =>
    api.post(`/documents/${documentId}/fields`, data),
  updateField: (documentId: number, fieldId: string, data: unknown) =>
    api.put(`/documents/${documentId}/fields/${fieldId}`, data),
  deactivateField: (documentId: number, fieldId: string) =>
    api.patch(`/documents/${documentId}/fields/${fieldId}/deactivate`, {}),
};

// ─── DOCUMENT EXECUTIONS ─────────────────────────────────────────────────────
export const documentExecutionsApi = {
  create: (data: unknown) => api.post('/document-executions', data),
  getById: (id: number) => api.get(`/document-executions/${id}`),
  update: (id: number, data: unknown) => api.put(`/document-executions/${id}`, data),
  approve: (id: number, data: unknown) =>
    api.post(`/document-executions/${id}/approve`, data),
  reject: (id: number, data: unknown) =>
    api.post(`/document-executions/${id}/reject`, data),
  submit: (id: number) => api.post(`/document-executions/${id}/submit`),
  listAll: (branchId: number) => api.get('/document-executions', withBranch(branchId)),
  listPendingApproval: (branchId: number) =>
    api.get('/document-executions/pending-approval', withBranch(branchId)),
  listMyPending: () => api.get('/document-executions/my-pending'),
  listRejected: (branchId: number) =>
    api.get('/document-executions/rejected', withBranch(branchId)),
  getFieldValues: (id: number) => api.get(`/document-executions/${id}/field-values`),
  saveFieldValue: (id: number, fieldId: number, data: unknown) =>
    api.put(`/document-executions/${id}/field-values/${fieldId}`, data),
  getReviewHistory: (id: number) => api.get(`/document-executions/${id}/review-history`),
};

// ─── WORKSHEET TEMPLATES ──────────────────────────────────────────────────────
export const worksheetTemplatesApi = {
  list: () => api.get('/worksheet-templates'),
  getById: (id: number) => api.get(`/worksheet-templates/${id}`),
  getFieldRule: (templateId: number, fieldId: number) =>
    api.get(`/worksheet-templates/${templateId}/fields/${fieldId}/rule`),
  upsertFieldRule: (templateId: number, fieldId: number, data: unknown) =>
    api.put(`/worksheet-templates/${templateId}/fields/${fieldId}/rule`, data),
  deleteFieldRule: (templateId: number, fieldId: number) =>
    api.delete(`/worksheet-templates/${templateId}/fields/${fieldId}/rule`),
  listFieldRules: (templateId: number) =>
    api.get(`/worksheet-templates/${templateId}/field-rules`),
};

// ─── CHEMICALS ───────────────────────────────────────────────────────────────
export const chemicalsApi = {
  getMasters: () => api.get('/chemicals/masters'),
  createMaster: (data: unknown) => api.post('/chemicals/masters', data),
  getStock: (branchId: number) => api.get('/chemicals/stock', withBranch(branchId)),
  register: (data: unknown, branchId: number) =>
    api.post('/chemicals/registrations', data, withBranch(branchId)),
  issue: (registrationId: number, data: unknown, branchId: number) =>
    api.post(`/chemicals/${registrationId}/issue`, data, withBranch(branchId)),
  destroy: (registrationId: number, data: unknown) =>
    api.post(`/chemicals/${registrationId}/destroy`, data),
  expiryAlerts: (daysAhead = 30) =>
    api.get('/chemicals/expiry-alerts', { params: { daysAhead } }),
  search: (name: string, minVolume = 0) =>
    api.get('/chemicals/search', { params: { name, minVolume } }),
  availableStock: (branchId: number) =>
    api.get('/chemicals/lists/available-stock', withBranch(branchId)),
  getLabel: (registrationId: number) =>
    api.get(`/chemicals/registrations/${registrationId}/label`),
  batchLabels: (registrationIds: number[]) =>
    api.post('/chemicals/registrations/batch-labels', { registrationIds }),
  getQrCode: (registrationId: number) =>
    api.get(`/chemicals/registrations/${registrationId}/qr-code`),
  dueForDelivery: (daysAhead = 30) =>
    api.get('/chemicals/due-for-delivery', { params: { daysAhead } }),
  availableInBranch: (branchId: number) =>
    api.get('/chemicals/available-in-branch', withBranch(branchId)),
  expiringInBranch: (branchId: number, daysAhead = 30) =>
    api.get('/chemicals/expiring-in-branch', { ...withBranch(branchId), params: { daysAhead } }),
};

// ─── INSTRUMENTS ─────────────────────────────────────────────────────────────
export const instrumentsApi = {
  list: (branchId: number) => api.get('/instruments', withBranch(branchId)),
  create: (data: unknown) => api.post('/instruments', data),
  active: (branchId: number) => api.get('/instruments/lists/active', withBranch(branchId)),
  overdueCalibration: (branchId: number) =>
    api.get('/instruments/lists/overdue-calibration', withBranch(branchId)),
  readyForCalibration: (branchId: number) =>
    api.get('/instruments/lists/ready-for-calibration', withBranch(branchId)),
  pendingCalibrationApproval: (branchId: number) =>
    api.get('/instruments/lists/pending-calibration-approval', withBranch(branchId)),
  createCalibration: (instrumentId: number, data: unknown, branchId: number) =>
    api.post(`/instruments/${instrumentId}/calibrations`, data, withBranch(branchId)),
  createReservation: (instrumentId: number, data: unknown, branchId: number) =>
    api.post(`/instruments/${instrumentId}/reservations`, data, withBranch(branchId)),
  logDowntime: (instrumentId: number, data: unknown) =>
    api.post(`/instruments/${instrumentId}/downtime`, data),
  getReservations: (instrumentId: number, branchId: number) =>
    api.get(`/instruments/${instrumentId}/reservations`, withBranch(branchId)),
  getLimits: (instrumentId: number) =>
    api.get(`/instruments/${instrumentId}/limits`),
  createLimitSet: (instrumentId: number, data: unknown) =>
    api.post(`/instruments/${instrumentId}/limits`, data),
  approveReservation: (instrumentId: number, reservationId: number, data: unknown, branchId: number) =>
    api.post(`/instruments/${instrumentId}/reservations/${reservationId}/approve`, data, withBranch(branchId)),
  reviewCalibration: (instrumentId: number, calibrationId: number, data: unknown, branchId: number) =>
    api.post(`/instruments/${instrumentId}/calibrations/${calibrationId}/review`, data, withBranch(branchId)),
  addCalibrationResult: (instrumentId: number, calibrationId: number, data: unknown, branchId: number) =>
    api.post(`/instruments/${instrumentId}/calibrations/${calibrationId}/results`, data, withBranch(branchId)),
  approveCalibration: (instrumentId: number, calibrationId: number, data: unknown, branchId: number) =>
    api.post(`/instruments/${instrumentId}/calibrations/${calibrationId}/approve`, data, withBranch(branchId)),
  getCalibrationLifecycle: (instrumentId: number, calibrationId: number) =>
    api.get(`/instruments/${instrumentId}/calibrations/${calibrationId}/lifecycle`),
  listDueForDelivery: (daysAhead = 30) =>
    api.get('/instruments/due-for-delivery', { params: { daysAhead } }),
};

// ─── CALIBRATIONS ────────────────────────────────────────────────────────────
export const calibrationsApi = {
  list: (branchId: number, status?: string) =>
    api.get('/calibrations', { ...withBranch(branchId), params: { status } }),
  getById: (id: number) => api.get(`/calibrations/${id}`),
  create: (data: unknown, branchId: number) =>
    api.post('/calibrations', data, withBranch(branchId)),
  complete: (id: number, data: unknown, branchId: number) =>
    api.post(`/calibrations/${id}/complete`, data, withBranch(branchId)),
};

// ─── SAMPLES ─────────────────────────────────────────────────────────────────
export const samplesApi = {
  list: (branchId: number) => api.get('/samples', withBranch(branchId)),
  register: (data: unknown) => api.post('/samples', data),
  assignTest: (sampleId: number, data: unknown) =>
    api.post(`/samples/${sampleId}/tests`, data),
  enterResult: (sampleTestId: number, data: unknown) =>
    api.post(`/samples/tests/${sampleTestId}/results`, data),
  reviewResult: (resultId: number) => api.post(`/samples/results/${resultId}/review`),
  generateCoa: (sampleId: number, branchId: number) =>
    api.post(`/samples/${sampleId}/coa/generate`, {}, withBranch(branchId)),
  approveCoa: (coaId: number) => api.post(`/samples/coa/${coaId}/approve`),
};

// ─── QA/QC ───────────────────────────────────────────────────────────────────
export const qaApi = {
  getDeviations: (branchId: number) => api.get('/qa/deviations', withBranch(branchId)),
  createDeviation: (data: unknown) => api.post('/qa/deviations', data),
  closeDeviation: (id: number, data: unknown) => api.post(`/qa/deviations/${id}/close`, data),
  getOos: (branchId: number) => api.get('/qa/oos', withBranch(branchId)),
  createOos: (data: unknown) => api.post('/qa/oos', data),
  getCapa: () => api.get('/qa/capa'),
  createCapa: (data: unknown) => api.post('/qa/capa', data),
  closeCapa: (id: number, data: unknown) => api.post(`/qa/capa/${id}/close`, data),
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
export const storageApi = {
  getLocations: (branchId: number) => api.get('/storage/locations', withBranch(branchId)),
  createLocation: (data: unknown, branchId: number) =>
    api.post('/storage/locations', data, withBranch(branchId)),
  updateLocation: (id: number, data: unknown) =>
    api.put(`/storage/locations/${id}`, data),
  getViolations: (branchId: number, openOnly = false) =>
    api.get('/storage/violations', { ...withBranch(branchId), params: { openOnly } }),
  placeContainer: (containerId: number, data: unknown) =>
    api.post(`/storage/containers/${containerId}/place`, data),
  moveContainer: (containerId: number, data: unknown) =>
    api.post(`/storage/containers/${containerId}/move`, data),
  getContainerHistory: (containerId: number) =>
    api.get(`/storage/containers/${containerId}/history`),
  getLocation: (locationId: number) =>
    api.get(`/storage/locations/${locationId}`),
  createViolation: (data: unknown, branchId: number) =>
    api.post('/storage/violations', data, withBranch(branchId)),
  resolveViolation: (violationId: number, data: unknown) =>
    api.post(`/storage/violations/${violationId}/resolve`, data),
};

// ─── CONTAINERS ──────────────────────────────────────────────────────────────
export const containersApi = {
  list: (branchId: number, status?: string) =>
    api.get('/containers', { ...withBranch(branchId), params: { status } }),
  create: (data: unknown, branchId: number) =>
    api.post('/containers', data, withBranch(branchId)),
  getById: (id: number) => api.get(`/containers/${id}`),
  reserve: (data: unknown, branchId: number) =>
    api.post('/containers/reservations', data, withBranch(branchId)),
  fefoSelect: (chemicalId: number, branchId: number) =>
    api.get('/containers/reservations/fefo-select', {
      ...withBranch(branchId),
      params: { chemicalId },
    }),
  convertReservation: (reservationId: number, data: unknown, branchId: number) =>
    api.post(`/containers/reservations/${reservationId}/convert`, data, withBranch(branchId)),
};

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export const employeesApi = {
  list: (branchId: number) => api.get('/employees', withBranch(branchId)),
  listActive: (branchId: number) => api.get('/employees/active', withBranch(branchId)),
  getById: (id: number, branchId: number) => api.get(`/employees/${id}`, withBranch(branchId)),
  create: (data: unknown, branchId: number) =>
    api.post('/employees', data, withBranch(branchId)),
  update: (id: number, data: unknown, branchId: number) =>
    api.put(`/employees/${id}`, data, withBranch(branchId)),
  deactivate: (id: number, branchId: number) =>
    api.post(`/employees/${id}/deactivate`, {}, withBranch(branchId)),
  activate: (id: number, branchId: number) =>
    api.post(`/employees/${id}/activate`, {}, withBranch(branchId)),
  getHierarchy: (id: number, branchId: number) =>
    api.get(`/employees/${id}/hierarchy`, withBranch(branchId)),
  getAudit: (id: number, branchId: number) =>
    api.get(`/employees/${id}/audit`, withBranch(branchId)),
  assignReviewer: (id: number, data: unknown, branchId: number) =>
    api.post(`/employees/${id}/assign-reviewer`, data, withBranch(branchId)),
  assignManager: (id: number, data: unknown, branchId: number) =>
    api.post(`/employees/${id}/assign-manager`, data, withBranch(branchId)),
  removeManager: (id: number, branchId: number) =>
    api.delete(`/employees/${id}/manager`, withBranch(branchId)),
  getDirectReports: (id: number, branchId: number) =>
    api.get(`/employees/${id}/direct-reports`, withBranch(branchId)),
  getEligibleForAssignment: (branchId: number) =>
    api.get('/employees/eligible-for-assignment', withBranch(branchId)),
};

// ─── TRAINING ────────────────────────────────────────────────────────────────
export const trainingApi = {
  getMaterials: (branchId: number) => api.get('/training/material', withBranch(branchId)),
  createMaterial: (data: unknown, branchId: number) =>
    api.post('/training/material', data, withBranch(branchId)),
  getMaterial: (id: number) => api.get(`/training/material/${id}`),
  assign: (data: unknown, branchId: number) =>
    api.post('/training/assign', data, withBranch(branchId)),
  getUserTraining: (userId: number) => api.get(`/training/user/${userId}`),
  complete: (id: number, data: unknown) =>
    api.post(`/training/records/${id}/complete`, data),
  approve: (id: number, data: unknown) =>
    api.post(`/training/records/${id}/approve`, data),
  updateMaterial: (id: number, data: unknown, branchId: number) =>
    api.put(`/training/material/${id}`, data, withBranch(branchId)),
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (branchId: number, params?: Record<string, unknown>) =>
    api.get('/products', { ...withBranch(branchId), params }),
  getById: (id: number, branchId: number) => api.get(`/products/${id}`, withBranch(branchId)),
  create: (data: unknown, branchId: number) =>
    api.post('/products', data, withBranch(branchId)),
  update: (id: number, data: unknown, branchId: number) =>
    api.put(`/products/${id}`, data, withBranch(branchId)),
  submit: (id: number, branchId: number) =>
    api.post(`/products/${id}/submit`, {}, withBranch(branchId)),
  approve: (id: number, data: unknown, branchId: number) =>
    api.post(`/products/${id}/approve`, data, withBranch(branchId)),
  reject: (id: number, data: unknown, branchId: number) =>
    api.post(`/products/${id}/reject`, data, withBranch(branchId)),
  getSpec: (id: number, branchId: number) =>
    api.get(`/products/${id}/specification`, withBranch(branchId)),
  upsertSpec: (id: number, data: unknown, branchId: number) =>
    api.put(`/products/${id}/specification`, data, withBranch(branchId)),
  getComposition: (id: number, branchId: number) =>
    api.get(`/products/${id}/composition`, withBranch(branchId)),
  addIngredient: (id: number, data: unknown, branchId: number) =>
    api.post(`/products/${id}/composition`, data, withBranch(branchId)),
  getAttachments: (id: number, branchId: number) =>
    api.get(`/products/${id}/attachments`, withBranch(branchId)),
  addAttachment: (id: number, data: unknown, branchId: number) =>
    api.post(`/products/${id}/attachments`, data, withBranch(branchId)),
  removeIngredient: (productId: number, ingredientId: number, branchId: number) =>
    api.delete(`/products/${productId}/composition/${ingredientId}`, withBranch(branchId)),
  deleteAttachment: (productId: number, attachmentId: number, branchId: number) =>
    api.delete(`/products/${productId}/attachments/${attachmentId}`, withBranch(branchId)),
  getWorkflowHistory: (id: number, branchId: number) =>
    api.get(`/products/${id}/workflow-history`, withBranch(branchId)),
  getAuditTrail: (id: number, branchId: number) =>
    api.get(`/products/${id}/audit-trail`, withBranch(branchId)),
};

// ─── ORDER REQUESTS ──────────────────────────────────────────────────────────
export const orderRequestsApi = {
  list: (branchId: number, status?: string) =>
    api.get('/order-requests', { ...withBranch(branchId), params: { status } }),
  getById: (id: number) => api.get(`/order-requests/${id}`),
  create: (data: unknown, branchId: number) =>
    api.post('/order-requests', data, withBranch(branchId)),
  submit: (id: number) => api.post(`/order-requests/${id}/submit`),
  approve: (id: number, data: unknown) =>
    api.post(`/order-requests/${id}/approve`, data),
  reject: (id: number, data: unknown) =>
    api.post(`/order-requests/${id}/reject`, data),
  placeOrder: (id: number, data: unknown) =>
    api.post(`/order-requests/${id}/place-order`, data),
  receive: (id: number, data: unknown) =>
    api.post(`/order-requests/${id}/receive`, data),
  close: (id: number, data: unknown) =>
    api.post(`/order-requests/${id}/close`, data),
  dueForDelivery: (daysAhead = 30) =>
    api.get('/order-requests/due-for-delivery', { params: { daysAhead } }),
  getHistory: (id: number) => api.get(`/order-requests/${id}/history`),
};

// ─── SUPPLIERS ───────────────────────────────────────────────────────────────
export const suppliersApi = {
  list: () => api.get('/suppliers'),
  create: (data: unknown) => api.post('/suppliers', data),
  getDocuments: (supplierId: number) =>
    api.get(`/suppliers/${supplierId}/documents`),
  uploadDocument: (supplierId: number, data: unknown) =>
    api.post(`/suppliers/${supplierId}/documents`, data),
  rateSupplier: (supplierId: number, data: unknown) =>
    api.post(`/suppliers/${supplierId}/rating`, data),
};

// ─── OMS ─────────────────────────────────────────────────────────────────────
export const omsApi = {
  getOrders: (branchId: number) => api.get('/oms/orders', withBranch(branchId)),
  createOrder: (data: unknown) => api.post('/oms/orders', data),
  approveOrder: (poId: number) => api.post(`/oms/orders/${poId}/approve`),
  getGrns: (branchId: number) => api.get('/oms/grn', withBranch(branchId)),
  createGrn: (data: unknown) => api.post('/oms/grn', data),
};

// ─── OOS/OOT ─────────────────────────────────────────────────────────────────
export const oosApi = {
  list: (branchId: number) => api.get('/oos', withBranch(branchId)),
  byWorksheet: (worksheetId: number) => api.get(`/oos/worksheet/${worksheetId}`),
  investigate: (testResultId: number, data: unknown, branchId: number) =>
    api.post(`/oos/${testResultId}/investigate`, data, withBranch(branchId)),
  approveTask: (taskId: number, data: unknown, branchId: number) =>
    api.post(`/oos/tasks/${taskId}/approve`, data, withBranch(branchId)),
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getPredictiveAlerts: (branchId: number, openOnly = false) =>
    api.get('/analytics/predictive-alerts', { ...withBranch(branchId), params: { openOnly } }),
  acknowledgeAlert: (id: number) =>
    api.post(`/analytics/predictive-alerts/${id}/acknowledge`),
  getTaskMetrics: (branchId: number) =>
    api.get('/analytics/tasks/metrics', withBranch(branchId)),
  getOosTrend: (id: number, branchId: number, from?: string, to?: string) =>
    api.get(`/analytics/products/${id}/oos-trend`, {
      ...withBranch(branchId),
      params: { from, to },
    }),
  getInstrumentUtilization: (id: number, from?: string, to?: string) =>
    api.get(`/analytics/instruments/${id}/utilization`, { params: { from, to } }),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiApi = {
  getWorkload: (branchId: number) => api.get('/ai/workload', withBranch(branchId)),
  getOosRisk: (branchId: number) => api.get('/ai/oos-risk', withBranch(branchId)),
  getInventoryForecast: (branchId: number) =>
    api.get('/ai/inventory-forecast', withBranch(branchId)),
  getInstrumentTrend: (instrumentId: number) =>
    api.get('/ai/instrument-trend', { params: { instrumentId } }),
  autoInitiateForecast: (data: unknown) => api.post('/ai/orders/auto-initiate', data),
};

// ─── ELN ─────────────────────────────────────────────────────────────────────
export const elnApi = {
  list: (branchId: number, worksheetId?: number) =>
    api.get('/eln', { ...withBranch(branchId), params: { worksheetId } }),
  create: (data: unknown, branchId: number) =>
    api.post('/eln', data, withBranch(branchId)),
  getById: (id: number) => api.get(`/eln/${id}`),
  update: (id: number, data: unknown) => api.put(`/eln/${id}`, data),
  delete: (id: number) => api.delete(`/eln/${id}`),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (userId?: number) => api.get('/notifications', { params: { userId } }),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  getEmailLog: (branchId: number) => api.get('/notifications/emails', withBranch(branchId)),
  getSettings: () => api.get('/notifications/settings'),
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getById: (id: number) => api.get(`/users/${id}`),
  list: () => api.get('/users'),
  create: (data: unknown) => api.post('/users', data),
  update: (id: number, data: unknown) => api.put(`/users/${id}`, data),
  assignRole: (userId: number, data: unknown) =>
    api.post(`/users/${userId}/roles`, data),
  removeRole: (userId: number, roleId: number) =>
    api.delete(`/users/${userId}/roles/${roleId}`),
  lockUser: (userId: number) => api.post(`/users/${userId}/lock`),
  unlockUser: (userId: number) => api.post(`/users/${userId}/unlock`),
  resetPassword: (userId: number, data: unknown) =>
    api.post(`/users/${userId}/reset-password`, data),
  getWorkload: (userId: number) => api.get(`/users/${userId}/workload`),
  getByTenant: (tenantId: number) => api.get(`/users/tenant/${tenantId}`),
  getFullReport: () => api.get('/users/reports/full'),
  getReportByRole: () => api.get('/users/reports/by-role'),
  getReportByRoleId: (roleId: number) => api.get(`/users/reports/by-role/${roleId}`),
  getReportByPermission: (permission: string) =>
    api.get('/users/reports/by-permission', { params: { permission } }),
  getUserSkills: (userId: number) => api.get(`/users/${userId}/skills`),
  addUserSkill: (userId: number, data: unknown) =>
    api.post(`/users/${userId}/skills`, data),
};

// ─── ROLES ───────────────────────────────────────────────────────────────────
export const rolesApi = {
  list: () => api.get('/roles'),
  getById: (id: number) => api.get(`/roles/${id}`),
  create: (data: { code: string; name: string; description: string }) =>
    api.post('/roles', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/roles/${id}`, data),
  // PATCH /roles/{id}/deactivate  — sets active=false / status='INACTIVE', never deletes (audit trail)
  deactivate: (id: number) => api.patch(`/roles/${id}/deactivate`, {}),
  // GET  /roles/{id}/permissions  → returns list of permissions for a role
  getPermissions: (id: number) => api.get(`/roles/${id}/permissions`),
  // PUT  /roles/{id}/permissions  → replace the full permission set
  // Body: { permissionCodes: string[] }
  setPermissions: (id: number, permissionCodes: string[]) =>
    api.put(`/roles/${id}/permissions`, { permissionCodes }),
  // POST /roles/{id}/permissions  → add a single permission
  // Body: { permissionCode: string }
  addPermission: (id: number, permissionCode: string) =>
    api.post(`/roles/${id}/permissions`, { permissionCode }),
  // DELETE /roles/{id}/permissions/{permissionCode}
  removePermission: (id: number, permissionCode: string) =>
    api.delete(`/roles/${id}/permissions/${permissionCode}`),
};

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────
export const permissionsApi = {
  // GET /permissions → returns all permissions (fixed catalog)
  // Expected response: [{ id, code, description, module }]
  list: () => api.get('/permissions'),
  getById: (id: number) => api.get(`/permissions/${id}`),
};

// ─── AUDIT ───────────────────────────────────────────────────────────────────
export const auditApi = {
  getAll: () => api.get('/audit'),
  getForEntity: (entityType: string, entityId: number) =>
    api.get(`/audit/${entityType}/${entityId}`),
};

// ─── TENANTS & BRANCHES ───────────────────────────────────────────────────────
export const tenantsApi = {
  list: () => api.get('/tenants'),
  create: (data: unknown) => api.post('/tenants', data),
  getBranches: (tenantId: number) => api.get(`/tenants/${tenantId}/branches`),
  createBranch: (tenantId: number, data: unknown) =>
    api.post(`/tenants/${tenantId}/branches`, data),
};

// ─── BARCODE ─────────────────────────────────────────────────────────────────
export const barcodeApi = {
  scanAny: (barcodeValue: string, branchId: number) =>
    api.post('/barcode/scan', { barcodeValue }, withBranch(branchId)),
  scanContainer: (barcodeValue: string) =>
    api.post('/barcode/scan/container', { barcodeValue }),
  scanInstrument: (barcodeValue: string) =>
    api.post('/barcode/scan/instrument', { barcodeValue }),
  scanLocation: (barcodeValue: string, branchId: number) =>
    api.post('/barcode/scan/location', { barcodeValue }, withBranch(branchId)),
};

// ─── TASKS ───────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (branchId: number, status?: string) =>
    api.get('/tasks', { ...withBranch(branchId), params: { status } }),
  getMy: () => api.get('/tasks/my'),
  getById: (id: number) => api.get(`/tasks/${id}`),
  create: (data: unknown, branchId: number) =>
    api.post('/tasks', data, withBranch(branchId)),
  start: (id: number, data: unknown) => api.post(`/tasks/${id}/start`, data),
  complete: (id: number, data: unknown) => api.post(`/tasks/${id}/complete`, data),
  accept: (id: number, data: unknown) => api.post(`/tasks/${id}/accept`, data),
  approve: (id: number, data: unknown) => api.post(`/tasks/${id}/approve`, data),
  reject: (id: number, data: unknown) => api.post(`/tasks/${id}/reject`, data),
  getHistory: (id: number) => api.get(`/tasks/${id}/history`),
};
