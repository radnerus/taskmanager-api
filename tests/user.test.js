const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const {userOneID, userOne, setUpDatabase} = require('./fixtures/db');

beforeEach(setUpDatabase);

test('Should signup an new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Surendar V',
        email: 'suren@example.com',
        password: 'letitbe1'
    }).expect(201);
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();
    expect(response.body).toMatchObject({
        user: {
            name: 'Surendar V',
            email: 'suren@example.com'
        }
    });
    expect(user.password).not.toBe('letitbe1');
});

test('Should able to login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);
    const user = await User.findById(userOneID);
    expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should able to reject for invalid credentials', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: `${userOne.password}wrong`
    }).expect(400);
});

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
});

test('Should not get profile for unauthorized user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
});

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    const user = await User.findById(userOneID);
    expect(user).toBeNull();
});

test('Should not delete account for unauthorized user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
});

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);
});

test('Should alow users to update profile', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Surendar Vinayagamoorthy'
        })
        .expect(200);
})

test('Should not alow users to update profile for unknown fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Chennai'
        })
        .expect(400);
})