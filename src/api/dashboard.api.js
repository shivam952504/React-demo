import axios from 'axios';

export const fetchDashboard = (geo) =>
  axios.get('/api/dashboard', { params: { geo } });