import jwt from "jsonwebtoken";
import express from "express";

type AuthPayload = {
    id: number;
    role: string;
    email: string;
}

export async function auth( req: express.Request ,res:express.Response , next:express.NextFunction){
    // const authorization = req.headers.authorization;
    // const token = authorization?.split(" ")[1];

    const token = req.cookies?.token;

    if(!token){
        return res.status(401).json({msg: "Unauthorized"})
    }
    try{
        const secret = process.env.JWT_SECRET as string;
        const decoded =jwt.verify(token, secret) as AuthPayload;
        res.locals.user = decoded;
        next();

    }catch(err){
        console.log(err)
        return res.status(401).json({msg: "Unauthorized"})
    
    }

}

export const checkRole = (requiredRole: string) => {
    return (req:express.Request , res:express.Response , next:express.NextFunction) => {
        const user = res.locals.user;
        console.log("checkRole:", { required: requiredRole, tokenUser: user });
        if(!user || user.role !== requiredRole){
            return res.status(403).json({msg: "Forbidden"})
        }
        next();
    
    }
}