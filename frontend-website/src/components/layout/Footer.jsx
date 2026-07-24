import {Box, Container, Typography, Link} from '@mui/material'

function Footer() {
    return (
        <Box component="footer" sx={{bgcolor: 'background.paper', py: 3, mt: 'auto'}}>
            <Container maxWidth="lg">
                <Typography variant="body2" color="text.secondary" align="center">
                    {'© '}
                    <Link color="inherit" href="/">
                        Сайт на React 19
                    </Link>{' '}
                    {new Date().getFullYear()}
                </Typography>
            </Container>
        </Box>
    )
}

export default Footer