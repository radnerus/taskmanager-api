const mongoose = require('mongoose');

mongoose.connect(process.env.MONGOOSE_CONNECTION_STRING, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false });