const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image.'));
        }
        cb(undefined, true);
    }
});

const userRouter = new express.Router();

// Create User
userRouter.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        const token = await user.generateAuthToken();
        sendWelcomeEmail(user.email, user.name);
        res.status(201).send({ user, token });
    } catch (err) {
        res.status(400).send(err);
    }
});

// User Login
userRouter.post('/users/login', async (req, res) => {
    try {
        const requestParams = req.body;
        const user = await User.findByCredentials(requestParams.email, requestParams.password);
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
    } catch (error) {
        res.status(400).send('Login failed');
    }
});

// User Logout
userRouter.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.status(200).send('User logged out.');
    } catch (error) {
        res.status(500).send('Logout request failed.');
    }
});

// User Logout from all sessions
userRouter.post('/users/logout/all', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send('User logged out all sessions.');
    } catch (error) {
        res.status(500).send('Logout request failed.');
    }
});

// Get All Users
// userRouter.get('/users', auth, async (req, res) => {
//     try {
//         const users = await User.find({});
//         res.status(200).send(users);
//     } catch (error) {
//         res.status(500).send(error);
//     }
// });

// My details
userRouter.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

// Get User by ID
// userRouter.get('/users/:id', auth, async (req, res) => {
//     try {
//         const _id = req.params.id;
//         const user = await User.findById(_id);
//         if (!user) {
//             return res.status(404).send('User not found!');
//         }
//         res.status(200).send(user);
//     } catch (error) {
//         res.status(500).send(error);
//     }
// });

// Update Me
userRouter.patch('/users/me', auth, async (req, res) => {
    try {
        const user = req.body;
        const allowedUpdates = ['name', 'email', 'password', 'age'];
        const updates = Object.keys(user);
        const foundUser = req.user;
        const isValid = updates.every((update) => {
            return allowedUpdates.includes(update);
        });
        if (!isValid) {
            return res.status(400).send('No a valid update request!');
        }
        updates.forEach(update =>
            foundUser[update] = user[update]
        );
        await foundUser.save();
        res.status(200).send(foundUser);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Update User
userRouter.patch('/users/:id', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.body;
        const allowedUpdates = ['name', 'email', 'password', 'age'];
        const updates = Object.keys(user);
        const isValid = updates.every((update) => {
            return allowedUpdates.includes(update);
        });
        if (!isValid) {
            return res.status(400).send('No a valid update request!');
        }
        const foundUser = await User.findById(id);
        if (!foundUser) {
            return res.status(404).send('User not found!');
        }
        updates.forEach(update =>
            foundUser[update] = user[update]
        );
        const updatedUser = await foundUser.save();
        res.status(200).send(updatedUser);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete by ID
// userRouter.delete('/users/:id', auth, async (req, res) => {
//     try {
//         const _id = req.params.id;
//         const deletedUser = await User.findByIdAndDelete(_id);
//         if (!deletedUser) {
//             return res.status(404).send('User not found!');
//         }
//         res.status(200).send(deletedUser);
//     } catch (error) {
//         res.status(400).send(error);
//     }
// });

// Delete Me
userRouter.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name);

        res.status(200).send('You are deleted successfully.');
    } catch (error) {
        res.status(400).send(error);
    }
});

// Add Avatar
userRouter.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const user = req.user;
    // user.avatar = req.file.buffer;
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    user.avatar = buffer;
    await user.save();
    res.send('Image uploaded successfully');
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// Delete Avatar
userRouter.delete('/users/me/avatar', auth, async (req, res) => {
    const user = req.user;
    user.avatar = undefined;
    await user.save();
    res.send(user);
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// User Avatar
userRouter.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error('User Image not found.');
        }
        res.set('Content-Type', 'image/png').send(user.avatar);
    } catch (error) {
        res.status(404).send(error);
    }
});

module.exports = userRouter;
