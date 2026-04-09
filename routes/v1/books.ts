import {Router} from "express";
import {prisma} from "../../lib/prisma";


const bookRouter = Router();

bookRouter.get("/search" , async(req ,res)=> {
    try{
        const { q } = req.query as {q?: string};
        if(!q || typeof q !== "string" || q.trim().length === 0){
            return res.status(400).json({msg: "Query is required"});
        }

        const searchTerm = q.trim();
        const searchResults = await prisma.sell_Book.findMany({
            where: {
                isActive: true,
                stockQuantity: {gt: 0},
                book:{
                    OR: [
                        {title: {contains: searchTerm, mode: "insensitive"}},
                        {author: {contains: searchTerm, mode: "insensitive"}},
                    ]
                }
            },
            include: {
                book: {
                    include: {
                        genres: true
                    }
                }
            },
            take: 10,
            orderBy: {
                book:{
                    title: "asc"
                }
            }
        });
        res.json(searchResults);


    }catch(err){
        console.log(err);
        return res.status(500).json({msg: "Something went wrong!"})
    }
});

bookRouter.get("/genres", async(req ,res)=> {
    try{
        const genres = await prisma.genre.findMany();
        res.json(genres);


    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong!"})
    }
})

bookRouter.get("/genres/:genreId", async(req ,res )=> {
    try{
        const genreId = parseInt(req.params.genreId);
        if(isNaN(genreId)){
            return res.status(400).json({msg: "Invalid genre ID"});

        }

        const genreListings = await prisma.sell_Book.findMany({
            where: {
                isActive: true,
                stockQuantity: {gt: 0},
                book: {
                    genres: {
                        some:{
                            id: genreId
                        }
                    }
                }
            },
            include: {
                book: {
                    include: {
                        genres: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        res.json(genreListings);

        
    }catch(err){
        console.log(err);
        res.status(500).json({msg: 'Something went wrong!'});
    }
});


bookRouter.get("/", async (req , res )=> {
    try{
        const listings = await prisma.sell_Book.findMany({
            where: {
                isActive: true
            },
            include: {
                book: {
                    include: {
                        genres: true
                    }
                }
            },
            take: 20
        });
        res.json(listings);

    }catch(err){
        console.log(err)
        res.status(500).json({msg: "Something went wrong"})
    
    }
});

bookRouter.get("/:id", async (req ,res)=> {
    try{
        const {id} = req.params;
        const listing = await prisma.sell_Book.findUnique({
            where: {
                id: Number(id)
            
            },
            include: {
                book: {
                    include: {
                        genres: true
                    }
                }
            }
        });
        if(!listing){
            return res.status(404).json({msg: "Book not found"});
        }
        res.json(listing);


    }catch(err){
        console.log(err);
        res.status(500).json({msg: "Something went wrong!"})
    }
});





export default bookRouter;

