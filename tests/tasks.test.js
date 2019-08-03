const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Task = require('../src/models/task');
const {userOneID, userOne, userTwo, setUpDatabase, taskOne, taskTwo, taskThree} = require('./fixtures/db');

const taskOneID = new mongoose.Types.ObjectId();


beforeEach(setUpDatabase);

test('Should create task', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test'
        })
        .expect(201);

    const task = await Task.findById(response.body._id);
    expect(task.description).toBe('From my test');
    expect(task.completed).toBe(false);
});

test('Get tasks only for current user', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    expect(response.body.length).toBe(2);
});

test('Should not allow unauthorized delete', async () => {
    const response = await request(app)
        .delete(`/task/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404);
    const task = Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})