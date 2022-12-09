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

export const removeAmount = async (UID, amount, message) => {
    try {
        // validating user id
        const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });

        let existingDOC;

        try {
            // fetching data from db
            existingDOC = await db.wallets.find({ UID: userOutput.UID });
        } catch (error) {
            //..
            throw 'Error fetching required data';
        };

        // check if wallet has something
        if (existingDOC.length == 0) throw 'Cant remove amount from empty wallet';

        // if amount is in the cart or not
        if (existingDOC[0].amount < Number(amount)) throw 'Cant remove amount which is not in cart';

        try {
            const updated = await db.wallets.updateOne({ UID: userOutput.UID }, {
                $inc: {
                    amount: -Number(amount)
                },
                $push: {
                    transactions: {
                        amount: amount,
                        flow: 'FROM',
                        date: new Date(),
                        message: message ? (message + "").trim() : message
                    }
                }
            });
        } catch (error) {
            // handling error
            throw 'Error while updating amount from wallet';
        };

    } catch (error) {
        // handling error
        throw error;
    };
};

export const getWalletInfo = async (UID) => {
    try {

        const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });

        let walletData;

        try {

            walletData = await db.wallets.findOne({ UID: userOutput.UID });

        } catch (error) {
            throw 'Error fetching information';
        };

        // if (!walletData) throw 'Nothig to show';

        return walletData;

    } catch (error) {
        throw error;
    };
};

const test = async () => {
    try {

        const data = await removeAmount('6pxw23gPVG0AlKh3IE6or782V', 100, 'test');

        console.log('TEST_RESULT => ', data);
    } catch (error) {
        console.log('TEST_ERR => ', error);
    }
}
// test();