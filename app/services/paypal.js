import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const baseURL = 'https://api-m.sandbox.paypal.com';

const generateAccessTocken = async () => {
    const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;

    const response = await axios({
        method: 'POST',
        url: baseURL + '/v1/oauth2/token',
        data: 'grant_type=client_credentials',
        auth: {
            username: PAYPAL_CLIENT_ID,
            password: PAYPAL_APP_SECRET
        }
    });
    return (response.data.access_token);
};

export const capturePayment = async (orderID) => {
    const accessTocken = await generateAccessTocken();
    const url = `${baseURL}/v2/checkout/orders/${orderID}/capture`;
    const response = await axios({
        url: url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessTocken}`
        }
    });
    return response.data;
};

export const createOrder = async (UID, orderID, amountInInr) => {
    const accessTocken = await generateAccessTocken();
    const url = `${baseURL}/v2/checkout/orders/`;
    const response = await axios({
        url: url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessTocken}`
        },
        data: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: amountInInr
                    }
                }
            ]
        })
    });
    return response.data;
};

async function test() {
    try {
        const order = await createOrder();
        const result = await capturePayment(order.id);
        console.log(order?.id);
    } catch (error) {
        console.log('Error => ', error.response.data);
    }
}
// test();
