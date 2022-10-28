import * as auth from './services/auth.js';
import { randomId } from './services/util.js';
import * as db from './services/schema.js';


export const dashboard = async (req, res, next) => {
    try {

        let userData = await db.users.find();

        let data = {
            layout: 'admin/layout',
            title: `Admin-panel`,
            user: req.admin,
            users:[]
        };

        for (let i = 0; i < userData.length; i++) {

            let dd = userData[i].creationTime.getDate();
            let mm = userData[i].creationTime.getMonth() + 1;
            let yyyy = userData[i].creationTime.getFullYear();

            let ddu = userData[i].lastLogin.getDate();
            let mmu = userData[i].lastLogin.getMonth() + 1;
            let yyyyu = userData[i].lastLogin.getFullYear();

            let dataOFUser = {
                name: userData[i].name,
                email: userData[i].email,
                orders: userData[i].orders,
                UID: userData[i].UID,
                creationTime: `${dd}-${mm}-${yyyy}`,
                lastLoginTime: `${ddu}-${mmu}-${yyyyu}`
            };

            data.users.push(dataOFUser);

        };

        res.render('admin/dashboard', data);

    } catch (error) {
        console.error(error);
    };
};



export const login = (req, res, next) => {
    res.render('admin/login');
};
/**
 * @param {Request} req 
 * @param {Response} res 
 * @param {import('express').NextFunction} next 
 */
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
