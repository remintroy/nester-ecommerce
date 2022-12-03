import express from 'express';
import * as api_service from '../controller/user_api.js';

// initailizes app 
const api = express.Router();


// search API 
api.get('/search', api_service.searchAPI);


// exports api
export default api;
