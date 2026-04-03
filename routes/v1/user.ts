import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { email, z } from "zod";

import {prisma} from "../../lib/prisma";
import {auth} from "../../middlewares/auth";

const userRouter = Router();

const registerSchma = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long").max(50, "Name must be at most 50 characters long"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string() 
}).refine((data)=> data.password === data.confirmPassword, {
    message: "Password doesn't match",
    path: ["confirmPassword"]

});

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required")
});

userRouter.get("/verify",auth, async(req ,res)=> {
    try{
        const {id} = res.locals.user;
        const user = await prisma.user.findUnique({
            where: {
                id: id
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        })
        res.json(user)

    }catch(er){
        console.log(er)
        return res.status(500).json({msg: "Something went wrong"})
    }
})

userRouter.post("/register", async(req , res )=> {
    try{
        const validatedData = registerSchma.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: {
                email: validatedData.email
            }
        });
        if(existingUser){
            return res.status(400).json({msg: "User already exists"})
        
        }

        const user = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: await bcrypt.hash(validatedData.password,10)
            }
        });
        res.status(201).json(user);

    }catch(err){
        console.log(err)
        res.status(500).json({msg: "Something went wrong"});
    }
});

userRouter.post("/login", async(req , res)=> {
    try{
        const validatedData = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: {
                email: validatedData.email
            },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: true,
            }

        });

        if(user){
            if(await bcrypt.compare(validatedData.password, user.password)){
                const token = jwt.sign({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role

                },process.env.JWT_SECRET as string, {
                    expiresIn: "24hr"
                
                });
                return res.json({user, token})
            }
        }
        return res.status(400).json({msg: "Invalid credentials"})

    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong!"})
    }
});

export default userRouter;