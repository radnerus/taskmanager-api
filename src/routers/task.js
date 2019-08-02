const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')

const taskRouter = new express.Router();

// Create Task
taskRouter.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Fetch All Tasks
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
taskRouter.get('/tasks', auth, async (req, res) => {
    const match = {};
    const isCompleted = req.query.completed;
    const sortBy = req.query.sortBy;
    const sort = {};
    if (isCompleted === 'true') {
        match.completed = true;
    } else if (isCompleted === 'false') {
        match.completed = false;
    }
    if (sortBy && sortBy.includes(':')) {
        const sortPartitions = sortBy.split(':');
        sort[sortPartitions[0]] = sortPartitions[1] === 'desc' ? -1 : 1;
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Fetch Task by ID
taskRouter.get('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send('No tasks found for the provided id');
        }
        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Update task
taskRouter.patch('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const task = req.body;
        const allowedUpdates = ['description', 'completed'];
        const updates = Object.keys(task);
        const isValid = updates.every(update => allowedUpdates.includes(update));
        if (!isValid) {
            return res.status(400).send('Invalid updates');
        }
        const foundTask = await Task.findOne({ _id, owner: req.user._id });
        if (!foundTask) {
            return res.status(404).send('No tasks found for the provided id');
        }
        updates.forEach(update => foundTask[update] = task[update]);
        const updatedTask = await foundTask.save();
        res.send(updatedTask);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete Task by ID
taskRouter.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        // const deletedTask = await Task.findByIdAndDelete(_id);
        const deleteTask = await Task.findOne({ _id, owner: req.user._id });
        if (!deleteTask) {
            return res.status(404).send('No tasks found for the provided id');
        }
        deleteTask.remove();
        res.send(deleteTask);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = taskRouter;
