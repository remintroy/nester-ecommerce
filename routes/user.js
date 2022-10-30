import express from 'express';
import * as users from '../app/users.js';
import * as auth from '../app/services/auth.js';

import * as admin from '../app/admin.js';


const app = express.Router();


app.get('/admin_login',auth.mustLogoutAsAdmin, admin.login);

app.post('/admin_login', auth.mustLogoutAsAdminAPI, admin.loginApi);

app.post('/admin_logout',auth.mustLoginAsAdminAPI, auth.adminLogout);


app.get(['/','/index.html'],users.home);

app.get(['/shop','/shop.html'],users.shop);

app.get(['/product','/product.html'],users.product);

app.get(['/cart','/cart.html'],users.cart);

app.get(['/wishlist','/wishlist.html'],users.wishlist);

app.get(['/dashboard','/dashboard.html'],users.dashboard);

app.get('/login', users.login);

app.post('/login', async (req, res) => {
    try {

        auth.signInWithGoogle(req.body);

    } catch (error) {
        res.send({ status: 'error', message: message });

    }
    res.send({ status: 'good', message: "got data" });
});

export default app;