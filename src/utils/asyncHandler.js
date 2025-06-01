//wraping function in database to reuse it same database functionality


const asyncHandler =(requestHandler) =>{
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err));

    }

}


export {asyncHandler}

// method 2 --------->>>>


// const asyncHandler = () =>{}
// const asyncHandler = (func)=>async{()=>{}}
// bus ye bahar ka bracket nhi lagate


// const asyncHandler = (fn) => async(req, res, next)=> {
//     try {
//         await fn(req, res, next);

//     }catch(error){
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message

//         })

//     }

// }