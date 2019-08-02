const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a +ve number.');
            }
        },
        default: 0
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) { throw new Error('Email is invalid'); }
        },
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        minlength: 6,
        trim: true,
        required: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) { throw new Error('Password should not contain the phrase \'password\''); }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Unable to login.');
    }
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
        throw new Error('Unable to login.');
    }
    return user;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_TOKEN);
    user.tokens.push({ token });
    await user.save();
    return token;
}

userSchema.methods.toJSON = function () {
    const user = this;
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;

    return userObj;
}

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

