import express from 'express';
import * as admin from '../app/admin.js';
import * as auth from '../app/services/auth.js';

const adminApp = express.Router();


// dashboard routes
adminApp.get('/', auth.mustLoginAsAdmin, admin.dashboard);
// all users listing
adminApp.get('/user_management', auth.mustLoginAsAdmin, admin.users);
// disabled users listing
adminApp.get('/user_management/disabled_users', auth.mustLoginAsAdmin, admin.disabledUsers);
// edit user
adminApp.get('/user_management/edit_user/:UID', auth.mustLoginAsAdmin, admin.editUser);
// api for edit user data
adminApp.put('/user_management/edit_user/:UID', auth.mustLoginAsAdminAPI, admin.editUserAPI);
// all products
adminApp.get('/products', auth.mustLoginAsAdmin, admin.products_disp);
// add products
adminApp.get('/products/add_product', auth.mustLoginAsAdmin, admin.addProducts);
// api for add products
adminApp.post('/products/add_product', auth.mustLoginAsAdminAPI, admin.addProductsAPI);
// edit products
adminApp.get('/products/edit_product/:id', auth.mustLoginAsAdmin, admin.editProduct);
// api for edit products
adminApp.put('/products/edit_product/', auth.mustLoginAsAdminAPI, admin.editProductAPI);
// api for delete products
adminApp.delete('/products/delete_product/', auth.mustLoginAsAdminAPI, admin.deleteProductAPI);
// add category
adminApp.get('/products/add_category', auth.mustLoginAsAdmin, admin.addCategory);
// api for adding caegory
adminApp.post('/products/add_category', auth.mustLoginAsAdminAPI, admin.addCategoryAPI);
// all category listing
adminApp.get('/products/categorys', auth.mustLoginAsAdminAPI, admin.category);
// api for edit category
adminApp.put('/products/edit_category', auth.mustLoginAsAdminAPI, admin.editCategoryAPI);
// api for delete category
adminApp.delete('/products/delete_category', auth.mustLoginAsAdminAPI, admin.deleteCategoryAPI);

// 404 for admin
adminApp.use((req, res) => {
    res.render('admin/404', { layout: 'admin_layout', message: 'Page Not Found !' })
})

export default adminApp;