import { Router } from "express";
import { auth, checkRole } from "../../../middlewares/auth";
import { prisma } from "../../../lib/prisma";
import { supabase } from "../../../lib/supabase";
import { upload } from "../../../middlewares/multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { title } from "node:process";



const adminRouter = Router();

adminRouter.get("/verify",auth, async(req ,res)=> {
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
        });
        if(!user){
            return res.status(404).json({msg: "User not found"})
        }
        res.json(user)

    }catch(er){
        console.log(er)
        return res.status(500).json({msg: "Something went wrong"})
    }
})

adminRouter.post("/login", async(req , res)=> {
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
        role: true
      }
    });
    if(user){
      if(user.role !== "ADMIN"){
        return res.status(400).json({msg: "Invalid credentials"})
      }
      if(await bcrypt.compare(password, user.password)){
        const token = jwt.sign({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },process.env.JWT_SECRET as string, {
          expiresIn: "2hr"
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

adminRouter.get("/books/search", auth, checkRole('ADMIN'), async(req ,res)=>{
  try{
    const { q } = req.query as {q?: string};
    if(!q || typeof q !== 'string' || q.trim().length === 0){
      return res.status(400).json({msg: 'Query is required!'})
    }
    const searchedTerm = q.trim();
    const searchedResult = await prisma.book.findMany({
      where: {
        OR: [
          {title: {contains: searchedTerm, mode: 'insensitive'}},
          {author: {contains: searchedTerm, mode: 'insensitive'}}
        ]
      },
      take: 10,
      orderBy: {
        title: 'asc'
      }

      });
      res.json(searchedResult);

  }catch(err){
    console.log(err);
    return res.status(500).json({msg: 'Something went wrong!'})
  }
});

adminRouter.get("/books",auth, checkRole("ADMIN"), async (req, res) => {
  try {
    const books = await prisma.book.findMany();
    res.json(books);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});

adminRouter.get("/books/:id",auth, checkRole("ADMIN"), async(req ,res)=> {
  try{
    const {id} = req.params;
    const book = await prisma.book.findUnique({
      where: {id: Number(id)}
    });
    if(!book){
      return res.status(404).json({msg: "Book not found"});
    }
    res.json(book);


  }catch(err){
    console.log(err);
    res.status(500).json({msg: "Something went wrong!"})
  }
})

adminRouter.post("/books", auth, checkRole("ADMIN"), upload.single("coverImage"), async (req, res) => {
  try {
    const title = req.body?.title;
    const author = req.body?.author;
    const description = req.body?.description;
    const isbn = req.body?.isbn;
    const language = req.body?.language;
    const genreId = req.body?.genreId;
    const coverImage = req.file;


    if (!title || !author || !description || !language || !genreId) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!coverImage) {
      return res.status(400).json({ msg: "Cover image is required" });
    }
    let parsedGenres:{id: number}[]  = []
    if(genreId){
      try{
        const isArray = JSON.parse(genreId);
        parsedGenres = isArray.map((id:number) => ({id: Number(id) }));


      }catch(err){
        const isArray = genreId.split(',');
        parsedGenres = isArray.map((id:string) => ({id: Number(id.trim()) }));
      }

    }

    const existingBook = await prisma.book.findFirst({
      where: { title: title, author: author },
    });
    if (existingBook) {
      return res.status(400).json({ msg: "Book already exists" });
    }

    const fileName = `${Date.now()}-${coverImage.originalname}`;

    const { error } = await supabase.storage
      .from("books")
      .upload(fileName, coverImage.buffer, {
        contentType: coverImage.mimetype,
        upsert: false,
      });
    if (error) {
      console.log("SUPABASE ERROR:", error)
      return res.status(500).json({ msg: "Something went wrong with supabase!" });
    }
    const { data: publicUrlData } = supabase.storage
      .from("books")
      .getPublicUrl(fileName);

    if (publicUrlData) {
      const book = await prisma.book.create({
        data: {
          title: title,
          author: author,
          description: description,
          isbn: isbn ? String(isbn) : null,
          language: language,
          coverImage: publicUrlData.publicUrl,
          genres: {
            connect: parsedGenres
          },
        },
        include: {
          genres: true,
        },
      });
      res.status(201).json(book);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Something went wrong!" });
  }
});

adminRouter.put("/books/:id",auth, checkRole("ADMIN"),upload.single("coverImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id: Number(id) },
    });
    if (!book) {
      return res.status(404).json({ msg: "Book not found" });
    }
    const { title, author, description, isbn, language, genreId } = req.body;
    if (!title || !author || !description || !language || !genreId) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    let parsedGenres:{id: number}[] = [];
    if(genreId){
      try{
        const isArray = JSON.parse(genreId);
        parsedGenres =  isArray.map((id:number) => ({id: Number(id) }));


      }catch(err){
        const isArray = genreId.split(',');
        parsedGenres = isArray.map((id:string) => ({id: Number(id.trim()) }));
      
      }
    }

    let updateData: {
      title: string;
      author: string;
      description: string;
      language: string;
      isbn: string | null;
      coverImage?: string;
      genres?: {
        set: { id: number }[];
      };
    } = {
      title: title,
      author: author,
      description: description,
      language: language,
      isbn: isbn ? String(isbn) : null,
      genres: {
        set: parsedGenres,
      },
    
    };

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { error } = await supabase.storage
        .from("books")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        return res.status(500).json({ msg: "Something went wrong!" });
      }
      const { data: publicUrlData } = supabase.storage
        .from("books")
        .getPublicUrl(fileName);
      updateData.coverImage = publicUrlData.publicUrl;
    }

    const updatedBook = await prisma.book.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        genres: true,
      },
    });

    res.json(updatedBook);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});

adminRouter.delete("/books/:id",auth, checkRole("ADMIN"),async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id: Number(id) },
    });
    if (!book) {
      return res.status(404).json({ msg: "Book not found" });
    }
    const fileName = book.coverImage.split("/").pop() as string;
    const { error } = await supabase.storage.from("books").remove([fileName]);
    if (error) {
      return res.status(500).json({ msg: "Something went wrong!" });
    }
    await prisma.book.delete({
      where: { id: Number(id) },
    });
    res.json({ msg: "Book deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});

export default adminRouter;
