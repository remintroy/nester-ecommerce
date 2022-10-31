import express from 'express';
import * as admin from '../app/admin.js';
import * as auth from '../app/services/auth.js';

const adminApp = express.Router();


// dashboard routes
adminApp.get('/', auth.mustLoginAsAdmin, admin.dashboard);

adminApp.get('/user_management',auth.mustLoginAsAdmin, admin.users);

adminApp.use((req, res) => {
    res.render('admin/404', { layout:'admin_layout', message: 'Page Not Found !' })
})

export default adminApp;