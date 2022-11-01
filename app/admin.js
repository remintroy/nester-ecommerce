import * as auth from './services/auth.js';
import { randomId, dataToReadable } from './services/util.js';
import * as db from './services/schema.js';

const layout = `admin_layout`

// admin dashboard
export const dashboard = async (req, res) => {

    try {

        const data = {
            layout: layout
        };

        data.title = `Admin-panel`;
        data.admin = req.admin
        data.currentPage = 'dashboard';

        res.render('admin/dashboard', data);

    } catch (error) {
        console.error(error);
    };

};

export const users = async (req, res) => {

    try {

        let allUsers = await db.users.find({}, { password: 0 });

        const userData = [];

        for (let i = 0; i < allUsers.length; i++) {

            let output = {};

            output.name = allUsers[i].name;
            output.phone = allUsers[i].phone;
            output.email = allUsers[i].email;
            output.loginProvider = allUsers[i].loginProvider;
            output.creationTime = dataToReadable(allUsers[i].creationTime);
            output.lastLogin = dataToReadable(allUsers[i].lastLogin);
            output.blocked = allUsers[i].blocked;
            output.UID = allUsers[i].UID;

            userData.push(output);
        };

        res.render('admin/users', {
            layout: layout,
            users: userData,
            currentPage: 'users',
            currentPageA: 'users'
        });

    } catch (error) {

        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Can't read user data from db `,
            code: 500
        });

    };

};

export const disabledUsers = async (req, res) => {
    try {

        let allUsers = await db.users.find({}, { password: 0 });

        const userData = [];

        for (let i = 0; i < allUsers.length; i++) {

            let output = {};

            if (!allUsers[i]?.blocked) {
                continue;
            };

            output.name = allUsers[i].name;
            output.phone = allUsers[i].phone;
            output.email = allUsers[i].email;
            output.loginProvider = allUsers[i].loginProvider;
            output.creationTime = dataToReadable(allUsers[i].creationTime);
            output.lastLogin = dataToReadable(allUsers[i].lastLogin);
            output.blocked = allUsers[i].blocked;
            output.UID = allUsers[i].UID;

            userData.push(output);
        };

        res.render('admin/users', {
            layout: layout,
            users: userData,
            currentPage: 'diabledUsers',
            currentPageA: 'users'
        });

    } catch (error) {

        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Can't read user data from db `,
            code: 500
        });

    };
};

export const login = (req, res) => {
    res.render('admin/login', {
        layout: 'admin_auth_layout'
    });
};

export const loginApi = async (req, res) => {
    try {
        let userData = await auth.adminLogin(req.body);

        req.session.loggedIn = true;
        req.session.admin = userData.adminID;

        res.send({ status: "good", message: 'Login success', action: "/admin_panel/" });
    } catch (error) {
        res.send({ status: 'error', message: error });
    }
};

export const editUser = async (req, res) => {

    try {

        console.log(req.body)

        const output = await auth.validatior({ UID: req.params.UID });

        try {

            const userData = await db.users.findOne({ UID: output.UID });

            res.render('admin/editUser', {
                layout: layout,
                currentPageA: 'users',
                user: userData
            });

        } catch (error) {
            console.log(error)
            res.render('admin/404', { layout: layout, message: 'Unable to fetch userdata', code: 500 })
        };

    } catch (error) {
        res.render('admin/404', { layout: layout, message: error, code: '400' })
    };

};

export const editUserAPI = async (req, res) => {
    try {

        const output = await auth.userDataUpdate(req.body);

        res.send({ status: 'good', message: 'User data updated' });

    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};