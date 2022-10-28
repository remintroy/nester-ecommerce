import express from 'express';
import * as admin from '../app/admin.js';
import * as auth from '../app/services/auth.js';

const adminApp = express.Router();

// login routes
adminApp.get("/login", auth.mustLogoutAsAdmin, admin.login);
adminApp.post('/login', auth.mustLogoutAsAdminAPI, admin.loginApi);

// dashboard routes
adminApp.get(["/","/dashboard"], auth.mustLoginAsAdmin, admin.dashboard);



export default adminApp;