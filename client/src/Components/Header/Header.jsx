import { alpha, AppBar, Box, IconButton, Input, styled, Toolbar, Typography } from '@mui/material'
import { Menu, Search } from '@mui/icons-material'

export const Header = ({ search }) => {

  const SearchBox = styled(Box)(({ theme }) => ({

    borderRadius: '5px',
    background: alpha(theme.palette.common.white, 0.3),

  }))

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <IconButton color="inherit">
              <Menu />
            </IconButton>
            <Typography component="div" variant="h6">
              Lib Gen
            </Typography>
          </Box>
          <form onSubmit={(e) => { e.preventDefault(); search(e.target.search.value) }} >
            <SearchBox >
              <IconButton color="inherit">
                <Search />
              </IconButton>
              <Input name='search' placeholder="Search" />
            </SearchBox>
          </form>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>
    </Box>
  )
}
