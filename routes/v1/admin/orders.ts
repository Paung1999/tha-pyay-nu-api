import { Router } from "express";
import { prisma } from "../../../lib/prisma";

const adminOrderRoute = Router();

adminOrderRoute.get("/", async(req , res)=> {
    try{
        const orders = await prisma.order.findMany({
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: {
                    select: {id: true, name: true, email: true}
                },
                orderItems:{
                    include: {
                        sellBook: {
                            include: {
                                book: true
                            }
                        }
                    }
                }
                
            },
            take: 10
        });
        res.json(orders);


    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"})
    }
});

adminOrderRoute.put("/:id/status", async(req ,res)=> {
    try{
        const {id} = req.params;
        const {status} = req.body;

        if(!status){
            return res.status(400).json({msg: "Status is required"});
        }
        const updatedOrder = await prisma.order.update({
            where: {id: Number(id)},
            data: {status: status}
        });
        res.json(updatedOrder);


    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"})
    
    }
});

export default adminOrderRoute;