import client from './client';

// ---- Auth ----
export const login = (userCode, password) =>
  client.post('/auth/login', { userCode, password }).then((r) => r.data);

// ---- Locations ----
export const getLocations = (search) =>
  client.get('/locations', { params: { search } }).then((r) => r.data);
export const createLocation = (data) => client.post('/locations', data).then((r) => r.data);
export const updateLocation = (id, data) => client.put(`/locations/${id}`, data).then((r) => r.data);
export const deleteLocation = (id) => client.delete(`/locations/${id}`);

// ---- Companies ----
export const getCompanies = (search) =>
  client.get('/companies', { params: { search } }).then((r) => r.data);
export const createCompany = (data) => client.post('/companies', data).then((r) => r.data);
export const updateCompany = (id, data) => client.put(`/companies/${id}`, data).then((r) => r.data);
export const deleteCompany = (id) => client.delete(`/companies/${id}`);

// ---- Job Titles ----
export const getJobTitles = (search) =>
  client.get('/job-titles', { params: { search } }).then((r) => r.data);
export const createJobTitle = (data) => client.post('/job-titles', data).then((r) => r.data);
export const updateJobTitle = (id, data) => client.put(`/job-titles/${id}`, data).then((r) => r.data);
export const deleteJobTitle = (id) => client.delete(`/job-titles/${id}`);

// ---- Pre Job Sheets ----
export const getPreJobSheets = (locationId, search) =>
  client.get('/pre-job-sheets', { params: { locationId, search } }).then((r) => r.data);
export const getPreJobSheet = (id) => client.get(`/pre-job-sheets/${id}`).then((r) => r.data);
export const createPreJobSheet = (data) => client.post('/pre-job-sheets', data).then((r) => r.data);
export const updatePreJobSheet = (id, data) => client.put(`/pre-job-sheets/${id}`, data).then((r) => r.data);
export const deletePreJobSheet = (id) => client.delete(`/pre-job-sheets/${id}`);
export const generateJobSheet = (id) => client.post(`/pre-job-sheets/${id}/generate`).then((r) => r.data);

// ---- Job Sheets ----
export const getJobSheets = (locationId, search) =>
  client.get('/job-sheets', { params: { locationId, search } }).then((r) => r.data);
export const getJobSheet = (id) => client.get(`/job-sheets/${id}`).then((r) => r.data);
export const updateJobSheet = (id, data) => client.put(`/job-sheets/${id}`, data).then((r) => r.data);
export const deleteJobSheet = (id) => client.delete(`/job-sheets/${id}`);
export const uploadJobSheetPhoto = (jobSheetId, itemId, file) => {
  const form = new FormData();
  form.append('file', file);
  return client
    .post(`/job-sheets/${jobSheetId}/items/${itemId}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((r) => r.data);
};

// ---- Dashboard ----
export const getDashboardStats = (locationId) =>
  client.get('/dashboard', { params: { locationId } }).then((r) => r.data);

// ---- Reports ----
export const downloadReport = () =>
  client.get('/reports/export', { responseType: 'blob' }).then((r) => r.data);
