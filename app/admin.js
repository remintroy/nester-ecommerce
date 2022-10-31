import * as auth from './services/auth.js';
import { randomId } from './services/util.js';
import * as db from './services/schema.js';

const layout = `admin_layout`

// admin dashboard
export const dashboard = async (req, res, next) => {

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

export const users = async (req, res, next) => {

    try {

        let allUsers = await db.users.find({}, { password: 0 });

        const userData = [];

        const dataToReadable = (date) =>{

            const date_ = new Date(date);

            let dd = date_.getDate();
            let mm = date_.getMonth()+1;
            let yyyy = date_.getFullYear();

            return `${isNaN(dd)?'00':dd}-${isNaN(mm)?'00':mm}-${isNaN(yyyy)?'0000':yyyy}`;
        }

        for(let i=0; i<allUsers.length; i++){
            
            let output = {};

            output.name = allUsers[i].name;
            output.phone = allUsers[i].phone;
            output.email = allUsers[i].email;
            output.loginProvider = allUsers[i].loginProvider;
            output.creationTime =  dataToReadable(allUsers[i].creationTime);
            output.lastLogin = dataToReadable(allUsers[i].lastLogin);
            output.blocked = allUsers[i].blocked;

            userData.push(output);
        };

        res.render('admin/users', {
            layout: layout,
            users: userData,
            currentPage: 'users'
        });

    } catch (error) {

        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Can't read user data from db `,
            code: 500
        });

    };

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

        res.send({ status: "good", message: 'Login success', action: "/admin_panel/" });
    } catch (error) {
        res.send({ status: 'error', message: error });
    }
};
