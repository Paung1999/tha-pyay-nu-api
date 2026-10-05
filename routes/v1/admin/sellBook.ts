import { Router } from "express";
import { prisma } from "../../../lib/prisma";

const sellBookRouter = Router();

sellBookRouter.get("/search", async(req , res)=> {
    try{
        const { q } = req.query as {q?: string}
        if(!q || typeof q !== 'string' || q.trim().length === 0){
            return res.status(400).json({msg: 'Query is required'});
        }
        const searchedTerm = q.trim();
        const searchedResult = await prisma.sell_Book.findMany({
            where: {
                isActive:true,
                book:{
                    OR: [
                        {title: {contains: searchedTerm, mode: 'insensitive'}},
                        {author: {contains: searchedTerm, mode: 'insensitive'}},
                    ]
                }
            },
            include:{
                book: true
            },
            take: 10,
            orderBy: {
                book: {
                    title: 'asc'
                }
            }
        });
        return res.status(200).json({
            message: 'Searched book retrieved',
            data: searchedResult
        })

    }catch(err){
        console.log(err);
        return res.status(500).json({msg: 'Something went wrong!'});
    }
});

sellBookRouter.post("/", async(req , res)=> {
    try{
        const {bookId , price , currency, stockQuantity, condition} = req.body;

        if(!bookId || !price || !currency || stockQuantity == undefined || !condition){
            return res.status(400).json({msg: "All fields are required"})

        }
        const existingBook = await prisma.book.findUnique({
            where: {
                id: bookId
            
            }
        });
        if(!existingBook){
            return res.status(400).json({msg: "Book not found! Cannot list for sale"})

        }

        const book = await prisma.sell_Book.create({
            data: {
                bookId: Number(bookId),
                price: Number(price),
                currency: currency,
                stockQuantity: Number(stockQuantity),
                condition: condition || "NEW",
                isActive: true
            }
        });
        res.status(201).json({
            message: 'Listed book successfully',
            data: book
        });


    }catch(err){
        console.log(err)
        res.status(500).json({msg: "Something went wrong"})
    
    }
});

sellBookRouter.get("/", async(req , res)=> {
    try{
        const inventory = await prisma.sell_Book.findMany({
            include: {
                book: true

            }
        });
        return res.status(200).json({
            message: 'All listing books retrieved',
            data: inventory
        });


    }catch(err){
        console.log(err)
        res.status(500).json({msg: "Something went wrong"})
    
    }
});

sellBookRouter.get("/:id", async(req ,res)=> {
    try{
        const {id} = req.params;
        const book = await prisma.sell_Book.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                book: true
            }

        });
        if(!book){
            return res.status(404).json({msg: "Book not found"});
        }
        return res.status(200).json({
            message: 'sell book by id',
            data: book
        })

    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong!"})
    }
})

sellBookRouter.put("/:id", async(req , res)=> {
    try{
        const {id} = req.params;
        const book = await prisma.sell_Book.findUnique({
            where: {
                id: Number(id)
            }
        });
        if(!book){
            return res.status(404).json({msg: "Book not found"});
        }

        const {price , currency, stockQuantity, condition, isActive} = req.body;

        if(!price || !currency || stockQuantity == undefined || !condition){
            return res.status(400).json({msg: "All fields are required"});
        }

        const updatedBook = await prisma.sell_Book.update({
            where: {id: Number(id)},
            data: {
                price: price,
                currency: currency,
                stockQuantity: Number(stockQuantity),
                condition: condition,
                isActive:  isActive ?? book.isActive,
            }
                
        });
        return res.status(201).json({
            message: 'Listed book updated successfully',
            data: updatedBook
        })


    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"});
    }
});

sellBookRouter.delete("/:id", async(req ,res)=> {
    try{
        const {id} = req.params;
        const book = await prisma.sell_Book.findUnique({
            where: {id: Number(id)}
        });
        if(!book){
            return res.status(404).json({msg: "Book not found"});

        }

        await prisma.sell_Book.delete({
            where: {id: Number(id)}
        });
        res.json({msg: "Book deleted successfully"});

    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"});
    }
})

export default sellBookRouter;