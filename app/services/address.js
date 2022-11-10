import * as auth from './auth.js';
import * as db from './schema.js';

const createAndAdd = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, phone, country, houseNumber, streetNumber, town, state, postalCode, email } = address;
            const data = await db.address({
                UID: UID,
                address: [
                    {
                        name: name,
                        phone: phone,
                        country: country,
                        houseNumber: houseNumber,
                        streetNumber: streetNumber,
                        town: town,
                        state: state,
                        postalCode: postalCode,
                        email: email,
                        type: 'primary'
                    }
                ]
            });
            data.save();
            resolve("Address successfully added");
        } catch (error) {
            reject('Error adding address to db');
        };
    });
};
const addToExisting = (UID, existingData, address) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, phone, country, houseNumber, streetNumber, town, state, postalCode, email } = address;

            const data = await db.address.updateOne({ UID: UID }, {
                $push: {
                    address: {
                        type: existingData[0].address?.length > 0 ? "secondary" : 'primary',
                        name: name,
                        phone: phone,
                        country: country,
                        houseNumber: houseNumber,
                        streetNumber: streetNumber,
                        town: town,
                        state: state,
                        postalCode: postalCode,
                        email: email
                    }
                }
            });
            resolve("Address successfully added");
        } catch (error) {
            reject('Error adding address to db');
        };
    });
};
const updateAddress = (UID, existingData, newAddress) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { addressID } = newAddress;
            // index of existing address
            const index = existingData[0].address.map(e => e._id == addressID).indexOf(true);
            let finalOutput;

            if (index == -1) finalOutput = await addToExisting(UID, existingData, newAddress);
            else {
                // updating existing address

                const keys = Object.keys(newAddress);
                const output = {};

                keys.forEach((e, i, a) => {
                    if (newAddress[e] && e != 'addressID' && e != 'UID') {
                        output[`address.${index}.${e}`] = newAddress[e];
                    };
                });

                try {
                    finalOutput = await db.address.updateOne({ UID: UID }, {
                        $set: output
                    });
                } catch (error) {
                    reject('Error updating to db');
                };

                resolve("Address updated successfully"); return 0;
            };

            resolve('No address found with provided id thus created new address');

        } catch (error) {
            console.log('error=>', error);
            reject("Error updating address to db");
        };
    });
};

export const validator = (UID, address) => {
    return new Promise(async (resolve, reject) => {

        const { name, phone, country, houseNumber, streetNumber, town, state, postalCode, email, addressID } = address;

        try {
            const userOutput = await auth.validatior(
                {
                    UID: UID,
                    name: name,
                    phone: phone,
                    email: email,
                    country: country
                },
                {
                    UIDRequired: true
                }
            );

            if ((houseNumber + "").length < 1) throw 'Invalid house number / name';
            else userOutput.houseNumber = houseNumber;

            if ((streetNumber + "").length < 1) throw 'Invalid street number / name';
            else userOutput.streetNumber = streetNumber;

            if (isNaN(Number(postalCode)) && postalCode || postalCode < 1) throw 'Invalid postal code';
            else userOutput.postalCode = postalCode;

            if (town) userOutput.town = town;
            if (state) userOutput.state = state;
            if (addressID) userOutput.addressID = addressID;

            resolve(userOutput);
        } catch (error) {
            reject(error);
        };
    });
};

export const add = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {

            const addressOutput = await addressValidator(UID, address);

            try {
                // checks for existing data
                const existingData = await db.address.find({ UID: addressOutput.UID });

                let finalOutput;

                if (existingData.length == 0) finalOutput = await createAndAdd(addressOutput.UID, addressOutput);
                else finalOutput = await addToExisting(addressOutput.UID, existingData, addressOutput);

                resolve(finalOutput);

            } catch (error) {
                reject(error);
            };

        } catch (error) {
            reject(error);
        };
    });
};
export const update = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {

            const addressOutput = await validator(UID, address);

            try {
                // checks for existing data
                const existingData = await db.address.find({ UID: addressOutput.UID });

                let finalData;

                if (existingData.length > 0) finalData = await updateAddress(UID, existingData, addressOutput);
                else finalData = await createAndAdd(UID, addressOutput);

                resolve(finalData);

            } catch (error) {
                reject(error);
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const deleteAddress = (UID, bodyWithAddressID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const addressOutput = await validator(UID, bodyWithAddressID);

            try {

                const data = await db.address.updateOne({ UID: addressOutput.UID }, {
                    $pull: {
                        'address': { _id: addressOutput.addressID }
                    }
                });

                if (data.modifiedCount > 0) {
                    resolve("Address removed successfully");
                } else {
                    resolve("Nothing to remove");
                };

            } catch (error) {
                reject("Error removing address from db");
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};
export const getAll = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            try {
                const data = await db.address.findOne({ UID: userOutput.UID });
                resolve(data?.address);

            } catch (error) {
                console.log(error)
                reject('Error while fetching address');
            };

        } catch (error) {
            reject(error);
        };
    });
};