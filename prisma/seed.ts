import bcrypt from "bcrypt";
import {prisma} from "../lib/prisma";
import {Role} from "../generated/prisma/enums"

const epicBooks = [
    {
        title: "The Fellowship of the Ring",
        author: "J.R.R. Tolkien",
        description: "A young hobbit is entrusted with a quest of doom: to journey across Middle-earth and cast the One Ring into the fires of Mount Doom.",
        isbn: "978-0544003415",
        language: "English",
        coverImage: "https://images.unsplash.com/photo-1608181186280-044fa9b42268?q=80&w=600&auto=format&fit=crop",
        genreName: "Fantasy",
        price: 18500,
        currency: "MMK",
        stockQuantity: 10,
        condition: "NEW",
    },
    {
        title: "The Second World War",
        author: "Winston S. Churchill",
        description: "A sweeping historical narrative of the global conflict, written by one of its central figures.",
        isbn: "978-0395416853",
        language: "English",
        coverImage: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=600&auto=format&fit=crop", 
        genreName: "History",
        price: 25000,
        currency: "MMK",
        stockQuantity: 8,
        condition: "NEW"
  },
  {
        title: "Dune",
        author: "Frank Herbert",
        description: "Set on the desert planet Arrakis, a young man must navigate a complex political landscape to secure the most valuable resource in the universe.",
        isbn: "978-0441172719",
        language: "English",
        coverImage: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600&auto=format&fit=crop",
        genreName: "Sci-Fi",
        price: 21000,
        currency: "MMK",
        stockQuantity: 12,
        condition: "NEW"
  }
]

async function main(){
    console.log("Seeding...");

    const user = await prisma.user.create({
        data: {
            name: "Alice",
            email: "alice@gmail.com",
            password: await bcrypt.hash('password', 10),
            role: Role.ADMIN
        }
    });
    console.log(user);

    for(const item of epicBooks){
        let genre = await prisma.genre.findFirst({
            where:{name: item.genreName}
        });
        if(!genre){
            genre = await prisma.genre.create({
                data: {
                    name: item.genreName
                }
            })
        }
        let book = await prisma.book.findFirst({
            where: {
                title: item.title,
                author: item.author
            }
        });
        if(!book){
            book = await prisma.book.create({
                data: {
                    title: item.title,
                    author: item.author,
                    description: item.description,
                    isbn: item.isbn,
                    language: item.language,
                    coverImage: item.coverImage,
                    genres: {
                        connect: {
                            id: genre.id
                        }
                    }

                }
            });
            console.log(`Added book metadata: ${book.title}`);
        }
        let sellBook = await prisma.sell_Book.findFirst({
            where: {
                bookId: book.id
            }
        });
        if(!sellBook){
            sellBook = await prisma.sell_Book.create({
                data:{
                    bookId: book.id,
                    price: item.price,
                    currency: item.currency,
                    stockQuantity: item.stockQuantity,
                    condition: item.condition,
                    isActive: true
                }
            });
            console.log(`Created store listing: ${sellBook.id}`)
        }
    }

    console.log("Seeding finished");
}
main()
    .then(async()=> {
        await prisma.$disconnect();
    })
    .catch(async(e)=> {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });