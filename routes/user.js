import express from 'express';
import * as users from '../app/users.js';
import * as auth from '../app/services/auth.js';
import * as admin from '../app/admin.js';

const app = express.Router();

// admin auth routes
app.get('/admin_login', auth.mustLogoutAsAdmin, admin.login);
// api for admin login 
app.post('/admin_login', auth.mustLogoutAsAdminAPI, admin.loginApi);
// api for admin logout
app.post('/admin_logout', auth.mustLoginAsAdminAPI, auth.adminLogout);

// user auth must routes
app.get(['/cart', '/cart.html'], auth.mustLoginAsUser, users.cart);
// wishlist page
app.get(['/wishlist', '/wishlist.html'], auth.mustLoginAsUser, users.wishlist);
// dashboard page
app.get(['/dashboard', '/dashboard.html'], auth.mustLoginAsUser, users.dashboard);
// checkout page
app.get(['/checkout', '/checkout.html'], auth.mustLoginAsUser, users.checkout);
// usersign in page
app.get('/user_signin', auth.mustLogoutAsUser, users.login);
// usersign with phone in page
app.get('/user_signin_phone', auth.mustLogoutAsUser, users.loginWithOtp);
// create user page
app.get('/user_registration', auth.mustLogoutAsUser, users.signup);

// apis - api for user sign in 
app.post('/user_signin', auth.mustLogoutAsUserAPI, users.loginAPI);
// api for signin with google
app.post('/user_signin_google', auth.mustLogoutAsUserAPI, users.loginWithGoogleAPI);
// api for signin with phone
app.post('/user_signin_phone', auth.mustLogoutAsUserAPI, users.loginWithOtpAPI);
// api for user logout
app.post('/user_logout', auth.mustLoginAsUserAPI, users.logoutAPI);
// api for user registration
app.post('/user_registration', auth.mustLogoutAsUser, users.signupAPI);
// api for add to cart
app.post('/add_to_cart', auth.mustLoginAsUserAPI, users.addTOCartAPI);

// user public routes
app.get(['/', '/index.html'], users.home);
// shop page
app.get(['/shop', '/shop.html'], users.shop);
// products page
app.get(['/product/:id', '/product.html/:id'], users.product);


export default app;