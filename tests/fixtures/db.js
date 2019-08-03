const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneID = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneID,
    name: 'Test User',
    email: 'test@test.com',
    password: 'test@test',
    tokens: [
        {
            token: jwt.sign({ _id: userOneID }, process.env.JWT_TOKEN)
        }
    ]
};

const userTwoID = new mongoose.Types.ObjectId();
const userTwo = {
    _id: userTwoID,
    name: 'Test User1',
    email: 'test1@test.com',
    password: 'test@test1',
    tokens: [
        {
            token: jwt.sign({ _id: userTwoID }, process.env.JWT_TOKEN)
        }
    ]
};

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Task 1',
    completed: false,
    owner: userOneID
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Task 2',
    completed: false,
    owner: userTwoID
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Task 3',
    completed: false,
    owner: userOneID
}

const setUpDatabase = async () => {
    await User.deleteMany({});
    await Task.deleteMany({});
    await new User(userOne).save();
    await new User(userTwo).save();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
}

module.exports = {
    userOneID, userOne, setUpDatabase, taskOne, taskTwo, taskThree, userTwo
};
