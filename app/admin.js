import * as auth from './services/auth.js';
import { randomId } from './services/util.js';
import * as db from './services/schema.js';

const layout = `admin_layout`

export const dashboard = async (req, res, next) => {
    try {

        const data = {
            layout:layout
        };

        data.title = `Admin-panel`;
        data.user = req.admin
        data.currentPage = 'dashboard';

        res.render('admin/dashboard', data);

    } catch (error) {
        console.error(error);
    };
};

export const users = (req, res, next) => {
    res.render('admin/users',{
        layout:layout
    });
};

export const login = (req, res, next) => {
    res.render('admin/login', {
        layout: 'admin_auth_layout'
    });
};

export const loginApi = async (req, res) => {
    try {
        let userData = await auth.adminLogin(req.body);

        req.session.loggedIn = true;
        req.session.admin = userData.adminID;

        res.send({ status: "good", message: 'Login success', action: "/admin/" });
    } catch (error) {
        res.send({ status: 'error', message: error });
    }
};
