// lecture custom api response and error handling last part
class ApiError extends Error{
    constructor(
        statusCode,
        message= "something went wrong",
        errors =[],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.data = null
        this.message = message
        this.success = false
        
    

    if(stack){
        this.stack = stack
    }else{
        Error.captureStackTrace(this, this.constructor)
    }
} 
}  

export {ApiError}
