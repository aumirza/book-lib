import { Card, CardMedia } from "@mui/material"
import { useEffect, useState } from "react"

export const Book = ({ book }) => {

  const [image, setImage] = useState()
  useEffect(() => {
    fetch()
      .then(res => res.blob())
      .then(blob => { setImage(URL.createObjectURL(blob)) })
  }, [])


  return (
    <Card>
      <CardMedia height="300" component="img" src={image} />
    </Card>
  )
}
