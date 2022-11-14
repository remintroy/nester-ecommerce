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

// apis - api for user sign in 
app.post('/user_signin', auth.mustLogoutAsUserAPI, users.loginAPI);
// api for signin with google
app.post('/user_signin_google', auth.mustLogoutAsUserAPI, users.loginWithGoogleAPI);
// api for signin with phone
app.post('/user_signin_phone', auth.mustLogoutAsUserAPI, users.loginWithOtpAPI);
// api for user logout
app.post('/user_logout', auth.mustLoginAsUserAPI, users.logoutAPI);
// api for user registration
app.post('/user_registration', auth.mustLogoutAsUserAPI, users.signupAPI);
// api for add to cart
app.post('/cart_action', auth.mustLoginAsUserAPI, users.addTOCartAPI);
// api for add to_car importance is to update
app.put('/cart_action', auth.mustLoginAsUserAPI, users.addTOCartAPI);
// api for add to cart
app.delete('/cart_action', auth.mustLoginAsUserAPI, users.deleteFormCartAPI);
// api for addign user address
app.post('/user_address', auth.mustLoginAsUserAPI, users.addUserAddressAPI);
// api for updating user address
app.put('/user_address', auth.mustLoginAsUserAPI, users.updateUserAddressAPI);
// api for delete user address
app.delete('/user_address', auth.mustLoginAsUserAPI, users.deleteUserAddressAPI);
// api place order
app.post('/checkout', auth.mustLoginAsUserAPI, users.checkoutCartProductsAPI);
// api veryfy payment
app.post('/checkout/verify', auth.mustLoginAsUserAPI, users.checkOutVerifyRazorpayAPI);
// api to get address by addressID
app.post('/checkout/address', auth.mustLoginAsUserAPI, users.getAddressByAddressID);
// api for cancel order
app.post('/orders/cancel/', auth.mustLoginAsUserAPI, users.cancelOrderAPI);

// sub - dev api's
// api for get all products form cart
app.post('/cart_all', auth.mustLoginAsUserAPI, users.getAllProductsFormCartAPI);

// usersign in page
app.get('/user_signin', auth.mustLogoutAsUser, users.login);
// usersign with phone in page
app.get('/user_signin_phone', auth.mustLogoutAsUser, users.loginWithOtp);
// create user page
app.get('/user_registration', auth.mustLogoutAsUser, users.signup);

app.use(users.localsForUser);

/// home page
app.get(['/', '/index.html'], users.home);
// shop page
app.get(['/shop', '/shop.html'], users.shop);
// products page
app.get(['/product/:id', '/product.html/:id'], users.product);

// user auth must routes
app.get(['/cart', '/cart.html'], auth.mustLoginAsUser, users.cart);
// wishlist page
app.get(['/wishlist', '/wishlist.html'], auth.mustLoginAsUser, users.wishlist);
// dashboard page
app.get(['/dashboard', '/dashboard.html'], auth.mustLoginAsUser, users.dashboard);
// ordres page
app.get('/dashboard/orders', auth.mustLoginAsUser, users.ordersPg);
// address page
app.get('/dashboard/address', auth.mustLoginAsUser, users.addressPg);
// account page 
app.get('/dashboard/account', auth.mustLoginAsUser, users.accountPg);
// checkout page
app.get(['/checkout', '/checkout.html'], auth.mustLoginAsUser, users.checkout);

export default app;