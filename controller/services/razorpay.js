import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZPRPAY_KEY_SECRET,
});

export const createOrder = (UID, orderID, amount) => {
    return new Promise((resolve, reject) => {

        // order id 
        orderID = (orderID + "").trim();

        //..
        const options = {
            amount: Number(amount) * 100,
            currency: "INR",
            receipt: `RECEIPT_${orderID}`
        };
        //..
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
    const order = await createOrder('hi','alskdflaskdfh','600')
    console.log(order);
};

// test();