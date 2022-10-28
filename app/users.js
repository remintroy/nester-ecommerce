export const home = (req, res, next) => {
    res.render('users/login',{layout:'users/authLayout'});
}