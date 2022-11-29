import * as db from './schema.js';
import * as auth from './auth.js';

export const addAmount = async (UID, amount, message) => {
    try {
        const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
        try {
            const existingDOC = await db.wallets.find({ UID: userOutput.UID });

            if (existingDOC.length > 0) {
                const updated = await db.wallets.updateOne({ UID: userOutput.UID }, {
                    $inc: {
                        amount: amount
                    },
                    $push: {
                        transactions: {
                            amount: amount,
                            flow: 'TO',
                            date: new Date(),
                            message: message ? (message + "").trim() : message
                        }
                    }
                });
                return updated;
            } else {
                const created = await db.wallets({
                    UID: userOutput.UID,
                    amount: amount,
                    transactions: [{
                        amount: amount,
                        flow: 'TO',
                        date: new Date(),
                        message: message ? (message + "").trim() : message
                    }]
                });
                return await created.save();
            };
        } catch (error) {
            throw 'Error adding amount to wallet';
        };
    } catch (error) {
        throw error;
    };
};

const test = async () => {
    try {

        const data = await addAmount('6pxw23gPVG0AlKh3IE6or782V', 100);

        console.log('TEST_RESULT => ', data);
    } catch (error) {
        console.log('TEST_ERR => ', error);
    }
}
// test();