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
        if(!user){

            return res.status(401).json({ msg: "User no longer exists" });
        }
        return res.json({
            message: 'Auth verify',
            user: user
        })

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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.password,salt);

        const newUser = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        const payload = {
                id: newUser.id,
                role: newUser.role
        }

        const token =  jwt.sign(payload, process.env.JWT_SECRET as string, {expiresIn: '1h'});


        return res.status(201).json({
            message: 'Registered successfully',
            user: newUser,
            token
        });

    }catch(err){
        console.log(err)
        res.status(500).json({msg: "Something went wrong"});
    }
});

userRouter.post("/login", async(req , res)=> {
    try{
        const validatedData = loginSchema.parse(req.body);

        const registeredUser = await prisma.user.findUnique({
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

        if(registeredUser){
            const validUser = await bcrypt.compare(validatedData.password, registeredUser.password)
            if(!validUser){
                throw new Error('User not found')
            }else{
                const payload = {
                    id: registeredUser.id,
                    name: registeredUser.name,
                    role: registeredUser.role
                }

                const token = await jwt.sign(payload, process.env.JWT_SECRET as string , {
                        expiresIn: '1h'
                });


                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV == 'production',
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                    maxAge: 60 * 60 * 1000
                });

                const safeUser = {
                    id: registeredUser.id,
                    name: registeredUser.name,
                    email: registeredUser.email,
                    role: registeredUser.role
                }
                return res.status(200).json({
                    message: 'Login successfully',
                    user: safeUser
                });
            }
        }
        return res.status(400).json({msg: "Invalid credentials"})

    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong!"})
    }
});

userRouter.post('/logout', async(req , res) => {
    res.clearCookie('token');
    res.json({
        message:'logout successfully'
    })
})

export default userRouter;