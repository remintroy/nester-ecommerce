import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZPRPAY_KEY_SECRET,
});

export const createOrder = (UID, orderID, amount) => {
    return new Promise((resolve, reject) => {

        orderID = (orderID + "").trim();

        const options = {
            amount: Number(amount) * 100,
            currency: "INR",
            receipt: `RECEIPT_${orderID}`
        };

        razorpay.orders.create(options, (err, order) => {
            if (err) reject(err);
            resolve(order);
        });
    });
};


export const verifyPurchace = (paymentID, orderID, signature) => {
    const Hmac = crypto.createHmac('sha256', process.env.RAZPRPAY_KEY_SECRET);
    Hmac.update(orderID + "|" + paymentID);
    const toMatch = Hmac.digest("hex");
    return toMatch === signature;
};

const test = async () => {
    console.log(verifyPurchace('pay_Kf9X91TElvIRS5', 'order_Kf9X2ivBRa4Q4V', 'e30e21602b903b59d1e86fe1404596786df4fe55d48bb74695254fa727b1e7a5'));
    console.log("[-] Payment Module RAZORPAY");
};

// test();