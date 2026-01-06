import axios from 'axios';

export const fetchInvestments = (geo, search = '') =>
  axios.get('/api/investments', { params: { geo, search } });