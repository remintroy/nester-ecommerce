import nodeMailer from 'nodemailer';
import dotEnv from 'dotenv';
dotEnv.config();

const mailer = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD
    }
});

export const sendFrogetPasswordOtp = async (email, otp) => {
    return new Promise((resolve, reject) => {
        try {
            var mailOptions = {
                from: process.env.GMAIL_ID,
                to: email,
                subject: 'Forget password otp',
                html: `<h2>Your otp for recover reset password is : ${otp} <h2>`
            };

            mailer.sendMail(mailOptions, function (error, info) {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                };
            });
        } catch (error) {
            reject(error);
        };
    });
};

const test = async () => {
    try {
        const data = await sendFrogetPasswordOtp('mahe');
        console.log('RESULT_TEST => ', data);
    } catch (error) {
        console.log('TEST_ERROR => ', error);
    }
}
// test()