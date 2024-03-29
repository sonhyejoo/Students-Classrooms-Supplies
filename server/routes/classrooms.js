// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom, sequelize, StudentClassroom, Supply, Student } = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters
    /*
        name filter:
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors
    */
    const where = {};

    // Your code here
    let studentLimit
    if (req.query.studentLimit){
        studentLimit = req.query.studentLimit.split(',')
    }
    let min = 0;
    let max;
    if (studentLimit && studentLimit.length == 2 &&
        parseInt(studentLimit[0]) < parseInt(studentLimit[1])
    ){
        min = parseInt(studentLimit[0]);
        max = parseInt(studentLimit[1]);
        where.studentLimit = {
            [Op.between]: [min, max]}
    }
    else if (studentLimit && studentLimit.length == 1 &&
        parseInt(studentLimit[0]) > 0){
            where.studentLimit = studentLimit
    }
    else if (studentLimit){
        errorResult.errors.push({
            message: 'student limit should be an integer'
        })
        res.status(400).json(errorResult)
        return;

    }

    else if (req.query.studentLimit){
        errorResult.errors.push({
            message: 'Student limit should be two number: min, max'
        })
        res.status(400).json(errorResult)
        return;
    }

    let name
    if (req.query.name){
        name = req.query.name.toLowerCase()
        where.name = {[Op.substring]: name}
    }
    console.log(`name: ${where.name}`)

    const classrooms = await Classroom.findAll({
        where,
        include: {
            model: StudentClassroom,
            include: []
        },
        attributes: [ 'id', 'name', 'studentLimit',
        [
            sequelize.fn('avg', sequelize.col('grade')),
            'avgGrade'
        ],
        [
            sequelize.fn('count', sequelize.col('grade')),
            'numStudents'
        ]
],

        // Phase 1B: Order the Classroom search results
        // order: ['name']
        order: ['studentLimit']
    });

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        include: [
            {model: Supply,
            attributes: ['id', 'name', 'category', 'handed'],
            include: []},
            {
                model: Student,
                attributes: ['id', 'firstName', 'lastName', 'leftHanded'],
                include: []
            }]
        ,
        // Phase 7:
            // Include classroom supplies and order supplies by category then
                // name (both in ascending order)
            // Include students of the classroom and order students by lastName
                // then firstName (both in ascending order)
                // (Optional): No need to include the StudentClassrooms
        // Your code here
        order: [
            [Supply, 'category'],
            [Supply, 'name'],
            [Student, 'lastName'],
            [Student, 'firstName']
        ]
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    // Phase 5: Supply and Student counts, Overloaded classroom
        // Phase 5A: Find the number of supplies the classroom has and set it as
            // a property of supplyCount on the response
        // Phase 5B: Find the number of students in the classroom and set it as
            // a property of studentCount on the response
        // Phase 5C: Calculate if the classroom is overloaded by comparing the
            // studentLimit of the classroom to the number of students in the
            // classroom
        // Optional Phase 5D: Calculate the average grade of the classroom
    // Your code here

    // let supplyCount = await classroom.countSupplies()
    // console.log(`supplyCount: ${supplyCount}`)

    let studentCount = await classroom.countStudents()
    // let classroom1 = await Classroom.findByPk(req.params.id, {
    //     include: {
    //         model: StudentClassroom,
    //         include: []
    //     },
    //     attributes: [
    //         [
    //             sequelize.fn('avg', sequelize.col('grade')),
    //             'avgGrade'
    //         ],
    //     ]
    // })


    classroom = classroom.toJSON()
    // classroom1 = classroom1.toJSON()
    classroom.overloaded = false;
    if (studentCount > classroom.studentLimit){
        classroom.overloaded = true;
    }
    // classroom.avgGrade = classroom1.avgGrade
    // classroom.supplyCount = supplyCount;
    classroom.studentCount = studentCount
    res.json(classroom);
});

// Export class - DO NOT MODIFY
module.exports = router;
