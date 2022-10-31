import express from 'express';
import * as users from '../app/users.js';
import * as auth from '../app/services/auth.js';
import * as admin from '../app/admin.js';

const app = express.Router();

// admin auth routes
app.get('/admin_login', auth.mustLogoutAsAdmin, admin.login);

app.post('/admin_login', auth.mustLogoutAsAdminAPI, admin.loginApi);

app.post('/admin_logout', auth.mustLoginAsAdminAPI, auth.adminLogout);

// user auth must routes
app.get(['/cart', '/cart.html'], auth.mustLoginAsUser, users.cart);

app.get(['/wishlist', '/wishlist.html'], auth.mustLoginAsUser, users.wishlist);

app.get(['/dashboard', '/dashboard.html'], auth.mustLoginAsUser, users.dashboard);

app.get(['/checkout', '/checkout.html'], auth.mustLoginAsUser, users.checkout);

app.get('/user_signin', auth.mustLogoutAsUser, users.login);

app.post('/user_signin', auth.mustLogoutAsUserAPI, users.loginAPI);

app.post('/user_signin_google', auth.mustLogoutAsUserAPI, users.loginWithGoogleAPI);

app.post('/user_logout', auth.mustLoginAsUserAPI, users.logoutAPI);

app.get('/user_registration', auth.mustLogoutAsUser, users.signup);

app.post('/user_registration', auth.mustLogoutAsUser, users.signupAPI);

// user public routes
app.get(['/', '/index.html'], users.home);

app.get(['/shop', '/shop.html'], users.shop);

app.get(['/product', '/product.html'], users.product);


export default app;