# Nester - Ecommerce Site

This is the repository for my ecommerce site, built using Node.js and MongoDB.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- MongoDB

### Installing

1. Clone the repository: `git clone https://github.com/remindev/Nester-ECommerce.git`
2. Create `.env` and `firebaseConfig.json` file and add necessary configurations
3. Install the dependencies: `npm install`
4. Start the development server: `npm start`

**Firebase**   
You need to create an accound and get admin sdk config file from your app setting's. Then copy the file into cloned folder. Path must me accessable.

The `.env` file
```ini
NODE_ENV = development
SECRET_KEY = <SessionSecret>
USERDB_URL = <MongoDB connection URL>
GOOGLE_APPLICATION_CREDENTIALS = <Path to firebase admin sdk config file>
RAZORPAY_KEY_ID = <Your KEY id for razorpay api>
RAZPRPAY_KEY_SECRET = <Your SECRET for razorpay api>
PAYPAL_APP_SECRET = <Your SECRET for paypal api>
PAYPAL_CLIENT_ID = <Your CLIENT ID for paypal>
GMAIL_ID = <Gmail id for sending emails to users>
GMAIL_PASSWORD = <Passowrd of Gmail id>
```
You need replace these whith your api keys and secrets to `.env` file

## Deployment

The site can be deployed to a variety of hosting platforms, such as Heroku or AWS.

## Built With

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Express](https://expressjs.com/)

## Contributing

If you would like to contribute to the project, please fork the repository and submit a pull request.

## Authors

- [Remin T Roy](https://github.com/remindev)


