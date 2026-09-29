import { Router } from "express";
import { prisma } from "../../../lib/prisma";

const genreRouter = Router();

genreRouter.get("/", async(req , res)=>{
    try{
        const genres = await prisma.genre.findMany();
        res.json({
            message: 'All genres retrieved',
            data: genres
        });

    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"});
    
    }
});

genreRouter.get("/:id", async(req ,res) => {
    try{
        const {id} = req.params;
        const genre = await prisma.genre.findUnique({
            where: {id: Number(id)},
            include: {
                books: true
            }
        });
        if(!genre){
            return res.status(404).json({msg: "Genre not found"});
        }
        res.json(genre);

    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"});
    
    }
});

genreRouter.post("/", async(req ,res)=> {
    try{
        const {name} = req.body;
        if(!name){
            return res.status(400).json({msg: "Name is required"});
        }
        const genre = await prisma.genre.create({
            data: {
                name: name
            }
        });
        res.status(201).json({
            message: 'Save genre successfully',
            data: genre
        });


    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"});
    
    }
});

genreRouter.put("/:id", async(req ,res)=> {
    try{
        const {id} = req.params;
        if(!id){
            return res.status(400).json({msg: "ID is required"});
        }
        const genre = await prisma.genre.findUnique({
            where: {id: Number(id)}
        });
        const {name} = req.body;
        const updatedGenre = await prisma.genre.update({
            where: {id: Number(id)},
            data: {
                name: name
            }
        
        });
        res.json(updatedGenre);

    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"});
    
    }
});

genreRouter.delete("/:id" , async(req ,res)=> {
    try{
        const {id } = req.params;
        if(!id){
            return res.status(400).json({msg: "ID is required"});

        }
        const deletedGenre = await prisma.genre.delete({
            where: {id: Number(id)}
        });
        res.json({msg: "Genre deleted successfully", data: deletedGenre});


    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong"});
    
    
    }
});

export default genreRouter;