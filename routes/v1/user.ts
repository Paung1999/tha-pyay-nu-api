import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {prisma} from "../../lib/prisma";
import {auth} from "../../middlewares/auth";

const userRouter = Router();

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
        const name = req.body?.name;
        const email = req.body?.email;
        const password = req.body?.password;
        const confirmPassword = req.body?.confirmPassword;
        if(!name || !email || !password || !confirmPassword){
            return res.status(400).json({msg: "All fields are required"})
        }

        if(password !== confirmPassword){
            return res.status(400).json({msg: "Password doesn't match"})
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if(existingUser){
            return res.status(400).json({msg: "User already exists"})
        
        }

        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: await bcrypt.hash(password,10)
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
        const email = req.body?.email;
        const password = req.body?.password;

        if(!email || !password){
            return res.status(400).json({msg: "All fields are required"})

        }

        const user = await prisma.user.findUnique({
            where: {
                email: email
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
            if(await bcrypt.compare(password, user.password)){
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