import Express from 'express';
import * as apiService from '../app/admin_api.js';
import * as auth from '../app/services/auth.js';

const api = Express.Router();

// authenticate requests
api.use(auth.mustLoginAsAdminAPI); // TODO

// report data
api.get('/reports', apiService.reports);
api.get('/products', apiService.products);



// 404 response
api.use((req, res) => {
    res.send({ status: 'error', code: '404', message: 'Service you are looking is not available or being removed' });
});

export default api;