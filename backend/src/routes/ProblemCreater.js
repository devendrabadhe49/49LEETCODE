// const express = require('express');

// const problemRouter = express.Router();
// const adminMiddleware = require('../middleware/adminMiddleware');
// const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem} = require('../controllers/userProblem');
// const userMiddleware = require('../middleware/userMiddleware');


// //CREATE

// problemRouter.post("/create",adminMiddleware ,createProblem);
// problemRouter.put("/update/:id",adminMiddleware, updateProblem);
// problemRouter.delete("/delete/:id",adminMiddleware, deleteProblem);

// //READ
// problemRouter.get("/problemById/:id",userMiddleware,getProblemById);
// problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);
// // problemRouter.get("/problemSolvedByUser",userMiddleware, solvedAllProblembyUser);


// module.exports = problemRouter;




const express = require('express');

const problemRouter =  express.Router();
const adminMiddleware = require("../middleware/adminmiddleware");
const {
    createProblem,
    updateProblem,
    deleteProblem,
    getProblemById,
    getAllProblem,
    solveAllProblembyUser,
    submittedProblem,
} = require("../controllers/userProblem");
const userMiddleware = require("../middleware/usermiddleware");


// Create
problemRouter.post("/create",adminMiddleware ,createProblem);
problemRouter.put("/update/:id",adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware, deleteProblem);


problemRouter.get("/problemById/:id",userMiddleware,getProblemById);
problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);
problemRouter.get("/problemSolvedByUser", userMiddleware, solveAllProblembyUser);
problemRouter.get("/submittedProblemByUser/:id", userMiddleware, submittedProblem);


module.exports = problemRouter;
