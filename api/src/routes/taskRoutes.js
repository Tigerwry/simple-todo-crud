'use strict';

const express = require('express');
const controller = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All task routes require a valid session.
router.use(authenticate);

// `/search` must be declared before `/:id` so it is not captured as an id.
router.get('/search', controller.search);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
