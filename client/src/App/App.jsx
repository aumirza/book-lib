import { useEffect, useState } from "react"
import { Container, Grid } from "@mui/material"
import { Book, Header } from "../Components"
import libgen from "../utils/libgen"

export const App = () => {

  const [mirror, setMirror] = useState("")
  const [books, setBooks] = useState([])

  const getMirror = async () => await libgen.mirror()

  const searchHandler = async (query) => {
    setBooks(books)
  }

  useEffect(() => {
    getMirror()
      .then(mirror => { setMirror(mirror); console.log(mirror) })
      .catch(err => { console.log(err) })
  }, [])

  return (
    <>
      <Header search={searchHandler} />
      <Container sx={{ paddingTop: '80px' }} maxWidth="md" >
        <Grid container spacing={2} >
          {
            books && books.length > 0
              ? books.map(
                book =>
                  <Grid key={book.id} item xs={12} md={4} >
                    <Book book={book} />
                  </Grid>
              )
              : 'No books found'
          }
        </Grid>
      </Container>
    </>
  )
}
