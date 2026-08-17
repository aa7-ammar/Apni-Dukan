const asyncHandler = (fn) => async (req,res,next)=>{
    try{
        await fn(req,res,next)
    }
    catch(error){
        console.error(`${req.method} ${req.originalUrl} failed:`, error)

        if(error.name === "ValidationError" || error.name === "CastError"){
            return res.status(400).json({
                success:false,
                message:error.message
            })
        }

        // error.code is not an HTTP status: Mongo duplicate keys set 11000 and
        // axios sets strings like ERR_BAD_REQUEST. Passing either to
        // res.status() throws inside this catch and the request never answers.
        const status =
            Number.isInteger(error.statusCode) &&
            error.statusCode >= 400 &&
            error.statusCode <= 599
                ? error.statusCode
                : 500

        res.status(status).json({
            success:false,
            message:error.message
        })
    }
}
export default asyncHandler
