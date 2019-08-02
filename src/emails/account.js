const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SEND_GRID_API_KEP);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'surendarandyou@gmail.com',
        subject: `Welcome, ${name}`,
        text: `Hey ${name}, Welcome to Task Manager.`
    });
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'surendarandyou@gmail.com',
        subject: `Thank you, ${name}`,
        text: `Hey ${name}, thanks for the wonderful support till date. Any last feedback before we part ways???`
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
};
